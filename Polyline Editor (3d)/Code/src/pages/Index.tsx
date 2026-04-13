import React, { useState, useEffect } from 'react';
import { EditorProvider, useEditor } from '@/context/EditorContext';
import EditorHeader from '@/components/polyedit/EditorHeader';
import EditorSidebar from '@/components/polyedit/EditorSidebar';
import Canvas2D from '@/components/polyedit/Canvas2D';
import ThreeDModal from '@/components/polyedit/ThreeDModal';
import { ToastContainer, showToast } from '@/components/polyedit/ToastNotification';

function EditorInner() {
  const [show3D, setShow3D] = useState(false);
  const { state, dispatch } = useEditor();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'b' || key === 'n') {
        dispatch({ type: 'BEGIN_POLY' });
        showToast('New polyline');
      } else if (key === 'm') {
        dispatch({ type: 'SET_MODE', mode: 'move' });
      } else if (key === 'd') {
        dispatch({ type: 'SET_MODE', mode: 'delete' });
      } else if (key === 'i') {
        dispatch({ type: 'SET_MODE', mode: 'insert' });
      } else if (key === 'z') {
        dispatch({ type: 'UNDO' });
        showToast('↩ Undo');
      } else if (key === 'r') {
        dispatch({ type: 'SET_STATUS', msg: 'Refreshed.' });
      } else if (key === 'escape') {
        if (state.drawingActive) {
          dispatch({ type: 'END_POLY' });
          showToast('✓ Polyline ended');
        }
      } else if (key === 'q') {
        if (confirm('Quit PolyEdit?')) {
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#080a10;color:#4e5670;font-family:JetBrains Mono,monospace;font-size:18px;">Session ended. Refresh to restart.</div>';
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, state.drawingActive]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--pe-bg)' }}>
      <EditorHeader onOpen3D={() => setShow3D(true)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <EditorSidebar />
        <Canvas2D />
      </div>
      <ThreeDModal open={show3D} onClose={() => setShow3D(false)} />
      <ToastContainer />
    </div>
  );
}

export default function Index() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  );
}
