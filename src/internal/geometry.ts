/**
 * Plane geometry for ornaments. Everything is drawn as filled outlines rather
 * than strokes: tapering, swelling lines are what make engraved ornament look
 * engraved, and fills survive every export path (canvas, snapdom, PDF) intact.
 *
 * Fill rule is nonzero throughout. Solids are wound one way and holes the
 * other (see `orient`), so overlapping strokes union instead of punching
 * holes where they cross.
 */

export interface Vec {
  x: number
  y: number
}

export type Poly = Vec[]

export const vec = (x: number, y: number): Vec => ({ x, y })
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s })
export const len = (a: Vec): number => Math.hypot(a.x, a.y)
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y)
export const polar = (angle: number, r = 1): Vec => ({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

export function signedArea(poly: Poly): number {
  let area = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    area += (poly[j].x - poly[i].x) * (poly[j].y + poly[i].y)
  }
  return area / 2
}

/** Winds solids positive and holes negative so nonzero fill does the right thing. */
export function orient(poly: Poly, hole: boolean): Poly {
  const positive = signedArea(poly) > 0
  return positive === !hole ? poly : [...poly].reverse()
}

/**
 * Outline of a variable-width line. `left` and `right` are half-widths per
 * point, which lets leaves and acanthus lobes swell on one side only.
 */
export function ribbon(points: Vec[], left: number[], right: number[] = left, roundStart = false): Poly {
  const n = points.length
  if (n < 2) return []
  const l: Vec[] = []
  const r: Vec[] = []
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(n - 1, i + 1)]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy) || 1
    const nx = -dy / d
    const ny = dx / d
    l.push({ x: points[i].x + nx * left[i], y: points[i].y + ny * left[i] })
    r.push({ x: points[i].x - nx * right[i], y: points[i].y - ny * right[i] })
  }

  const outline = [...l, ...r.reverse()]
  if (roundStart && left[0] + right[0] > 0.4) {
    // Semicircle from the right edge back round to the left edge.
    const p = points[0]
    const q = points[1]
    const heading = Math.atan2(q.y - p.y, q.x - p.x)
    const radius = (left[0] + right[0]) / 2
    const steps = 8
    for (let i = 1; i < steps; i++) {
      const a = heading - Math.PI / 2 - (Math.PI * i) / steps
      outline.push({ x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius })
    }
  }
  return outline
}

export function ellipse(center: Vec, rx: number, ry: number, rotation = 0, segments = 0): Poly {
  const n = segments || Math.max(12, Math.min(64, Math.round(Math.max(rx, ry) * 2.2)))
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const out: Poly = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const x = Math.cos(a) * rx
    const y = Math.sin(a) * ry
    out.push({ x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos })
  }
  return out
}

export const circle = (center: Vec, r: number): Poly => ellipse(center, r, r)

/** Affine map in SVG matrix order: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export interface Matrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

export function apply(m: Matrix, p: Vec): Vec {
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f }
}

export function multiply(m: Matrix, n: Matrix): Matrix {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  }
}

export const rotation = (angle: number): Matrix => ({
  a: Math.cos(angle), b: Math.sin(angle), c: -Math.sin(angle), d: Math.cos(angle), e: 0, f: 0,
})

/** Reflection across the line through the origin at `angle`. */
export const reflection = (angle: number): Matrix => ({
  a: Math.cos(2 * angle), b: Math.sin(2 * angle), c: Math.sin(2 * angle), d: -Math.cos(2 * angle), e: 0, f: 0,
})

export const translation = (x: number, y: number): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y })

export const isMirroring = (m: Matrix): boolean => m.a * m.d - m.b * m.c < 0

/** Ramer–Douglas–Peucker, keeping the first and last points. */
export function simplify(points: Vec[], tolerance: number): Vec[] {
  if (points.length <= 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  const tol2 = tolerance * tolerance
  while (stack.length) {
    const [s, e] = stack.pop()!
    const a = points[s]
    const b = points[e]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l2 = dx * dx + dy * dy
    let best = -1
    let bestD = tol2
    for (let i = s + 1; i < e; i++) {
      const p = points[i]
      let d: number
      if (l2 === 0) {
        d = (p.x - a.x) ** 2 + (p.y - a.y) ** 2
      } else {
        const cross = dx * (p.y - a.y) - dy * (p.x - a.x)
        d = (cross * cross) / l2
      }
      if (d > bestD) {
        bestD = d
        best = i
      }
    }
    if (best >= 0) {
      keep[best] = 1
      stack.push([s, best], [best, e])
    }
  }
  return points.filter((_, i) => keep[i])
}

const fmt = (n: number): string => {
  const r = Math.round(n * 10) / 10
  return Object.is(r, -0) ? '0' : String(r)
}

export function polyToPath(poly: Poly): string {
  if (poly.length < 3) return ''
  let d = `M${fmt(poly[0].x)} ${fmt(poly[0].y)}`
  for (let i = 1; i < poly.length; i++) d += `L${fmt(poly[i].x)} ${fmt(poly[i].y)}`
  return d + 'Z'
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function emptyBox(): Box {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
}

export function growBox(box: Box, p: Vec): void {
  if (p.x < box.minX) box.minX = p.x
  if (p.y < box.minY) box.minY = p.y
  if (p.x > box.maxX) box.maxX = p.x
  if (p.y > box.maxY) box.maxY = p.y
}
