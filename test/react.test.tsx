// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { generateOrnament } from '../src/index.js'
import { Ornament, OrnamentArt, OrnamentFrame } from '../src/react.js'

afterEach(cleanup)

describe('react components', () => {
  it('draws an ornament that fills its box at its own proportions', () => {
    const { container } = render(<Ornament preset="sprig" seed={3} className="mine" />)
    const box = container.firstElementChild as HTMLElement
    const o = generateOrnament({ preset: 'sprig', seed: 3 })
    expect(box.className).toBe('mine')
    expect(box.getAttribute('aria-hidden')).toBe('true')
    expect(box.style.aspectRatio).toBe(`${o.width} / ${o.height}`)
    const svg = box.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('100%')
    expect(svg.getAttribute('height')).toBe('100%')
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${Math.round(o.width * 10) / 10} ${Math.round(o.height * 10) / 10}`)
  })

  it('draws a frame', () => {
    const { container } = render(<OrnamentFrame preset="corners" seed={1} aspect={4 / 5} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('swaps in new art when the drawing changes', () => {
    const a = generateOrnament({ preset: 'vine', seed: 1 }).svg
    const b = generateOrnament({ preset: 'vine', seed: 2 }).svg
    const { container, rerender } = render(<OrnamentArt svg={a} />)
    const before = container.innerHTML
    rerender(<OrnamentArt svg={b} />)
    expect(container.innerHTML).not.toBe(before)
  })
})
