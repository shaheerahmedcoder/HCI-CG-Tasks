import React, { useRef, useEffect, useCallback } from 'react';
import { useEditor } from '@/context/EditorContext';
import { findNearestVertex, findNearestSegment } from '@/lib/polyline-utils';
import { showToast } from './ToastNotification';

export default function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useEditor();
  const stateRef = useRef(state);
  stateRef.current = state;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let pi = 0; pi < s.polys.length; pi++) {
      const poly = s.polys[pi];
      if (poly.points.length === 0) continue;
      const isActive = poly.id === s.activePolyId;

      // Draw segments
      if (poly.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = poly.color;
        ctx.lineWidth = poly.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (isActive) {
          ctx.shadowColor = poly.color;
          ctx.shadowBlur = 8;
        }
        ctx.moveTo(poly.points[0].x, poly.points[0].y);
        for (let i = 1; i < poly.points.length; i++) {
          ctx.lineTo(poly.points[i].x, poly.points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Ghost preview line
      if (isActive && s.drawingActive && s.currentMode === 'draw' && poly.points.length > 0) {
        const last = poly.points[poly.points.length - 1];
        ctx.beginPath();
        ctx.strokeStyle = poly.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.globalAlpha = 0.5;
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(s.mousePos.x, s.mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Vertices
      for (let vi = 0; vi < poly.points.length; vi++) {
        const p = poly.points[vi];
        const isHovered = s.hoveredVertex && s.hoveredVertex.polyIdx === pi && s.hoveredVertex.ptIdx === vi;
        const isPicked = s.moveVertex && s.moveVertex.polyIdx === pi && s.moveVertex.ptIdx === vi;

        let r = 5, color = poly.color;
        if (isPicked) { r = 8; color = '#e8a317'; ctx.shadowColor = '#e8a317'; ctx.shadowBlur = 10; }
        else if (isHovered) { r = 8; color = '#d93025'; ctx.shadowColor = '#d93025'; ctx.shadowBlur = 10; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // White outline for visibility on light bg
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Vertex index
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`${vi}`, p.x - 3, p.y - 10);
      }
    }

    // Move mode phase 1 guide
    if (s.currentMode === 'move' && s.movePhase === 1 && s.moveVertex) {
      const p = s.polys[s.moveVertex.polyIdx]?.points[s.moveVertex.ptIdx];
      if (p) {
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#e8a317';
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(s.mousePos.x, s.mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Ghost dot
        ctx.beginPath();
        ctx.arc(s.mousePos.x, s.mousePos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232,163,23,.5)';
        ctx.fill();
      }
    }

    // Insert mode preview
    if (s.currentMode === 'insert' && s.hoveredSeg) {
      ctx.beginPath();
      ctx.arc(s.hoveredSeg.point.x, s.hoveredSeg.point.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0d8a72';
      ctx.shadowColor = '#0d8a72';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // Resize
  useEffect(() => {
    const resize = () => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // Redraw on state change
  useEffect(() => {
    redraw();
  }, [state, redraw]);

  // Mouse handlers
  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);
    dispatch({ type: 'SET_MOUSE', pos });

    if (state.currentMode === 'move' && state.movePhase === 0) {
      const nv = findNearestVertex(state.polys, pos.x, pos.y);
      dispatch({ type: 'SET_HOVERED_VERTEX', v: nv ? { polyIdx: nv.polyIdx, ptIdx: nv.ptIdx } : null });
    } else if (state.currentMode === 'delete') {
      const nv = findNearestVertex(state.polys, pos.x, pos.y);
      dispatch({ type: 'SET_HOVERED_VERTEX', v: nv ? { polyIdx: nv.polyIdx, ptIdx: nv.ptIdx } : null });
    } else if (state.currentMode === 'insert') {
      const ns = findNearestSegment(state.polys, pos.x, pos.y);
      dispatch({ type: 'SET_HOVERED_SEG', s: ns ? { polyIdx: ns.polyIdx, segIdx: ns.segIdx, point: ns.point } : null });
    } else {
      dispatch({ type: 'SET_HOVERED_VERTEX', v: null });
      dispatch({ type: 'SET_HOVERED_SEG', s: null });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const pos = getPos(e);

    if (state.currentMode === 'draw') {
      if (!state.drawingActive) {
        dispatch({ type: 'BEGIN_POLY' });
        setTimeout(() => dispatch({ type: 'ADD_VERTEX', point: pos }), 0);
      } else {
        dispatch({ type: 'ADD_VERTEX', point: pos });
      }
    } else if (state.currentMode === 'move') {
      if (state.movePhase === 0) {
        const nv = findNearestVertex(state.polys, pos.x, pos.y);
        if (nv) {
          dispatch({ type: 'SET_MOVE_PHASE', phase: 1, vertex: { polyIdx: nv.polyIdx, ptIdx: nv.ptIdx } });
          dispatch({ type: 'SET_STATUS', msg: '⟳ Click to place vertex' });
        }
      } else if (state.movePhase === 1 && state.moveVertex) {
        dispatch({ type: 'MOVE_VERTEX', polyIdx: state.moveVertex.polyIdx, ptIdx: state.moveVertex.ptIdx, to: pos });
        showToast('✥ Vertex moved');
      }
    } else if (state.currentMode === 'delete') {
      const nv = findNearestVertex(state.polys, pos.x, pos.y);
      if (nv) {
        dispatch({ type: 'DELETE_VERTEX', polyIdx: nv.polyIdx, ptIdx: nv.ptIdx });
        showToast('✕ Vertex deleted');
      }
    } else if (state.currentMode === 'insert') {
      if (state.hoveredSeg) {
        dispatch({ type: 'INSERT_VERTEX', polyIdx: state.hoveredSeg.polyIdx, segIdx: state.hoveredSeg.segIdx, point: state.hoveredSeg.point });
        showToast('⊕ Point inserted');
      }
    }
  };

  const handleDblClick = () => {
    if (state.drawingActive) {
      dispatch({ type: 'END_POLY' });
      showToast('✓ Polyline ended');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (state.drawingActive) {
      dispatch({ type: 'END_POLY' });
      showToast('✓ Polyline ended');
    }
  };

  // Cursor
  let cursor = 'default';
  if (state.currentMode === 'draw') cursor = 'crosshair';
  else if (state.currentMode === 'move' && state.hoveredVertex) cursor = 'move';
  else if ((state.currentMode === 'delete' && state.hoveredVertex) || (state.currentMode === 'insert' && state.hoveredSeg)) cursor = 'pointer';

  return (
    <div ref={wrapRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f0f0f0' }}>
      <canvas
        ref={canvasRef}
        id="canvas2d"
        onClick={handleClick}
        onDoubleClick={handleDblClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        style={{
          display: 'block',
          cursor,
          background: '#ffffff',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Coord overlay */}
      <div className="font-mono-code" style={{
        position: 'absolute',
        bottom: 8,
        right: 12,
        fontSize: 10,
        color: 'var(--pe-muted2)',
        background: 'rgba(255,255,255,.9)',
        padding: '2px 8px',
        borderRadius: 3,
        border: '1px solid var(--pe-border)',
      }}>
        {Math.round(state.mousePos.x)}, {Math.round(state.mousePos.y)}
      </div>
    </div>
  );
}
