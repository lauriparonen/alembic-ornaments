# alembic-ornaments

Seeded woodcut ornaments and frames, drawn as SVG. Give it a preset and a
number, and it grows a flourish: vines, lilies, rosettes and acanthus leaves,
fitted together so nothing overlaps. The same seed always draws the same
picture, so you can store two values instead of an image.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/vine-dark.svg">
  <img alt="A vine ornament: a running scroll of leaves and flowers between two rules" src="docs/vine-light.svg" width="600">
</picture>

Made for [Alembic](https://alembic.space). Try every preset and seed in the
[ornament playground](https://alembic.space/ornaments).

- **Tiny and dependency-free.** Pure TypeScript that runs anywhere: browser, Node, edge, build time.
- **Deterministic.** `{ preset, seed }` is the whole ornament.
- **Ink-agnostic.** Drawn in `currentColor`, so it takes the colour of the text around it.
- **React components** included, optional.

```sh
npm install @lauriparonen/alembic-ornaments
```

## Usage

```ts
import { generateOrnament } from '@lauriparonen/alembic-ornaments'

const { svg, width, height } = generateOrnament({ preset: 'garland', seed: 42 })
element.innerHTML = svg
```

`svg` is a complete `<svg>` string with a `viewBox`. Scale it with CSS like
any other image.

### React

```tsx
import { Ornament, OrnamentFrame } from '@lauriparonen/alembic-ornaments/react'

<Ornament preset="sprig" seed={11} style={{ width: 120 }} />

<div style={{ position: 'relative', aspectRatio: '4 / 5' }}>
  <OrnamentFrame preset="corners" seed={9} aspect={4 / 5} style={{ position: 'absolute', inset: 0 }} />
  …
</div>
```

`<Ornament>` keeps its own proportions: give it a width and the height
follows. `<OrnamentFrame>` fills whatever box it's in, so pass that box's
width ÷ height as `aspect` and the frame is drawn to fit.

Both render on the server. React is an optional peer dependency: if you only
use the core, you don't need it.

## Presets

| | preset | |
|---|---|---|
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/vine-dark.svg"><img src="docs/vine-light.svg" width="240" alt=""></picture> | `vine` | running scroll between rules |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/frieze-dark.svg"><img src="docs/frieze-light.svg" width="240" alt=""></picture> | `frieze` | the vine cut white from a black block |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/garland-dark.svg"><img src="docs/garland-light.svg" width="200" alt=""></picture> | `garland` | a lily between two sweeping arms |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/sprig-dark.svg"><img src="docs/sprig-light.svg" width="80" alt=""></picture> | `sprig` | a small flower to end on |

`PRESETS` lists them, each with a `span` (its natural width as a share of a
text column) and a fixed `aspect` (width ÷ height). The aspect never depends
on the seed, so you can reserve space before drawing anything.

## Frames

<p>
  <picture><source media="(prefers-color-scheme: dark)" srcset="docs/frame-border-dark.svg"><img src="docs/frame-border-light.svg" width="160" alt="border frame"></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="docs/frame-block-dark.svg"><img src="docs/frame-block-light.svg" width="160" alt="block frame"></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="docs/frame-corners-dark.svg"><img src="docs/frame-corners-light.svg" width="160" alt="corners frame"></picture>
</p>

```ts
import { generateFrame } from '@lauriparonen/alembic-ornaments'

const { svg } = generateFrame({ preset: 'border', seed: 4, scale: 1 }, 4 / 5)
```

A frame is drawn to a box's proportions (the second argument, width ÷
height). Frames share flowers and leaves with the presets: the same seed gives
the same family of motifs. `scale` sets how heavy it is, from
`FRAME_SCALE_MIN` (0.6) to `FRAME_SCALE_MAX` (1.6). It changes the weight, not
the variation.

To keep content clear of the frame, `frameInset` says how far in it has to
start, as fractions of the box:

```ts
import { frameInset } from '@lauriparonen/alembic-ornaments'

const { x, y } = frameInset('border', 4 / 5)
// x of the width on the left and right, y of the height top and bottom
content.style.cssText = `position: absolute; inset: ${y * 100}% ${x * 100}%`
```

## Storing ornaments

Store the params, not the SVG:

```ts
import { generateOrnament, normalizeParams } from '@lauriparonen/alembic-ornaments'

const saved = JSON.stringify({ preset: 'vine', seed: 7 })
// …later, from untrusted input:
const params = normalizeParams(JSON.parse(saved)) // unknown preset → 'vine', seed → non-negative integer
generateOrnament(params)
```

**The stability promise:** within a major version, the same params draw the
same picture. Every release is tested against snapshots of hundreds of
preset/seed/frame combinations, so a drawing can't change by accident. A
change to an existing preset's look will be a major version. New presets
arrive in minor versions.

The promise covers the drawing, not the exact bytes. JavaScript engines can
disagree in the last bit of a trigonometric result, so Node and a browser may
emit slightly different numbers for the same ornament. If you render on the
server and hydrate on the client, the React components handle this for you.

## API

### `@lauriparonen/alembic-ornaments`

| | |
|---|---|
| `generateOrnament(params)` | `{ params, svg, width, height }` for `{ preset, seed }`. Results are cached. |
| `generateFrame(params, aspect)` | The same for a frame `{ preset, seed, scale? }`, drawn to `aspect` (width ÷ height). |
| `ornamentOutline(params)` | The ornament's ink as polygons in its own `width × height` box, for flowing text around it. |
| `frameInset(preset, aspect, scale?)` | How far content must stay in from a frame's edges: `{ x, y }` as fractions of the box's width and height. |
| `normalizeParams(input)` | Coerces anything into valid `OrnamentParams`. |
| `normalizeFrame(input)` | Coerces into valid `FrameParams`, or `null` for an unknown frame. |
| `normalizeFrameScale(scale)` | Clamps a scale to the allowed range, in steps of 0.05. |
| `presetInfo(id)` | The `PRESETS` entry for a preset. |
| `PRESETS`, `FRAMES` | The available presets and frames, with labels and short descriptions. |
| `DEFAULT_ORNAMENT` | `{ preset: 'vine', seed: 1 }` |

### `@lauriparonen/alembic-ornaments/react`

| | |
|---|---|
| `<Ornament preset seed className? style? />` | An ornament at its natural proportions. |
| `<OrnamentFrame preset seed scale? aspect className? style? />` | A frame that fills its box. |
| `<OrnamentArt svg className? style? />` | Low-level: renders any generated SVG string, sized by its box. |

All three render a `<div aria-hidden>`, since ornaments are decoration.

## License

[MIT](LICENSE) © Lauri Paronen
