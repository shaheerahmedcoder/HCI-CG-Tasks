import React from 'react';
import { useEditor } from '@/context/EditorContext';
import { COLORS } from '@/types/polyline';

const shortcuts = [
  { key: 'B', desc: 'Draw / New' },
  { key: 'M', desc: 'Move vertex' },
  { key: 'D', desc: 'Delete vertex' },
  { key: 'I', desc: 'Insert on seg' },
  { key: 'Z', desc: 'Undo' },
  { key: 'R', desc: 'Refresh' },
  { key: 'ESC', desc: 'End polyline' },
  { key: 'Q', desc: 'Quit' },
];

export default function EditorSidebar() {
  const { state, dispatch } = useEditor();

  const totalVerts = state.polys.reduce((s, p) => s + p.points.length, 0);
  const totalSegs = state.polys.reduce((s, p) => s + Math.max(0, p.points.length - 1), 0);

  return (
    <aside style={{
      width: 210,
      background: 'var(--pe-panel)',
      borderRight: '1px solid var(--pe-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* POLYLINES */}
      <Section label={`POLYLINES ${state.polys.length}/100`}>
        <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {state.polys.map(p => (
            <div
              key={p.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_POLY', id: p.id })}
              className={`pe-transition ${p.id === state.activePolyId ? 'poly-active-pulse' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                background: p.id === state.activePolyId ? 'var(--pe-highlight)' : 'transparent',
                border: p.id === state.activePolyId ? '1px solid var(--pe-blue)' : '1px solid transparent',
                fontSize: 12,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0, border: '1px solid rgba(0,0,0,.15)' }} />
              <span style={{ flex: 1, color: 'var(--pe-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: p.id === state.activePolyId ? 600 : 400 }}>{p.name}</span>
              <span className="font-mono-code" style={{ fontSize: 9, color: 'var(--pe-muted2)', background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>{p.points.length}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => dispatch({ type: 'BEGIN_POLY' })}
          className="pe-transition"
          style={{
            width: '100%',
            marginTop: 6,
            padding: '5px 0',
            background: 'var(--pe-highlight)',
            border: '1px dashed var(--pe-blue)',
            color: 'var(--pe-blue)',
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
          }}
        >
          + New Polyline [B]
        </button>
      </Section>

      {/* COLOUR */}
      <Section label="COLOUR">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {COLORS.map(c => (
            <div
              key={c}
              onClick={() => dispatch({ type: 'SET_COLOR', color: c })}
              className={`pe-transition ${state.currentColor === c ? 'swatch-active' : ''}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: 3,
                background: c,
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2)',
              }}
            />
          ))}
        </div>
      </Section>

      {/* POLYLINE WIDTH */}
      <Section label="POLYLINE WIDTH">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={1}
            max={10}
            value={state.currentWidth}
            onChange={e => dispatch({ type: 'SET_WIDTH', width: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--pe-blue)' }}
          />
          <span className="font-mono-code" style={{ color: 'var(--pe-blue)', fontSize: 13, minWidth: 18, textAlign: 'right', fontWeight: 600 }}>{state.currentWidth}</span>
        </div>
      </Section>

      {/* STATS */}
      <Section label="STATS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <StatBox label="POLYS" value={state.polys.length} />
          <StatBox label="VERTS" value={totalVerts} />
          <StatBox label="SEGS" value={totalSegs} />
          <StatBox label="MODE" value={state.currentMode.toUpperCase()} />
        </div>
      </Section>

      {/* SHORTCUTS */}
      <Section label="SHORTCUTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {shortcuts.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
              <span className="font-mono-code" style={{
                background: '#e8eaed',
                color: 'var(--pe-text)',
                padding: '1px 6px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 600,
                minWidth: 28,
                textAlign: 'center',
                border: '1px solid var(--pe-border)',
              }}>{s.key}</span>
              <span style={{ color: 'var(--pe-muted2)' }}>{s.desc}</span>
            </div>
          ))}
       
        </div>
      </Section>

      {/* STATUS */}
      <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '1px solid var(--pe-border)', background: '#f8f9fb' }}>
        <div style={{ color: 'var(--pe-green)', fontSize: 11, marginBottom: 4, fontWeight: 500 }}>{state.statusMessage}</div>
        <div className="font-mono-code" style={{ color: 'var(--pe-muted)', fontSize: 10 }}>
          Mouse: {Math.round(state.mousePos.x)}, {Math.round(state.mousePos.y)}
        </div>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--pe-border)' }}>
      <div className="font-mono-code" style={{ fontSize: 9, color: 'var(--pe-muted)', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      background: '#f1f3f4',
      borderRadius: 4,
      padding: '5px 6px',
      textAlign: 'center',
      border: '1px solid var(--pe-border)',
    }}>
      <div className="font-mono-code" style={{ color: 'var(--pe-blue)', fontSize: 15, fontWeight: 700 }}>{value}</div>
      <div className="font-mono-code" style={{ color: 'var(--pe-muted)', fontSize: 8, letterSpacing: 0.8, marginTop: 1 }}>{label}</div>
    </div>
  );
}
