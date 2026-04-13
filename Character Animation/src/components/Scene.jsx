import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import LegoCharacter from "./LegoCharacter";
import MagicCube from "./MagicCube";
import EidText from "./eidText";
import Ground from "./ground";
import Lanterns from "./Lanterns";
import MosqueSilhouette from "./MosqueSilhouette";
import Particles from "./Particles";

export default function Scene({ phase, setPhase }) {
  const { camera } = useThree();
  const shakeRef = useRef(0);

  useEffect(() => {
    if (phase === "smash") {
      shakeRef.current = 1;
      const t = setTimeout(() => { shakeRef.current = 0; }, 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useFrame(() => {
    if (shakeRef.current > 0) {
      const s = shakeRef.current * 0.12;
      camera.position.x = (Math.random() - 0.5) * s;
      camera.position.y = 3 + (Math.random() - 0.5) * s;
      shakeRef.current *= 0.90;
    } else {
      camera.position.x += (0 - camera.position.x) * 0.1;
      camera.position.y += (3 - camera.position.y) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffd700" />
      <pointLight position={[-3, 5, -3]} intensity={1.0} color="#ff6b35" />
      <pointLight position={[3, 2, 3]} intensity={0.8} color="#c084fc" />

      <Stars radius={80} depth={50} count={2000} factor={4} fade speed={0.5} />

      <Ground />
      <MosqueSilhouette />
      <Lanterns phase={phase} />
      <MagicCube phase={phase} setPhase={setPhase} />
      <LegoCharacter phase={phase} setPhase={setPhase} />
      <Particles phase={phase} />
      <EidText phase={phase} />
    </>
  );
}