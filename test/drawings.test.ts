import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { FRAMES, frameInset, generateFrame, generateOrnament, ornamentOutline, PRESETS } from '../src/index.js'

/**
 * Documents store an ornament as a preset and a seed, and redraw it on
 * open. So the drawing a seed gives is part of the contract: if one of
 * these hashes changes, every stored ornament of that preset looks
 * different. Fixes are fine, but update the snapshot on purpose, never
 * as a reflex.
 *
 * Hashes are of Node's output. Browsers can differ from Node in the last
 * bit of a trig result, so only the drawing is promised, not the bytes.
 */
const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

const SEEDS = Array.from({ length: 50 }, (_, i) => i)
const FRAME_SEEDS = Array.from({ length: 10 }, (_, i) => i)
const ASPECTS = [1, 4 / 5, 9 / 16, 16 / 9]
const SCALES = [0.6, 1, 1.6]

describe('ornament drawings stay put', () => {
  it('presets', () => {
    const out: Record<string, string> = {}
    for (const p of PRESETS) for (const seed of SEEDS) out[`${p.id}:${seed}`] = hash(generateOrnament({ preset: p.id, seed }).svg)
    expect(out).toMatchSnapshot()
  })

  it('outlines', () => {
    const out: Record<string, string> = {}
    for (const p of PRESETS) for (const seed of SEEDS.slice(0, 10)) out[`${p.id}:${seed}`] = hash(JSON.stringify(ornamentOutline({ preset: p.id, seed })))
    expect(out).toMatchSnapshot()
  })

  it('frames', () => {
    const out: Record<string, string> = {}
    for (const f of FRAMES)
      for (const seed of FRAME_SEEDS)
        for (const aspect of ASPECTS)
          for (const scale of SCALES)
            out[`${f.id}:${seed}:${aspect.toFixed(3)}:${scale}`] = hash(generateFrame({ preset: f.id, seed, scale }, aspect).svg)
    expect(out).toMatchSnapshot()
  })

  it('frame insets', () => {
    const out: Record<string, { x: number; y: number }> = {}
    for (const f of FRAMES) for (const aspect of ASPECTS) for (const scale of SCALES) out[`${f.id}:${aspect.toFixed(3)}:${scale}`] = frameInset(f.id, aspect, scale)
    expect(out).toMatchSnapshot()
  })

  it('preset and frame metadata', () => {
    expect({ PRESETS, FRAMES }).toMatchSnapshot()
  })
})
