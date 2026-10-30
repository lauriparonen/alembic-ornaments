# Changelog

## 0.1.0

First release, extracted from [Alembic](https://alembic.space).

- `generateOrnament` with four presets: `vine`, `frieze`, `garland`, `sprig`
- `generateFrame` with three frames: `border`, `block`, `corners`
- `fitFrame`: frames sized in pixels, drawn to any box
- `ornamentOutline` and `frameInset` for keeping text clear of ornaments and frames
- React components: `<Framed>` (a box with a frame that fits itself), `<Ornament>`, `<OrnamentFrame>`, `<OrnamentArt>`
- `color` on every component: ink taken from the surrounding text by default; on `<Framed>` it inks the frame alone
- Byte-identical output on every engine and CPU: the generator brings its own `sin`, `cos`, `atan`, `atan2`, `exp`, `log`, `pow` and `hypot` instead of `Math`'s, which differ between engines and between x64 and arm64
