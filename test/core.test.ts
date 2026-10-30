import { describe, expect, it } from 'vitest'
import { FRAMES, FRAME_SCALE_MAX, FRAME_SCALE_MIN, frameClearance, generateFrame, generateOrnament, normalizeFrame, normalizeParams, PRESETS } from '../src/index.js'
import { createRng } from '../src/internal/rng.js'
import { composePreset } from '../src/internal/presets.js'
import { render } from '../src/internal/render.js'

describe('ornament generator', () => {
  it('is deterministic for a given preset and seed', () => {
    // Straight through compose and render, past generateOrnament's cache.
    const draw = (id: string) => render(composePreset(id as never, createRng(`${id}:4242`)), id).svg
    for (const p of PRESETS) expect(draw(p.id)).toBe(draw(p.id))
  })

  it('varies with the seed', () => {
    for (const p of PRESETS) {
      const a = generateOrnament({ preset: p.id, seed: 1 }).svg
      const b = generateOrnament({ preset: p.id, seed: 2 }).svg
      expect(a).not.toBe(b)
    }
  })

  it('draws well-formed ink for every preset across many seeds', () => {
    for (const p of PRESETS) {
      for (let seed = 1; seed <= 25; seed++) {
        const o = generateOrnament({ preset: p.id, seed })
        expect(o.svg).not.toMatch(/NaN|Infinity|undefined/)
        expect(o.svg).toMatch(/^<svg [^>]*fill="currentColor"/)
        expect(o.svg).toMatch(/ d="M/)
        // Flowers and leaves, not just a bare stem.
        expect(o.svg.length).toBeGreaterThan(3000)
      }
    }
  })

  it('keeps each preset at its declared aspect, so layout can reserve room', () => {
    for (const p of PRESETS) {
      const o = generateOrnament({ preset: p.id, seed: 9 })
      expect(o.width / o.height).toBeCloseTo(p.aspect, 3)
    }
  })

  it('only references its own defs', () => {
    for (const p of PRESETS) {
      const o = generateOrnament({ preset: p.id, seed: 5 })
      const ids = [...o.svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
      for (const m of o.svg.matchAll(/(?:href="#|url\(#)([^")]+)/g)) expect(ids).toContain(m[1])
    }
  })

  it('cuts the frieze out of a block', () => {
    expect(generateOrnament({ preset: 'frieze', seed: 3 }).svg).toMatch(/<mask [^>]*>.*<\/mask><\/defs><rect [^>]*mask="url\(#/)
  })

  it('normalizes params', () => {
    expect(normalizeParams({ preset: 'nope' as never, seed: -7.5 })).toEqual({ preset: 'vine', seed: 7 })
    expect(normalizeParams({ preset: 'sprig', seed: Number.NaN })).toEqual({ preset: 'sprig', seed: 0 })
  })
})

describe('frames', () => {
  const aspects = [1, 4 / 5, 9 / 16, 16 / 9, 3 / 4]

  it('draw well-formed ink at every card proportion', () => {
    for (const f of FRAMES) {
      for (const aspect of aspects) {
        for (const seed of [1, 2, 3]) {
          const o = generateFrame({ preset: f.id, seed }, aspect)
          expect(o.svg).not.toMatch(/NaN|Infinity|undefined/)
          expect(o.svg).toMatch(/^<svg [^>]*fill="currentColor"/)
          expect(o.width / o.height).toBeCloseTo(aspect, 3)
          const ids = [...o.svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
          for (const m of o.svg.matchAll(/(?:href="#|url\(#)([^")]+)/g)) expect(ids).toContain(m[1])
        }
      }
    }
  })

  it('cuts the block frame out of a ring', () => {
    expect(generateFrame({ preset: 'block', seed: 1 }, 1).svg).toMatch(/fill-rule="evenodd"[^>]*mask="url\(#/)
  })

  it('only accepts known frames', () => {
    expect(normalizeFrame(undefined)).toBeNull()
    expect(normalizeFrame({ preset: 'nope' as never, seed: 1 })).toBeNull()
    expect(normalizeFrame({ preset: 'corners', seed: -3.2 })).toEqual({ preset: 'corners', seed: 3, scale: 1 })
  })

  it('clamps the weight, and reads frames stored without one as natural size', () => {
    expect(normalizeFrame({ preset: 'border', seed: 1, scale: 9 })!.scale).toBe(FRAME_SCALE_MAX)
    expect(normalizeFrame({ preset: 'border', seed: 1, scale: 0.1 })!.scale).toBe(FRAME_SCALE_MIN)
    expect(normalizeFrame({ preset: 'border', seed: 1, scale: 1.234 })!.scale).toBe(1.25)
    expect(normalizeFrame({ preset: 'border', seed: 1, scale: NaN })!.scale).toBe(1)
    expect(generateFrame({ preset: 'border', seed: 1 }, 1).svg).toBe(generateFrame({ preset: 'border', seed: 1, scale: 1 }, 1).svg)
  })

  it('draws heavier frames at higher weights, at the same card proportion', () => {
    for (const f of FRAMES) {
      for (const scale of [FRAME_SCALE_MIN, 1, FRAME_SCALE_MAX]) {
        const o = generateFrame({ preset: f.id, seed: 2, scale }, 4 / 5)
        expect(o.svg).not.toMatch(/NaN|Infinity|undefined/)
        expect(o.width / o.height).toBeCloseTo(4 / 5, 3)
      }
      const light = frameClearance(f.id, 4 / 5, FRAME_SCALE_MIN)
      const natural = frameClearance(f.id, 4 / 5)
      const heavy = frameClearance(f.id, 4 / 5, FRAME_SCALE_MAX)
      expect(light.padH).toBeLessThan(natural.padH)
      expect(heavy.padH).toBeGreaterThan(natural.padH)
      expect(heavy.padV).toBeGreaterThan(natural.padV)
    }
  })
})

describe('seeded rng', () => {
  it('repeats per seed and forks independently', () => {
    const a = createRng(9)
    const b = createRng(9)
    const seqA = Array.from({ length: 5 }, () => a.next())
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(seqA)
    expect(createRng(9).fork('x').next()).not.toBe(createRng(9).fork('y').next())
  })
})
