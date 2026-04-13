import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Simple sprite-style star
function Star({ position }) {
  const ref = useRef();
  const speed = useRef(Math.random() * 2 + 1);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * speed.current;
      ref.current.rotation.z = state.clock.elapsedTime * speed.current * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} />
    </mesh>
  );
}

// Individual floating letter block
function LetterBlock({ char, position, color, emissive, delay }) {
  const ref = useRef();
  const progress = useRef(0);
  const started = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (!started.current) {
      delay -= delta;
      if (delay > 0) return;
      started.current = true;
    }
    progress.current = Math.min(1, progress.current + delta * 3);
    const t = easeOutBack(progress.current);
    ref.current.scale.setScalar(Math.max(0.001, t));
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.05;
  });

  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  return (
    <mesh ref={ref} position={position} scale={0.001}>
      <boxGeometry args={[0.55, 0.7, 0.18]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} roughness={0.1} metalness={0.7} />
    </mesh>
  );
}

export default function EidText({ phase }) {
  const groupRef = useRef();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (phase === "revealed") {
      // Small delay so cube finishes opening first
      const t = setTimeout(() => setShow(true), 300);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useFrame((state) => {
    if (groupRef.current && show) {
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    }
  });

  if (!show) return null;

  // EID letters positions
  const eidLetters  = ["E","I","D"];
  const mubarakLetters = ["M","U","B","A","R","A","K"];

  const eidColors    = { color: "#FFD700", emissive: "#FF8C00" };
  const mubarakColor = { color: "#ffffff", emissive: "#a855f7" };

  const eidSpacing = 0.65;
  const mbSpacing  = 0.62;
  const eidOffset  = -(eidLetters.length - 1) * eidSpacing * 0.5;
  const mbOffset   = -(mubarakLetters.length - 1) * mbSpacing * 0.5;

  // Stars around the text
  const starPositions = [
    [-3.2, 0.2, 0], [3.2, 0.2, 0],
    [-2.8, 1.0, 0], [2.8, 1.0, 0],
    [-2.5,-0.7, 0], [2.5,-0.7, 0],
    [0, 1.4, 0],
  ];

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {/* EID row */}
      {eidLetters.map((ch, i) => (
        <LetterBlock
          key={`eid-${i}`}
          char={ch}
          position={[eidOffset + i * eidSpacing, 0.55, 0]}
          color={eidColors.color}
          emissive={eidColors.emissive}
          delay={i * 0.08}
        />
      ))}

      {/* MUBARAK row */}
      {mubarakLetters.map((ch, i) => (
        <LetterBlock
          key={`mb-${i}`}
          char={ch}
          position={[mbOffset + i * mbSpacing, -0.5, 0]}
          color={mubarakColor.color}
          emissive={mubarakColor.emissive}
          delay={0.3 + i * 0.06}
        />
      ))}

      {/* Decorative stars */}
      {starPositions.map((pos, i) => (
        <Star key={`star-${i}`} position={pos} />
      ))}

      {/* Glow light */}
      <pointLight position={[0, 0, 1.5]} intensity={4} color="#FFD700" distance={7} />
    </group>
  );
}