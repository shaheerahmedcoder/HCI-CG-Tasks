import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Particles({ phase }) {
  const meshRef = useRef();
  const [active, setActive] = useState(false);

  const COUNT = 200;

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const velocities = useRef([]);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const eidColors = [
    new THREE.Color("#FFD700"),
    new THREE.Color("#FF6B35"),
    new THREE.Color("#C084FC"),
    new THREE.Color("#34D399"),
    new THREE.Color("#F472B6"),
    new THREE.Color("#60A5FA"),
  ];

  function initParticles() {
    velocities.current = [];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.75;
      positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;
      const speed = 2 + Math.random() * 4;

      velocities.current.push({
        x: Math.cos(angle) * Math.cos(elevation) * speed,
        y: Math.sin(elevation) * speed + 2,
        z: Math.sin(angle) * Math.cos(elevation) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
      });

      const col = eidColors[Math.floor(Math.random() * eidColors.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    if (meshRef.current) {
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.attributes.color.needsUpdate = true;
    }
  }

  useEffect(() => {
    if (phase === "smash" || phase === "opening") {
      initParticles();
      setActive(true);
    }
    if (phase === "idle") {
      setActive(false);
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return;

    let anyAlive = false;

    for (let i = 0; i < COUNT; i++) {
      const v = velocities.current[i];
      if (v.life <= 0) continue;

      anyAlive = true;
      v.life -= v.decay;
      v.y -= delta * 4; // gravity
      v.x *= 0.98;
      v.z *= 0.98;

      positions[i * 3] += v.x * delta;
      positions[i * 3 + 1] += v.y * delta;
      positions[i * 3 + 2] += v.z * delta;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;

    if (!anyAlive) setActive(false);
  });

  return (
    <points ref={meshRef} visible={active}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}