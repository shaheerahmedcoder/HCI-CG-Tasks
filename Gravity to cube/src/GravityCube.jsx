import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GravityCube() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d1a);
    scene.fog = new THREE.Fog(0x0d0d1a, 25, 60);

    // ── Camera (Right-Hand CS: Y up, Z toward viewer) ─────────
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(6, 5, 10);
    camera.lookAt(0, 1, 0);

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4488ff, 2, 18);
    pointLight.position.set(-4, 4, 6);
    scene.add(pointLight);

    // ── Floor (XZ plane, Y = 0) ───────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.GridHelper(30, 30, 0x223355, 0x1a2244));

    // ── World Axis Helper (X=red, Y=green, Z=blue) ────────────
    const axisHelper = new THREE.AxesHelper(3);
    axisHelper.position.set(-5, 0.01, -4);
    scene.add(axisHelper);

    // Sprite label helper
    const makeLabel = (text, color) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.font = "bold 52px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 32, 32);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
      );
      sprite.scale.set(0.75, 0.75, 0.75);
      return sprite;
    };

    const xLabel = makeLabel("X", "#ff4444");
    xLabel.position.set(-5 + 3.6, 0.35, -4);
    scene.add(xLabel);

    const yLabel = makeLabel("Y", "#44ff44");
    yLabel.position.set(-5, 3.7, -4);
    scene.add(yLabel);

    const zLabel = makeLabel("Z", "#4488ff");
    zLabel.position.set(-5, 0.35, -4 + 3.6);
    scene.add(zLabel);

    // ── Gravity arrow (-Y direction) ──────────────────────────
    const gArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(3.5, 5, 0),
      2.2, 0xffaa00, 0.45, 0.3
    );
    scene.add(gArrow);
    const gLabel = makeLabel("g", "#ffaa00");
    gLabel.position.set(4.1, 4.5, 0);
    scene.add(gLabel);

    // ── The Cube ──────────────────────────────────────────────
    const cubeSize = 1;
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
      [
        new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3, metalness: 0.5 }), // +X
        new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.3, metalness: 0.5 }), // -X
        new THREE.MeshStandardMaterial({ color: 0x33ff66, roughness: 0.3, metalness: 0.5 }), // +Y
        new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.3, metalness: 0.5 }), // -Y
        new THREE.MeshStandardMaterial({ color: 0xffff33, roughness: 0.3, metalness: 0.5 }), // +Z
        new THREE.MeshStandardMaterial({ color: 0xff33ff, roughness: 0.3, metalness: 0.5 }), // -Z
      ]
    );
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // ── Physics constants ─────────────────────────────────────
    const GRAVITY = -9.8;             // m/s² in −Y (world up = +Y)
    const DROP_HEIGHT = 9;
    const FLOOR_Y = cubeSize / 2;     // bottom of cube at Y=0 → center at 0.5
    const RESTITUTION = 0.55;         // bounciness coefficient
    const ANG_DAMPING = 0.97;

    // ── Physics state ─────────────────────────────────────────
    let posY = DROP_HEIGHT;
    let velY = 0;
    let angVelX = (Math.random() - 0.5) * 5;
    let angVelZ = (Math.random() - 0.5) * 5;
    let settled = false;

    cube.position.set(0, posY, 0);
    cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    // ── Impact particles ──────────────────────────────────────
    const particles = [];
    const pGeo = new THREE.SphereGeometry(0.05, 4, 4);

    function spawnParticles(x, z) {
      for (let i = 0; i < 14; i++) {
        const p = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true }));
        p.position.set(x, FLOOR_Y, z);
        const speed = 1.5 + Math.random() * 3.5;
        const angle = Math.random() * Math.PI * 2;
        p._vx = Math.cos(angle) * speed;
        p._vy = 1.5 + Math.random() * 4;
        p._vz = Math.sin(angle) * speed;
        p._life = 1.0;
        scene.add(p);
        particles.push(p);
      }
    }

    // ── Reset / re-drop ───────────────────────────────────────
    function resetCube() {
      posY = DROP_HEIGHT;
      velY = 0;
      angVelX = (Math.random() - 0.5) * 5;
      angVelZ = (Math.random() - 0.5) * 5;
      settled = false;
      cube.position.set(
        (Math.random() - 0.5) * 3,
        posY,
        (Math.random() - 0.5) * 3
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
    }

    // ── Animation loop ────────────────────────────────────────
    let lastTime = performance.now();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!settled) {
        // Euler integration: v = v0 + g·dt,  y = y0 + v·dt
        velY += GRAVITY * dt;
        posY += velY * dt;

        // Ground collision
        if (posY <= FLOOR_Y) {
          posY = FLOOR_Y;
          if (Math.abs(velY) > 0.6) spawnParticles(cube.position.x, cube.position.z);
          velY = -velY * RESTITUTION;
          angVelX *= 0.55;
          angVelZ *= 0.55;
          if (Math.abs(velY) < 0.12) { velY = 0; settled = true; }
        }

        cube.position.y = posY;
        cube.rotation.x += angVelX * dt;
        cube.rotation.z += angVelZ * dt;
        angVelX *= ANG_DAMPING;
        angVelZ *= ANG_DAMPING;
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p._life -= dt * 1.8;
        p._vy += GRAVITY * dt;
        p.position.x += p._vx * dt;
        p.position.y = Math.max(0, p.position.y + p._vy * dt);
        p.position.z += p._vz * dt;
        p.material.opacity = Math.max(0, p._life);
        if (p._life <= 0) { scene.remove(p); particles.splice(i, 1); }
      }

      renderer.render(scene, camera);
    }

    animate();

    // Auto re-drop every 5 seconds
    const autoReset = setInterval(resetCube, 5000);

    // Click to re-drop
    mount.addEventListener("click", resetCube);

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(autoReset);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("click", resetCube);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0d0d1a", position: "relative", fontFamily: "'Courier New', monospace" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        color: "#aabbff", fontSize: 13, lineHeight: 1.8,
        background: "rgba(0,0,30,0.75)", padding: "14px 18px",
        borderRadius: 10, border: "1px solid #223366",
        backdropFilter: "blur(6px)",
        userSelect: "none",
      }}>
        <div style={{ color: "#6699ff", fontWeight: "bold", fontSize: 15, marginBottom: 6, letterSpacing: 2 }}>
          🧊 GRAVITY CUBE
        </div>
        <div><span style={{ color: "#ff4444", fontWeight: "bold" }}>X</span> — Right</div>
        <div><span style={{ color: "#44ff44", fontWeight: "bold" }}>Y</span> — Up &nbsp;(gravity = <span style={{ color: "#ffaa00" }}>−Y</span>)</div>
        <div><span style={{ color: "#4488ff", fontWeight: "bold" }}>Z</span> — Toward viewer</div>
        <div style={{ marginTop: 10, color: "#ffaa44", fontWeight: "bold" }}>g = 9.8 m/s²  ↓</div>
        <div style={{ marginTop: 4, color: "#445577", fontSize: 11 }}>Right-Hand Coordinate System</div>
        <div style={{ marginTop: 10, color: "#556688", fontSize: 11, borderTop: "1px solid #223366", paddingTop: 8 }}>
          Click anywhere to re-drop
        </div>
      </div>

      {/* Face colour legend */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        color: "#aabbff", fontSize: 11, lineHeight: 1.9,
        background: "rgba(0,0,30,0.7)", padding: "10px 14px",
        borderRadius: 8, border: "1px solid #1a2244",
        userSelect: "none",
      }}>
        <div style={{ color: "#6699ff", marginBottom: 4, fontWeight: "bold", fontSize: 12 }}>CUBE FACES</div>
        {[
          ["#ff3333", "+X face"],
          ["#ff8800", "−X face"],
          ["#33ff66", "+Y face"],
          ["#00aaff", "−Y face"],
          ["#ffff33", "+Z face"],
          ["#ff33ff", "−Z face"],
        ].map(([c, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
            <span style={{ color: "#778899" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
