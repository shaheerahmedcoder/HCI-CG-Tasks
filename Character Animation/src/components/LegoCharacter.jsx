import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LegoCharacter({ phase, setPhase }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const armRightRef = useRef();
  const armLeftRef = useRef();
  const legLeftRef = useRef();
  const legRightRef = useRef();
  const headRef = useRef();

  const walkClock = useRef(0);
  const charXRef = useRef(-8);
  const TARGET_X = -2.5;

  useEffect(() => {
    if (phase === "windup") {
      const timer = setTimeout(() => setPhase("smash"), 1200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (phase === "walking") {
      walkClock.current += delta * 4;
      charXRef.current += delta * 3;
      if (charXRef.current >= TARGET_X) {
        charXRef.current = TARGET_X;
        setPhase("windup");
      }
      groupRef.current.position.x = charXRef.current;
      if (legLeftRef.current)  legLeftRef.current.rotation.x  =  Math.sin(walkClock.current) * 0.4;
      if (legRightRef.current) legRightRef.current.rotation.x = -Math.sin(walkClock.current) * 0.4;
      if (armLeftRef.current)  armLeftRef.current.rotation.x  = -Math.sin(walkClock.current) * 0.3;
      if (armRightRef.current) armRightRef.current.rotation.x =  Math.sin(walkClock.current) * 0.3;
      groupRef.current.position.y = Math.abs(Math.sin(walkClock.current)) * 0.08;
    }

    if (phase === "windup") {
      if (armRightRef.current)
        armRightRef.current.rotation.x = THREE.MathUtils.lerp(armRightRef.current.rotation.x, -Math.PI * 0.9, delta * 3);
      if (bodyRef.current)
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -0.25, delta * 3);
      if (legLeftRef.current)  legLeftRef.current.rotation.x  = THREE.MathUtils.lerp(legLeftRef.current.rotation.x, 0, delta * 5);
      if (legRightRef.current) legRightRef.current.rotation.x = THREE.MathUtils.lerp(legRightRef.current.rotation.x, 0, delta * 5);
    }

    if (phase === "smash") {
      if (armRightRef.current)
        armRightRef.current.rotation.x = THREE.MathUtils.lerp(armRightRef.current.rotation.x, Math.PI * 0.35, delta * 18);
      if (bodyRef.current)
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0.35, delta * 12);
    }

    if (phase === "idle") {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }

    if (phase === "revealed") {
      walkClock.current += delta * 6;
      groupRef.current.position.y = Math.abs(Math.sin(walkClock.current * 0.8)) * 0.15;
      if (armLeftRef.current)  armLeftRef.current.rotation.x  =  Math.sin(walkClock.current) * 0.6 - 0.6;
      if (armRightRef.current) armRightRef.current.rotation.x = -Math.sin(walkClock.current) * 0.6 - 0.6;
    }
  });

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.x = -8;
      charXRef.current = -8;
    }
  }, []);

  const SKIN = "#FFCC80"; const RED = "#CC2200"; const DARK = "#1a1a1a";
  const GOLD = "#FFD700"; const BROWN = "#8B4513"; const SILVER = "#AAAAAA";

  return (
    <group ref={groupRef} position={[-8, 0, 1]}>
      {[[-0.18, legLeftRef], [0.18, legRightRef]].map(([x, ref], idx) => (
        <group key={idx} ref={ref} position={[x, 0.35, 0]}>
          <mesh castShadow><boxGeometry args={[0.22, 0.55, 0.25]} /><meshStandardMaterial color={DARK} roughness={0.4} /></mesh>
          <mesh position={[0, -0.3, 0.05]} castShadow><boxGeometry args={[0.24, 0.1, 0.32]} /><meshStandardMaterial color={DARK} roughness={0.4} /></mesh>
        </group>
      ))}

      <group ref={bodyRef} position={[0, 1.0, 0]}>
        <mesh castShadow><boxGeometry args={[0.7, 0.65, 0.4]} /><meshStandardMaterial color={RED} roughness={0.3} metalness={0.1} /></mesh>

        <group ref={armLeftRef} position={[-0.45, 0.1, 0]}>
          <mesh castShadow><boxGeometry args={[0.2, 0.55, 0.22]} /><meshStandardMaterial color={SKIN} roughness={0.3} /></mesh>
          <mesh position={[0, -0.35, 0]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color={SKIN} roughness={0.4} /></mesh>
        </group>

        <group ref={armRightRef} position={[0.45, 0.1, 0]}>
          <mesh castShadow><boxGeometry args={[0.2, 0.55, 0.22]} /><meshStandardMaterial color={SKIN} roughness={0.3} /></mesh>
          <mesh position={[0, -0.35, 0]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color={SKIN} roughness={0.4} /></mesh>
          <group position={[0.05, -0.65, 0]}>
            <mesh><cylinderGeometry args={[0.04, 0.04, 0.85, 8]} /><meshStandardMaterial color={BROWN} roughness={0.7} /></mesh>
            <mesh position={[0, 0.52, 0]}><boxGeometry args={[0.3, 0.24, 0.24]} /><meshStandardMaterial color={SILVER} roughness={0.15} metalness={0.85} /></mesh>
          </group>
        </group>

        <group ref={headRef} position={[0, 0.6, 0]}>
          <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.15, 0.15, 0.1, 12]} /><meshStandardMaterial color={SKIN} roughness={0.3} /></mesh>
          <mesh position={[0, 0.18, 0]} castShadow><boxGeometry args={[0.55, 0.55, 0.5]} /><meshStandardMaterial color={SKIN} roughness={0.3} /></mesh>
          <mesh position={[0, 0.49, 0]}><cylinderGeometry args={[0.12, 0.12, 0.08, 12]} /><meshStandardMaterial color={SKIN} roughness={0.3} /></mesh>
          {[-0.12, 0.12].map((ex, i) => (
            <mesh key={i} position={[ex, 0.22, 0.26]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color={DARK} roughness={0.1} /></mesh>
          ))}
          <mesh position={[0, 0.1, 0.26]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.1, 0.02, 8, 12, Math.PI]} /><meshStandardMaterial color={DARK} roughness={0.1} /></mesh>
          <mesh position={[0, 0.58, 0]}><cylinderGeometry args={[0.14, 0.27, 0.26, 12]} /><meshStandardMaterial color="#8B0000" roughness={0.4} /></mesh>
          <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.27, 0.27, 0.04, 12]} /><meshStandardMaterial color="#8B0000" roughness={0.4} /></mesh>
          <mesh position={[0.12, 0.78, 0]}><cylinderGeometry args={[0.014, 0.004, 0.16, 6]} /><meshStandardMaterial color={GOLD} roughness={0.3} emissive={GOLD} emissiveIntensity={0.2} /></mesh>
        </group>
      </group>
    </group>
  );
}