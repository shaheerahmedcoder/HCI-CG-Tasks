import React from 'react';
import { useEditor } from '@/context/EditorContext';
import { EditorMode } from '@/types/polyline';
import { showToast } from './ToastNotification';

const modeButtons: { mode: EditorMode; label: string; key: string; icon: string }[] = [
  { mode: 'draw', label: 'Draw', key: 'B', icon: '' },
  { mode: 'move', label: 'Move', key: 'M', icon: '' },
  { mode: 'delete', label: 'Delete', key: 'D', icon: '' },
  { mode: 'insert', label: 'Insert', key: 'I', icon: '' },
];

interface Props {
  onOpen3D: () => void;
}

export default function EditorHeader({ onOpen3D }: Props) {
  const { state, dispatch } = useEditor();

  const handleSave = () => {
    const data = JSON.stringify({ polys: state.polys, meta: { saved: new Date().toISOString() } });
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'polylines.json';
    a.click();
    showToast('Saved polylines.json');
  };

  const handleLoad = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const d = JSON.parse(reader.result as string);
          const polys = d.polys || d;
          const maxId = polys.reduce((m: number, p: any) => Math.max(m, p.id), 0);
          dispatch({ type: 'SET_POLYS', polys, nextId: maxId + 1 });
          showToast('Loaded!');
        } catch { showToast('Invalid file'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  const handlePNG = () => {
    const canvas = document.getElementById('canvas2d') as HTMLCanvasElement;
    if (!canvas) return;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'polylines.png';
    a.click();
    showToast('Exported PNG');
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR' });
    showToast('Canvas cleared');
  };

  const handleQuit = () => {
    if (confirm('Are you sure you want to quit?')) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0f0f0;color:#5f6368;font-family:Inter,sans-serif;font-size:18px;">Session ended. Refresh to restart.</div>';
    }
  };

  const has3D = state.polys.some(p => p.points.length >= 2);

  return (
    <header style={{
      background: 'var(--pe-panel)',
      borderBottom: '1px solid var(--pe-border)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        height: 32,
        background: '#1a73e8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 10,
      }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: 0.3 }}>
          HCI LAB - Polyline Editor
        </span>
        <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
          HCI-CG . Miss Humera Tariq . (Group Members: Shaheer Ahmed , Bilal Atif , Mujtaba , Ibrahim)
        </span>
      </div>

      {/* Ribbon toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        padding: '4px 6px',
        gap: 0,
        background: 'var(--pe-toolbar)',
        borderBottom: '1px solid var(--pe-border)',
      }}>
        {/* Tools section */}
        <div className="ribbon-section">
          <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            {modeButtons.map(b => (
              <button
                key={b.mode}
                className={`pe-transition ${state.currentMode === b.mode ? `active-${b.mode}` : ''}`}
                onClick={() => dispatch({ type: 'SET_MODE', mode: b.mode })}
                style={{
                  background: 'var(--pe-panel)',
                  border: '1px solid var(--pe-border)',
                  color: 'var(--pe-text)',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 13 }}>{b.icon}</span>
                <span>{b.label}</span>
                <span className="font-mono-code" style={{
                  background: '#e8eaed',
                  color: 'var(--pe-muted2)',
                  fontSize: 8,
                  padding: '1px 4px',
                  borderRadius: 2,
                  fontWeight: 600,
                }}>{b.key}</span>
              </button>
            ))}
          </div>
          <span className="ribbon-section-label">Tools</span>
        </div>

        {/* Edit section */}
        <div className="ribbon-section">
          <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            <RibbonBtn label="Undo" onClick={() => { dispatch({ type: 'UNDO' }); showToast('Undo'); }} />
            <RibbonBtn label="Refresh" onClick={() => dispatch({ type: 'SET_STATUS', msg: 'Refreshed.' })} />
            <RibbonBtn label="Clear" onClick={handleClear} />
          </div>
          <span className="ribbon-section-label">Edit</span>
        </div>

        {/* View section */}
        <div className="ribbon-section">
          <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            <button
              onClick={() => {
                if (!has3D) { showToast('Draw something first!'); return; }
                onOpen3D();
              }}
              className={`pe-transition ${has3D ? 'pulse-3d' : ''}`}
              style={{
                background: has3D ? '#f3e8ff' : 'var(--pe-panel)',
                border: `1px solid ${has3D ? '#7b1fa2' : 'var(--pe-border)'}`,
                color: has3D ? '#7b1fa2' : 'var(--pe-muted)',
                borderRadius: 4,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
               View in 3D
            </button>
          </div>
          <span className="ribbon-section-label">View</span>
        </div>

        {/* File section */}
        <div className="ribbon-section" style={{ borderRight: 'none' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
            <RibbonBtn label=" Save" onClick={handleSave} />
            <RibbonBtn label=" Load" onClick={handleLoad} />
            <RibbonBtn label=" PNG" onClick={handlePNG} />
            <RibbonBtn label=" Quit" onClick={handleQuit} />
          </div>
          <span className="ribbon-section-label">File</span>
        </div>
      </div>
    </header>
  );
}

function RibbonBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pe-transition"
      style={{
        background: 'var(--pe-panel)',
        border: '1px solid var(--pe-border)',
        color: 'var(--pe-muted2)',
        borderRadius: 4,
        padding: '5px 8px',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = '#e8eaed';
        (e.currentTarget as HTMLElement).style.color = 'var(--pe-text)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--pe-panel)';
        (e.currentTarget as HTMLElement).style.color = 'var(--pe-muted2)';
      }}
    >
      {label}
    </button>
  );
}
