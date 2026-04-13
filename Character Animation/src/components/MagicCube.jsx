import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CubePanel({ position, rotation, openRotation, openAxis, phase, delay = 0, color }) {
  const ref = useRef();
  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (phase === "opening" || phase === "revealed") {
      progress.current = Math.min(1, progress.current + delta * 1.2);
      const eased = easeOutBack(Math.max(0, progress.current - delay));
      if (openAxis === "x") ref.current.rotation.x = THREE.MathUtils.lerp(0, openRotation, eased);
      else if (openAxis === "z") ref.current.rotation.z = THREE.MathUtils.lerp(0, openRotation, eased);
    }
  });

  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.4} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.52, 1.52, 0.06]} />
        <meshStandardMaterial color="#FFD700" roughness={0.1} metalness={0.9} wireframe />
      </mesh>
    </group>
  );
}

export default function MagicCube({ phase, setPhase }) {
  const cubeRef = useRef();
  const shakeRef = useRef(0);
  // Guards so timers only fire once
  const smashFired = useRef(false);
  const openFired = useRef(false);

  useEffect(() => {
    if (phase === "smash" && !smashFired.current) {
      smashFired.current = true;
      shakeRef.current = 1;
      const t = setTimeout(() => setPhase("opening"), 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "opening" && !openFired.current) {
      openFired.current = true;
      const t = setTimeout(() => setPhase("revealed"), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useFrame((state) => {
    if (!cubeRef.current) return;

    if (phase === "idle" || phase === "walking" || phase === "windup") {
      cubeRef.current.position.y = 0.75 + Math.sin(state.clock.elapsedTime * 1.8) * 0.06;
      cubeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }

    if (phase === "smash" && shakeRef.current > 0) {
      const s = 0.12;
      cubeRef.current.position.x = (Math.random() - 0.5) * s;
      cubeRef.current.position.y = 0.75 + (Math.random() - 0.5) * s;
      cubeRef.current.rotation.z = (Math.random() - 0.5) * 0.08;
      shakeRef.current -= 0.02;
    }

    if (phase === "opening" || phase === "revealed") {
      cubeRef.current.position.x = THREE.MathUtils.lerp(cubeRef.current.position.x, 0, 0.1);
      cubeRef.current.rotation.z = THREE.MathUtils.lerp(cubeRef.current.rotation.z, 0, 0.1);
      cubeRef.current.position.y = THREE.MathUtils.lerp(cubeRef.current.position.y, 0.75, 0.05);
    }
  });

  const colors = ["#1a237e","#1a237e","#4a148c","#1b5e20","#b71c1c","#e65100"];
  const h = 0.75;

  return (
    <group ref={cubeRef} position={[0, 0.75, 0]}>
      <CubePanel position={[0, 0,  h]} rotation={[0,0,0]}           openRotation={ Math.PI*0.7}  openAxis="x" phase={phase} delay={0}    color={colors[0]} />
      <CubePanel position={[0, 0, -h]} rotation={[0,Math.PI,0]}     openRotation={-Math.PI*0.7}  openAxis="x" phase={phase} delay={0.1}  color={colors[1]} />
      <CubePanel position={[0,  h, 0]} rotation={[-Math.PI/2,0,0]}  openRotation={-Math.PI*0.75} openAxis="x" phase={phase} delay={0.05} color={colors[2]} />
      <CubePanel position={[0, -h, 0]} rotation={[ Math.PI/2,0,0]}  openRotation={ Math.PI*0.6}  openAxis="x" phase={phase} delay={0.15} color={colors[3]} />
      <CubePanel position={[-h, 0, 0]} rotation={[0,-Math.PI/2,0]}  openRotation={-Math.PI*0.7}  openAxis="z" phase={phase} delay={0.08} color={colors[4]} />
      <CubePanel position={[ h, 0, 0]} rotation={[0, Math.PI/2,0]}  openRotation={ Math.PI*0.7}  openAxis="z" phase={phase} delay={0.12} color={colors[5]} />
      {(phase === "opening" || phase === "revealed") && (
        <pointLight position={[0,0,0]} intensity={3} color="#FFD700" distance={4} />
      )}
    </group>
  );
}