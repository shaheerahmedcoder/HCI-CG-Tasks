import { Point2D, Polyline, SNAP_RADIUS, SEG_SNAP } from '@/types/polyline';

export function findNearestVertex(
  polys: Polyline[],
  mx: number,
  my: number
): { polyIdx: number; ptIdx: number; dist: number } | null {
  let best: { polyIdx: number; ptIdx: number; dist: number } | null = null;
  for (let pi = 0; pi < polys.length; pi++) {
    for (let vi = 0; vi < polys[pi].points.length; vi++) {
      const p = polys[pi].points[vi];
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < SNAP_RADIUS && (!best || d < best.dist)) {
        best = { polyIdx: pi, ptIdx: vi, dist: d };
      }
    }
  }
  return best;
}

export function findNearestSegment(
  polys: Polyline[],
  mx: number,
  my: number
): { polyIdx: number; segIdx: number; point: Point2D; dist: number } | null {
  let best: { polyIdx: number; segIdx: number; point: Point2D; dist: number } | null = null;
  for (let pi = 0; pi < polys.length; pi++) {
    const pts = polys[pi].points;
    for (let si = 0; si < pts.length - 1; si++) {
      const a = pts[si], b = pts[si + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      let t = ((mx - a.x) * dx + (my - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + t * dx, cy = a.y + t * dy;
      const d = Math.hypot(mx - cx, my - cy);
      if (d < SEG_SNAP && (!best || d < best.dist)) {
        best = { polyIdx: pi, segIdx: si, point: { x: cx, y: cy }, dist: d };
      }
    }
  }
  return best;
}

export function deepClonePolys(polys: Polyline[]): Polyline[] {
  return polys.map(p => ({
    ...p,
    points: p.points.map(pt => ({ ...pt }))
  }));
}
