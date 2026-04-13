export interface Point2D {
  x: number;
  y: number;
}

export interface Polyline {
  id: number;
  name: string;
  points: Point2D[];
  color: string;
  width: number;
}

export type EditorMode = 'draw' | 'move' | 'delete' | 'insert';

export interface EditorState {
  polys: Polyline[];
  currentMode: EditorMode;
  activePolyId: number | null;
  drawingActive: boolean;
  currentColor: string;
  currentWidth: number;
  mousePos: Point2D;
  nextId: number;
  movePhase: 0 | 1;
  moveVertex: { polyIdx: number; ptIdx: number } | null;
  hoveredVertex: { polyIdx: number; ptIdx: number } | null;
  hoveredSeg: { polyIdx: number; segIdx: number; point: Point2D } | null;
  statusMessage: string;
  history: Polyline[][];
}

export const COLORS = [
  '#4f9eff', '#ff5f5f', '#3dd68c', '#ffc93c', '#b47aff', '#ff922b',
  '#1dc9a4', '#f06595', '#74c0fc', '#a9e34b', '#8fa0c0', '#ffffff'
];

export const SNAP_RADIUS = 13;
export const SEG_SNAP = 20;
export const MAX_HISTORY = 30;
export const MAX_POLYS = 100;
