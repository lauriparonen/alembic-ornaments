"use client"

import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react"
import {
  fitFrame, generateFrame, generateOrnament,
  type FrameClear, type FrameParams, type FramePreset, type OrnamentParams,
} from "./index.js"

/** Layout effects don't run on the server, and React 18 warns if you ask. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

interface OrnamentArtProps {
  /** Generator output — markup we produced ourselves, never user input. */
  svg: string
  className?: string
  style?: CSSProperties
  /** Stretch to the box instead of keeping the drawing's shape (for a frame drawn to that box) */
  stretch?: boolean
}

/** The drawing fills its box: the box sets the size, the viewBox keeps the shape. */
const fluid = (svg: string, stretch = false) =>
  svg.replace(
    /^<svg ([^>]*?)width="[\d.]+" height="[\d.]+"/,
    `<svg $1width="100%" height="100%"${stretch ? ' preserveAspectRatio="none"' : ""} style="display:block"`,
  )

/**
 * Same seed, different bytes: Node and the browser disagree on trig by a
 * ulp, so the SSR string can fail hydration. Keep that drawing for the
 * first paint, then swap in the client one before the browser paints.
 */
export const OrnamentArt = memo(function OrnamentArt({ svg, className, style, stretch }: OrnamentArtProps) {
  const ref = useRef<HTMLDivElement>(null)
  const html = fluid(svg, stretch)
  useIsomorphicLayoutEffect(() => {
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

/** A frame drawn to a given proportion, sized by its container. For one that measures its box itself, use <Framed>. */
export const OrnamentFrame = memo(function OrnamentFrame({ preset, seed, scale, aspect, className, style }: OrnamentFrameProps) {
  const f = generateFrame({ preset, seed, scale }, aspect)
  return <OrnamentArt svg={f.svg} className={className} style={style} />
})

export interface FramedProps extends HTMLAttributes<HTMLDivElement> {
  preset: FramePreset
  seed: number
  /** Room the frame takes on each side, in px. Defaults to 32. */
  size?: number
  /** Keep content clear of all the frame (default), or only its edges: see frameInset */
  clear?: FrameClear
  children?: ReactNode
}

/** At most this share of the box's shorter side goes to the frame on each side (as in fitFrame) */
const MAX_SHARE = 0.3

/**
 * A box with a frame round it that fits whatever size the box turns out
 * to be. It measures itself, draws the frame to its exact proportions,
 * and pads its children clear of it; resize it and the frame follows.
 *
 * The padding is the frame's: put any padding of your own on the content
 * inside. On the server the size isn't known yet, so the frame appears
 * once the page hydrates; the padding is there from the start, so nothing
 * moves when it does.
 */
export function Framed({ preset, seed, size = 32, clear, style, children, ...rest }: FramedProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // The padding box: what the frame layer covers, borders and scrollbars aside.
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      setBox((b) => (b && Math.abs(b.w - w) < 1 && Math.abs(b.h - h) < 1 ? b : { w, h }))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const frame = box ? fitFrame({ preset, seed, size, clear }, box.w, box.h) : null
  // The size asked for, not the frame's own inset: that one snaps a hair
  // under it, and padding that tracked it would nudge the box and redraw.
  const pad = box ? Math.min(size, MAX_SHARE * Math.min(box.w, box.h)) : size

  return (
    <div
      ref={ref}
      {...rest}
      // Any positioned box holds the frame layer; only a static one needs changing.
      style={{ ...style, position: style?.position && style.position !== "static" ? style.position : "relative", isolation: "isolate", padding: pad }}
    >
      {frame && (
        <OrnamentArt
          svg={frame.svg}
          stretch
          style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none" }}
        />
      )}
      {children}
    </div>
  )
}
