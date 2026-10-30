import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FRAMES, PRESETS, type FramePreset } from '../src/index.js'
import { Framed, Ornament } from '../src/react.js'

function Demo() {
  const [seed, setSeed] = useState(4)
  const [size, setSize] = useState(32)
  const [preset, setPreset] = useState<FramePreset>('border')
  return (
    <main>
      <h1>alembic-ornaments</h1>
      <p className="note">Every box below measures itself. Drag the corners of the dashed ones.</p>
      <div className="controls">
        <label>frame <select value={preset} onChange={(e) => setPreset(e.target.value as FramePreset)}>
          {FRAMES.map((f) => <option key={f.id}>{f.id}</option>)}
        </select></label>
        <label>size {size}px <input type="range" min={12} max={72} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
        <label>seed <input type="number" min={0} value={seed} onChange={(e) => setSeed(Math.max(0, +e.target.value))} style={{ width: 70 }} /></label>
        <button onClick={() => setSeed(1 + Math.floor(Math.random() * 99999))}>random</button>
      </div>

      <h2>A card, sized by its content</h2>
      <div className="grid">
        {FRAMES.map((f) => (
          <Framed key={f.id} preset={f.id} seed={seed} size={size} data-testid={`card-${f.id}`}>
            <h3 style={{ margin: '0 0 6px', fontWeight: 'normal' }}>On distillation</h3>
            <p style={{ margin: 0 }}>A good essay vivifies its writer as much as its reader. It begins as a cloudy liquid; the reward is the gold within the lead.</p>
          </Framed>
        ))}
      </div>

      <h2>Resizable</h2>
      <div className="grid">
        <div className="resizable" style={{ width: 340, height: 240, outline: '1px dashed var(--muted)' }}>
          <Framed preset={preset} seed={seed} size={size} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }} data-testid="resizable">
            Drag my corner.
          </Framed>
        </div>
      </div>

      <h2>A banner, 6:1</h2>
      <Framed preset={preset} seed={seed} size={size} style={{ aspectRatio: '6 / 1', display: 'grid', placeItems: 'center', boxSizing: 'border-box' }} data-testid="banner">
        <span style={{ fontSize: 22 }}>Banner</span>
      </Framed>

      <h2>Dividers</h2>
      {PRESETS.map((p) => (
        <Ornament key={p.id} preset={p.id} seed={seed} style={{ width: `${p.span * 100}%`, margin: '20px auto' }} />
      ))}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Demo /></StrictMode>)
