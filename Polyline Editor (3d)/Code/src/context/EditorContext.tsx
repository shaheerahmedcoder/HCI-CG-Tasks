import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import {
  EditorState, EditorMode, Polyline, Point2D,
  COLORS, MAX_HISTORY, MAX_POLYS
} from '@/types/polyline';
import { deepClonePolys } from '@/lib/polyline-utils';

type Action =
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_MOUSE'; pos: Point2D }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'SET_WIDTH'; width: number }
  | { type: 'SET_ACTIVE_POLY'; id: number | null }
  | { type: 'SET_POLYS'; polys: Polyline[]; nextId?: number }
  | { type: 'ADD_VERTEX'; point: Point2D }
  | { type: 'BEGIN_POLY' }
  | { type: 'END_POLY' }
  | { type: 'DELETE_VERTEX'; polyIdx: number; ptIdx: number }
  | { type: 'MOVE_VERTEX'; polyIdx: number; ptIdx: number; to: Point2D }
  | { type: 'INSERT_VERTEX'; polyIdx: number; segIdx: number; point: Point2D }
  | { type: 'UNDO' }
  | { type: 'CLEAR' }
  | { type: 'SET_MOVE_PHASE'; phase: 0 | 1; vertex?: { polyIdx: number; ptIdx: number } | null }
  | { type: 'SET_HOVERED_VERTEX'; v: { polyIdx: number; ptIdx: number } | null }
  | { type: 'SET_HOVERED_SEG'; s: { polyIdx: number; segIdx: number; point: Point2D } | null }
  | { type: 'SET_STATUS'; msg: string }
  | { type: 'PUSH_HISTORY' };

const initialState: EditorState = {
  polys: [],
  currentMode: 'draw',
  activePolyId: null,
  drawingActive: false,
  currentColor: COLORS[0],
  currentWidth: 2,
  mousePos: { x: 0, y: 0 },
  nextId: 1,
  movePhase: 0,
  moveVertex: null,
  hoveredVertex: null,
  hoveredSeg: null,
  statusMessage: 'You can interact with the shortcut keys listed above...',
  history: [],
};

function pushHistory(state: EditorState): EditorState {
  const h = [...state.history, deepClonePolys(state.polys)];
  if (h.length > MAX_HISTORY) h.shift();
  return { ...state, history: h };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_MODE': {
      let s = state;
      if (state.drawingActive && action.mode !== 'draw') {
        // end current poly
        const active = s.polys.find(p => p.id === s.activePolyId);
        if (active && active.points.length < 2) {
          s = { ...s, polys: s.polys.filter(p => p.id !== s.activePolyId) };
        }
        s = { ...s, drawingActive: false, activePolyId: null };
      }
      return {
        ...s,
        currentMode: action.mode,
        movePhase: 0,
        moveVertex: null,
        hoveredSeg: null,
        statusMessage: `Mode: ${action.mode.toUpperCase()}`
      };
    }
    case 'SET_MOUSE':
      return { ...state, mousePos: action.pos };
    case 'SET_COLOR': {
      const s = { ...state, currentColor: action.color };
      if (s.activePolyId != null) {
        s.polys = s.polys.map(p => p.id === s.activePolyId ? { ...p, color: action.color } : p);
      }
      return s;
    }
    case 'SET_WIDTH': {
      const s = { ...state, currentWidth: action.width };
      if (s.activePolyId != null) {
        s.polys = s.polys.map(p => p.id === s.activePolyId ? { ...p, width: action.width } : p);
      }
      return s;
    }
    case 'SET_ACTIVE_POLY':
      return { ...state, activePolyId: action.id };
    case 'SET_POLYS':
      return { ...state, polys: action.polys, nextId: action.nextId ?? state.nextId };
    case 'BEGIN_POLY': {
      if (state.polys.length >= MAX_POLYS) return { ...state, statusMessage: 'Max 100 polylines!' };
      let s = state;
      if (s.drawingActive) {
        const active = s.polys.find(p => p.id === s.activePolyId);
        if (active && active.points.length < 2) {
          s = { ...s, polys: s.polys.filter(p => p.id !== s.activePolyId) };
        }
        s = { ...s, drawingActive: false };
      }
      const newPoly: Polyline = {
        id: s.nextId,
        name: `Poly ${s.nextId}`,
        points: [],
        color: s.currentColor,
        width: s.currentWidth,
      };
      return {
        ...s,
        polys: [...s.polys, newPoly],
        activePolyId: s.nextId,
        nextId: s.nextId + 1,
        drawingActive: true,
        currentMode: 'draw',
        statusMessage: `Drawing ${newPoly.name}...`
      };
    }
    case 'END_POLY': {
      const active = state.polys.find(p => p.id === state.activePolyId);
      let polys = state.polys;
      let msg = 'Polyline ended.';
      if (active && active.points.length < 2) {
        polys = polys.filter(p => p.id !== state.activePolyId);
        msg = 'Polyline removed (< 2 points).';
      }
      return { ...state, polys, drawingActive: false, activePolyId: null, statusMessage: msg };
    }
    case 'ADD_VERTEX': {
      return {
        ...state,
        polys: state.polys.map(p =>
          p.id === state.activePolyId ? { ...p, points: [...p.points, action.point] } : p
        ),
      };
    }
    case 'DELETE_VERTEX': {
      const s = pushHistory(state);
      let polys = s.polys.map((p, i) => {
        if (i !== action.polyIdx) return p;
        return { ...p, points: p.points.filter((_, vi) => vi !== action.ptIdx) };
      });
      polys = polys.filter(p => p.points.length > 0);
      return { ...s, polys, statusMessage: 'Vertex deleted.' };
    }
    case 'MOVE_VERTEX': {
      const s = pushHistory(state);
      return {
        ...s,
        polys: s.polys.map((p, i) => {
          if (i !== action.polyIdx) return p;
          return {
            ...p,
            points: p.points.map((pt, vi) => vi === action.ptIdx ? action.to : pt)
          };
        }),
        movePhase: 0,
        moveVertex: null,
        statusMessage: 'Vertex moved.'
      };
    }
    case 'INSERT_VERTEX': {
      const s = pushHistory(state);
      return {
        ...s,
        polys: s.polys.map((p, i) => {
          if (i !== action.polyIdx) return p;
          const pts = [...p.points];
          pts.splice(action.segIdx + 1, 0, action.point);
          return { ...p, points: pts };
        }),
        statusMessage: 'Point inserted.'
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return { ...state, statusMessage: 'Nothing to undo.' };
      const h = [...state.history];
      const prev = h.pop()!;
      return { ...state, polys: prev, history: h, statusMessage: '↩ Undo' };
    }
    case 'CLEAR':
      return { ...pushHistory(state), polys: [], activePolyId: null, drawingActive: false, nextId: 1, statusMessage: 'Canvas cleared.' };
    case 'SET_MOVE_PHASE':
      return { ...state, movePhase: action.phase, moveVertex: action.vertex ?? null };
    case 'SET_HOVERED_VERTEX':
      return { ...state, hoveredVertex: action.v };
    case 'SET_HOVERED_SEG':
      return { ...state, hoveredSeg: action.s };
    case 'SET_STATUS':
      return { ...state, statusMessage: action.msg };
    case 'PUSH_HISTORY':
      return pushHistory(state);
    default:
      return state;
  }
}

interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be inside EditorProvider');
  return ctx;
}
