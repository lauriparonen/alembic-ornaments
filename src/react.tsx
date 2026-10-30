"use client"

import { memo, useLayoutEffect, useRef, type CSSProperties } from "react"
import { generateFrame, generateOrnament, type FrameParams, type OrnamentParams } from "./index.js"

interface OrnamentArtProps {
  /** Generator output — markup we produced ourselves, never user input. */
  svg: string
  className?: string
  style?: CSSProperties
}

/** The drawing fills its box: the box sets the size, the viewBox keeps the shape. */
const fluid = (svg: string) =>
  svg.replace(/^<svg ([^>]*?)width="[\d.]+" height="[\d.]+"/, '<svg $1width="100%" height="100%" style="display:block"')

/**
 * Same seed, different bytes: Node and the browser disagree on trig by a
 * ulp, so the SSR string can fail hydration. Keep that drawing for the
 * first paint, then swap in the client one before the browser paints.
 */
export const OrnamentArt = memo(function OrnamentArt({ svg, className, style }: OrnamentArtProps) {
  const ref = useRef<HTMLDivElement>(null)
  const html = fluid(svg)
  useLayoutEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== html) el.innerHTML = html
  }, [html])
  return (
    <div
      ref={ref}
      aria-hidden
      className={className}
      style={style}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

export interface OrnamentProps extends Partial<OrnamentParams> {
  className?: string
  style?: CSSProperties
}

/** An ornament at its natural proportions; give it a width and it keeps its shape. */
export const Ornament = memo(function Ornament({ preset, seed, className, style }: OrnamentProps) {
  const o = generateOrnament({ preset, seed })
  return <OrnamentArt svg={o.svg} className={className} style={{ aspectRatio: `${o.width} / ${o.height}`, ...style }} />
})

export interface OrnamentFrameProps extends FrameParams {
  /** Width ÷ height of the box it frames */
  aspect: number
  className?: string
  style?: CSSProperties
}

/** A frame drawn to its box's proportions. Sized by its container, like a border. */
export const OrnamentFrame = memo(function OrnamentFrame({ preset, seed, scale, aspect, className, style }: OrnamentFrameProps) {
  const f = generateFrame({ preset, seed, scale }, aspect)
  return <OrnamentArt svg={f.svg} className={className} style={style} />
})
