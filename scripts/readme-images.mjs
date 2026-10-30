// Renders the README's pictures from the built package: `npm run build` first.
// Each comes in two inks, so it reads on GitHub's light and dark themes.
import { writeFileSync } from 'node:fs'
import { fitFrame, generateOrnament } from '../dist/index.js'

const INKS = { light: '#2b2620', dark: '#e6dfd2' }

const pictures = {
  vine: generateOrnament({ preset: 'vine', seed: 7 }),
  frieze: generateOrnament({ preset: 'frieze', seed: 3 }),
  garland: generateOrnament({ preset: 'garland', seed: 42 }),
  sprig: generateOrnament({ preset: 'sprig', seed: 11 }),
  // As <Framed> draws them at its default size, round a 360 × 240 card
  'frame-border': fitFrame({ preset: 'border', seed: 4, size: 32 }, 360, 240),
  'frame-block': fitFrame({ preset: 'block', seed: 2, size: 32 }, 360, 240),
  'frame-corners': fitFrame({ preset: 'corners', seed: 9, size: 32 }, 360, 240),
}

for (const [name, { svg }] of Object.entries(pictures)) {
  for (const [theme, ink] of Object.entries(INKS)) {
    writeFileSync(new URL(`../docs/${name}-${theme}.svg`, import.meta.url), svg.replace('fill="currentColor"', `fill="${ink}"`))
  }
}
console.log(`wrote ${Object.keys(pictures).length * 2} images to docs/`)
