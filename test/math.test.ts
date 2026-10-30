import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { atan, atan2, cos, exp, hypot, log, pow, sin } from '../src/internal/math.js'

/** Distance between two doubles in units in the last place. */
function ulps(a: number, b: number): number {
  if (Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b))) return 0
  const v = new DataView(new ArrayBuffer(16))
  v.setFloat64(0, a)
  v.setFloat64(8, b)
  return Math.abs(Number(v.getBigInt64(0) - v.getBigInt64(8)))
}

/** The same inputs on every machine: a plain LCG, no Math involved. */
function inputs(n: number, lo: number, hi: number): number[] {
  let s = 12345
  return Array.from({ length: n }, () => lo + ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32) * (hi - lo))
}

const ONE: [string, (x: number) => number, (x: number) => number, number, number][] = [
  ['sin', sin, Math.sin, -200, 200],
  ['cos', cos, Math.cos, -200, 200],
  ['atan', atan, Math.atan, -50, 50],
  ['exp', exp, Math.exp, -30, 30],
  ['log', log, Math.log, 1e-6, 1e4],
]
const TWO: [string, (x: number, y: number) => number, (x: number, y: number) => number][] = [
  ['atan2', atan2, Math.atan2],
  ['pow', (x, y) => pow(Math.abs(x), y), (x, y) => Math.pow(Math.abs(x), y)],
  ['hypot', hypot, Math.hypot],
]

describe('deterministic math', () => {
  it('stays within an ulp or two of the engine', () => {
    // Every engine's Math is within about an ulp of the truth, so of us too.
    for (const [, f, m, lo, hi] of ONE) for (const x of inputs(20000, lo, hi)) expect(ulps(f(x), m(x))).toBeLessThanOrEqual(2)
    const xs = inputs(20000, -10, 10)
    const ys = inputs(20000, -3, 3).reverse()
    for (const [, f, m] of TWO) for (let i = 0; i < xs.length; i++) expect(ulps(f(xs[i], ys[i]), m(xs[i], ys[i]))).toBeLessThanOrEqual(2)
  })

  it('handles zeros, infinities and NaN as Math does', () => {
    const specials = [0, -0, Infinity, -Infinity, NaN, 5e-324, 1e-310]
    for (const [name, f, m] of ONE) for (const x of specials) expect(f(x), `${name}(${x})`).toBe(m(x))
    for (const [name, f, m] of [['atan2', atan2, Math.atan2], ['pow', pow, Math.pow], ['hypot', hypot, Math.hypot]] as const)
      for (const x of [...specials, 1, -1, 2, -2]) for (const y of [...specials, 1, -1, 0.5, 3, -3]) expect(f(x, y), `${name}(${x}, ${y})`).toBe(m(x, y))
  })

  it('gives the same bits on every machine', () => {
    // If this changes, every ornament may move. CI checks it on x64 and arm64.
    const h = createHash('sha256')
    for (const [, f, , lo, hi] of ONE) for (const x of inputs(5000, lo, hi)) h.update(String(f(x)))
    const xs = inputs(5000, -10, 10)
    const ys = inputs(5000, -3, 3).reverse()
    for (const [, f] of TWO) for (let i = 0; i < xs.length; i++) h.update(String(f(xs[i], ys[i])))
    expect(h.digest('hex').slice(0, 16)).toMatchInlineSnapshot(`"71f71632a0bdcaba"`)
  })
})
