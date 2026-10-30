// @vitest-environment jsdom
import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { fitFrame, generateOrnament } from '../src/index.js'
import { Framed, Ornament, OrnamentArt, OrnamentFrame } from '../src/react.js'

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

  it('inherits the text colour unless given one', () => {
    const plain = render(<Ornament preset="vine" seed={1} />).container.firstElementChild as HTMLElement
    expect(plain.style.color).toBe('')
    cleanup()
    const inked = render(<Ornament preset="vine" seed={1} color="rebeccapurple" style={{ color: 'red' }} />).container.firstElementChild as HTMLElement
    expect(inked.style.color).toBe('rebeccapurple')
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

describe('<Framed>', () => {
  // jsdom has no layout: give every element a size, and a ResizeObserver we can fire.
  let size = { w: 400, h: 300 }
  let observers: (() => void)[] = []
  beforeEach(() => {
    size = { w: 400, h: 300 }
    observers = []
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => size.w })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => size.h })
    globalThis.ResizeObserver = class {
      constructor(private cb: () => void) {}
      observe() { observers.push(this.cb) }
      disconnect() { observers = observers.filter((o) => o !== this.cb) }
      unobserve() {}
    } as unknown as typeof ResizeObserver
  })
  const resize = (w: number, h: number) => act(() => { size = { w, h }; observers.forEach((o) => o()) })
  const viewBox = (el: Element) => el.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)

  it('frames its children at its own size, padded clear of the frame', () => {
    const { container, getByText } = render(<Framed preset="border" seed={2} className="card">hello</Framed>)
    const box = container.firstElementChild as HTMLElement
    expect(box.className).toBe('card')
    expect(box.style.padding).toBe('32px')
    expect(getByText('hello')).toBe(box)
    const [, , w, h] = viewBox(box)
    expect(w / h).toBeCloseTo(400 / 300, 2)
    expect(box.querySelector('svg')!.getAttribute('preserveAspectRatio')).toBe('none')
    const frame = fitFrame({ preset: 'border', seed: 2, size: 32 }, 400, 300)!
    expect(frame.inset).toBeLessThanOrEqual(32)
    expect(frame.inset).toBeGreaterThan(31)
  })

  it('redraws when the box changes shape', () => {
    const { container } = render(<Framed preset="corners" seed={1}>x</Framed>)
    const box = container.firstElementChild as HTMLElement
    resize(900, 300)
    const [, , w, h] = viewBox(box)
    expect(w / h).toBeCloseTo(3, 2)
  })

  it('keeps some room inside a box too small for the frame asked for', () => {
    size = { w: 100, h: 60 }
    const { container } = render(<Framed preset="block" seed={1} size={40}>x</Framed>)
    expect((container.firstElementChild as HTMLElement).style.padding).toBe('18px')
  })

  it('keeps a position of its own', () => {
    const { container } = render(<Framed preset="border" seed={1} style={{ position: 'absolute', color: 'red' }}>x</Framed>)
    const box = container.firstElementChild as HTMLElement
    expect(box.style.position).toBe('absolute')
    expect(box.style.color).toBe('red')
  })

  it('keeps the frame layer to the box, whatever the box does to its children', () => {
    const { container } = render(<Framed preset="border" seed={1}>x</Framed>)
    const layer = container.querySelector('[aria-hidden]') as HTMLElement
    expect(layer.style.inset).toBe('0px')
    expect(layer.style.maxWidth).toBe('none')
    expect(layer.style.margin).toBe('0px')
  })

  it('inks the frame alone, leaving the content its own colour', () => {
    const { container } = render(<Framed preset="border" seed={1} color="darkred">x</Framed>)
    const box = container.firstElementChild as HTMLElement
    expect(box.style.color).toBe('')
    expect((box.querySelector('[aria-hidden]') as HTMLElement).style.color).toBe('darkred')
  })

  it('renders on the server with its padding and no frame yet', () => {
    const html = renderToString(<Framed preset="border" seed={1} size={24}>x</Framed>)
    expect(html).toContain('padding:24px')
    expect(html).not.toContain('<svg')
  })
})
