import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useEditor } from '@/context/EditorContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ThreeDModal({ open, onClose }: Props) {
  const { state } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const orbitRef = useRef({ theta: 0.4, phi: 1.0, radius: 660, target: new THREE.Vector3(0, 0, 0) });
  const dragRef = useRef({ dragging: false, panning: false, lastX: 0, lastY: 0 });
  const groupRef = useRef<THREE.Group | null>(null);

  const updateCamera = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const o = orbitRef.current;
    cam.position.set(
      o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta),
      o.target.y + o.radius * Math.cos(o.phi),
      o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta)
    );
    cam.lookAt(o.target);
  }, []);

  const build3DScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (groupRef.current) scene.remove(groupRef.current);
    const group = new THREE.Group();
    groupRef.current = group;

    const polys = state.polys.filter(p => p.points.length >= 2);
    if (polys.length === 0) return;

    let allX: number[] = [], allY: number[] = [];
    polys.forEach(p => p.points.forEach(pt => { allX.push(pt.x); allY.push(pt.y); }));
    const cx = allX.reduce((a, b) => a + b, 0) / allX.length;
    const cy = allY.reduce((a, b) => a + b, 0) / allY.length;

    polys.forEach((poly, pi) => {
      const zOffset = (pi - (polys.length - 1) / 2) * 60;
      const pts3 = poly.points.map(p => new THREE.Vector3(p.x - cx, -(p.y - cy), zOffset));
      const color = new THREE.Color(poly.color);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts3);
      const lineMat = new THREE.LineBasicMaterial({ color });
      group.add(new THREE.Line(lineGeo, lineMat));

      for (let i = 0; i < pts3.length - 1; i++) {
        const a = pts3[i], b = pts3[i + 1];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const cylGeo = new THREE.CylinderGeometry(poly.width * 0.6, poly.width * 0.6, len, 8);
        const cylMat = new THREE.MeshBasicMaterial({ color });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.copy(mid);
        const axis = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize());
        cyl.setRotationFromQuaternion(q);
        group.add(cyl);
      }

      pts3.forEach(pt => {
        const sGeo = new THREE.SphereGeometry(poly.width * 1.2, 12, 12);
        const sMat = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(sGeo, sMat);
        sphere.position.copy(pt);
        group.add(sphere);
      });

      const floorY = -200;
      const shadowPts = pts3.map(p => new THREE.Vector3(p.x, floorY, p.z));
      const shadowGeo = new THREE.BufferGeometry().setFromPoints(shadowPts);
      const shadowMat = new THREE.LineBasicMaterial({ color, opacity: 0.18, transparent: true });
      group.add(new THREE.Line(shadowGeo, shadowMat));
    });

    scene.add(group);

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    orbitRef.current.target.copy(center);
    orbitRef.current.radius = Math.max(size.length() * 1.4, 200);
    orbitRef.current.theta = 0.4;
    orbitRef.current.phi = 1.0;
    updateCamera();
  }, [state.polys, updateCamera]);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const el = containerRef.current;

    if (!rendererRef.current) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      const cam = new THREE.PerspectiveCamera(48, el.clientWidth / el.clientHeight, 0.01, 2000);
      cameraRef.current = cam;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(el.clientWidth, el.clientHeight);
      rendererRef.current = renderer;
      el.appendChild(renderer.domElement);

      const grid = new THREE.GridHelper(800, 40, 0xcccccc, 0xdddddd);
      scene.add(grid);

      const axisLen = 400;
      const makeAxis = (dir: THREE.Vector3, c: number) => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.multiplyScalar(axisLen)]);
        const mat = new THREE.LineBasicMaterial({ color: c, opacity: 0.4, transparent: true });
        scene.add(new THREE.Line(geo, mat));
      };
      makeAxis(new THREE.Vector3(1, 0, 0), 0xff0000);
      makeAxis(new THREE.Vector3(0, 1, 0), 0x00aa00);
      makeAxis(new THREE.Vector3(0, 0, 1), 0x0000ff);

      scene.add(new THREE.AmbientLight(0xffffff, 1));

      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        renderer.render(scene, cam);
      };
      animate();
    } else {
      const renderer = rendererRef.current;
      renderer.setSize(el.clientWidth, el.clientHeight);
      if (cameraRef.current) {
        cameraRef.current.aspect = el.clientWidth / el.clientHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      if (!el.contains(renderer.domElement)) {
        el.appendChild(renderer.domElement);
      }
    }

    build3DScene();
    return () => {};
  }, [open, build3DScene]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) dragRef.current = { ...dragRef.current, dragging: true, lastX: e.clientX, lastY: e.clientY };
    if (e.button === 2) dragRef.current = { ...dragRef.current, panning: true, lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;

    if (d.dragging) {
      orbitRef.current.theta -= dx * 0.007;
      orbitRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbitRef.current.phi + dy * 0.007));
      updateCamera();
    }
    if (d.panning && cameraRef.current) {
      const cam = cameraRef.current;
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(orbitRef.current.target, cam.position).normalize(),
        cam.up
      ).normalize();
      orbitRef.current.target.add(right.multiplyScalar(-dx * 0.4));
      orbitRef.current.target.add(cam.up.clone().multiplyScalar(dy * 0.4));
      updateCamera();
    }
  };

  const handleMouseUp = () => {
    dragRef.current.dragging = false;
    dragRef.current.panning = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    orbitRef.current.radius = Math.max(50, Math.min(2000, orbitRef.current.radius + e.deltaY * 0.5));
    updateCamera();
  };

  const resetView = () => {
    orbitRef.current = { theta: 0.4, phi: 1.0, radius: 660, target: new THREE.Vector3(0, 0, 0) };
    build3DScene();
  };

  if (!open) return null;

  const totalVerts = state.polys.reduce((s, p) => s + p.points.length, 0);
  const polyCount = state.polys.filter(p => p.points.length >= 2).length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        className="modal-animate-in"
        style={{
          width: '92vw', height: '88vh',
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #d4d7dd',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,.2)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #d4d7dd',
          background: '#f1f3f4',
        }}>
          <div>
            <span style={{ color: '#7b1fa2', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>3D View</span>
            <span style={{ color: '#5f6368', fontSize: 11, marginLeft: 14, fontFamily: 'Inter, sans-serif' }}>
              {polyCount} polylines · {totalVerts} vertices · Orbit to explore
            </span>
          </div>
          <button onClick={onClose} className="pe-transition" style={{
            background: '#fff', border: '1px solid #d4d7dd',
            color: '#5f6368', borderRadius: 4, padding: '4px 12px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>✕ Close</button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '4px 16px',
          borderBottom: '1px solid #d4d7dd',
          fontSize: 10, color: '#5f6368', background: '#f8f9fb',
        }}>
          <span>[Drag] Orbit</span>
          <span>[Scroll] Zoom</span>
          <button onClick={resetView} className="pe-transition" style={{
            marginLeft: 'auto',
            background: '#fff', border: '1px solid #d4d7dd',
            color: '#5f6368', borderRadius: 4, padding: '3px 10px',
            fontSize: 10, cursor: 'pointer',
          }}>Reset View</button>
        </div>

        {/* 3D Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
          style={{ flex: 1, position: 'relative', cursor: 'grab' }}
        />
      </div>
    </div>
  );
}
