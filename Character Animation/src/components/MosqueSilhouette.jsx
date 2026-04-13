import * as THREE from "three";

function Dome({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0d1b2a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 12]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.06, 0.5, 8]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <torusGeometry args={[0.1, 0.025, 6, 16, Math.PI * 1.4]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Minaret({ position, height = 3, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.25, height, 8]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      <mesh position={[0, height + 0.3, 0]}>
        <coneGeometry args={[0.22, 0.6, 8]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      <mesh position={[0, height + 0.7, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.08, 0.018, 6, 14, Math.PI * 1.4]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default function MosqueSilhouette() {
  return (
    <group position={[0, 0, -12]}>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[8, 2.2, 1]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      <Dome position={[0, 2.5, 0]} scale={1.2} />
      <Dome position={[-2.2, 2.0, 0]} scale={0.7} />
      <Dome position={[2.2, 2.0, 0]} scale={0.7} />
      <Minaret position={[-4.5, 0, 0]} height={4} scale={0.85} />
      <Minaret position={[4.5, 0, 0]} height={4} scale={0.85} />
      <Minaret position={[-2.8, 0, 0]} height={3} scale={0.7} />
      <Minaret position={[2.8, 0, 0]} height={3} scale={0.7} />

      {/* Moon */}
      <mesh position={[6, 6, -2]}>
        <sphereGeometry args={[1.0, 14, 14]} />
        <meshStandardMaterial color="#FFF3B0" emissive="#FFE066" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[6, 6, -2]} intensity={1.2} color="#FFF3B0" distance={25} />
    </group>
  );
}