import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function Lantern({ position, color, phase }) {
  const ref = useRef();
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + offset.current;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.08;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.05;

    // Glow more when revealed
    const intensity = phase === "revealed" ? 1.5 : 0.8;
    if (ref.current.children[2]) {
      ref.current.children[2].intensity = intensity + Math.sin(t * 2) * 0.2;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* String */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
        <meshStandardMaterial color="#888" />
      </mesh>

      {/* Lantern body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.35, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.3}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Light source */}
      <pointLight color={color} intensity={0.8} distance={3} decay={2} />

      {/* Cap top */}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.15, 0.12, 8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom tassel */}
      <mesh position={[0, -0.22, 0]}>
        <coneGeometry args={[0.04, 0.15, 6]} rotation={[Math.PI, 0, 0]} />
        <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Lanterns({ phase }) {
  const lanternData = [
    { position: [-4, 3.5, 0], color: "#FF4500" },
    { position: [-2.5, 4, -1], color: "#FFD700" },
    { position: [2.5, 4, -1], color: "#00CED1" },
    { position: [4, 3.5, 0], color: "#FF69B4" },
    { position: [-6, 3, -2], color: "#9370DB" },
    { position: [6, 3, -2], color: "#32CD32" },
    { position: [0, 4.5, -2], color: "#FFD700" },
  ];

  return (
    <group>
      {/* Connecting rope */}
      <mesh position={[0, 4.2, -1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 14, 4]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>

      {lanternData.map((l, i) => (
        <Lantern key={i} position={l.position} color={l.color} phase={phase} />
      ))}
    </group>
  );
}