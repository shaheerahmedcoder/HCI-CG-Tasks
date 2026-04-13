import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Scene from "./components/Scene";
import Ui from "./components/ui";
import "./App.css";

export default function App() {
  const [phase, setPhase] = useState("idle");

  return (
    <div className="app-container">
      <Canvas
        shadows={false}
        camera={{ position: [0, 3, 10], fov: 60 }}
        style={{ width: "100vw", height: "100vh", background: "#030010" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#030010");
        }}
      >
        <Scene phase={phase} setPhase={setPhase} />
      </Canvas>
      <Ui phase={phase} setPhase={setPhase} />
    </div>
  );
}