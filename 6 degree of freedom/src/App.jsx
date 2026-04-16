import { useEffect, useState } from 'react';

const MOVE_STEP = 0.2;
const ROTATE_STEP = 12;
const INITIAL_POSE = {
  x: 0,
  y: 0,
  z: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
};

const CONTROL_GROUPS = [
  {
    title: 'Translation',
    items: [
      { keyLabel: 'Left Arrow', description: 'Move cube left on X-axis' },
      { keyLabel: 'Right Arrow', description: 'Move cube right on X-axis' },
      { keyLabel: 'Up Arrow', description: 'Move cube up on Y-axis' },
      { keyLabel: 'Down Arrow', description: 'Move cube down on Y-axis' },
      { keyLabel: 'W', description: 'Move cube forward on Z-axis' },
      { keyLabel: 'S', description: 'Move cube backward on Z-axis' },
    ],
  },
  {
    title: 'Rotation',
    items: [
      { keyLabel: 'X', description: 'Rotate around X-axis' },
      { keyLabel: 'Y', description: 'Rotate around Y-axis' },
      { keyLabel: 'Z', description: 'Rotate around Z-axis' },
    ],
  },
];

function formatAxis(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

function formatAngle(value) {
  return `${value}deg`;
}

function App() {
  const [pose, setPose] = useState(INITIAL_POSE);
  const [lastKey, setLastKey] = useState('Waiting for input');

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key;
      const lowered = key.toLowerCase();
      const trackedKeys = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 's', 'x', 'y', 'z'];

      if (!trackedKeys.includes(lowered)) {
        return;
      }

      event.preventDefault();
      setLastKey(key === ' ' ? 'Space' : key);

      setPose((currentPose) => {
        const nextPose = { ...currentPose };

        if (key === 'ArrowLeft') nextPose.x -= MOVE_STEP;
        if (key === 'ArrowRight') nextPose.x += MOVE_STEP;
        if (key === 'ArrowUp') nextPose.y += MOVE_STEP;
        if (key === 'ArrowDown') nextPose.y -= MOVE_STEP;
        if (lowered === 'w') nextPose.z += MOVE_STEP;
        if (lowered === 's') nextPose.z -= MOVE_STEP;
        if (lowered === 'x') nextPose.rotateX += ROTATE_STEP;
        if (lowered === 'y') nextPose.rotateY += ROTATE_STEP;
        if (lowered === 'z') nextPose.rotateZ += ROTATE_STEP;

        return nextPose;
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cubeTransform = `
    translate3d(${pose.x}rem, ${pose.y * -1}rem, ${pose.z}rem)
    rotateX(${pose.rotateX}deg)
    rotateY(${pose.rotateY}deg)
    rotateZ(${pose.rotateZ}deg)
  `;

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">6 Degree of Freedom Lab</p>
          <h1>Interactive cube control with 3 translations and 3 rotations</h1>
          <p className="hero-text">
            This lab demonstrates six degrees of freedom by letting you translate the cube along
            the X, Y, and Z axes and rotate it around those same axes using the keyboard.
          </p>
        </div>

        <div className="hero-status">
          <div className="status-card">
            <span className="status-label">Last input</span>
            <strong>{lastKey}</strong>
          </div>
          <button type="button" className="reset-button" onClick={() => setPose(INITIAL_POSE)}>
            Reset Cube
          </button>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="viewport-card">
          <div className="viewport-head">
            <div>
              <p className="section-tag">3D Workspace</p>
              <h2>Manipulate the cube in real time</h2>
            </div>
            <p className="focus-note">Click anywhere on the page, then use the keys listed on the right.</p>
          </div>

          <div className="scene-shell">
            <div className="scene-backdrop" />
            <div className="axis axis-x">X</div>
            <div className="axis axis-y">Y</div>
            <div className="axis axis-z">Z</div>
            <div className="platform" />

            <div className="cube-stage">
              <div className="cube" style={{ transform: cubeTransform }}>
                <div className="face front">Front</div>
                <div className="face back">Back</div>
                <div className="face right">Right</div>
                <div className="face left">Left</div>
                <div className="face top">Top</div>
                <div className="face bottom">Bottom</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="control-card">
          <div className="readout-card">
            <p className="section-tag">Live Readout</p>
            <div className="readout-grid">
              <div>
                <span>X Position</span>
                <strong>{formatAxis(pose.x)}</strong>
              </div>
              <div>
                <span>Y Position</span>
                <strong>{formatAxis(pose.y)}</strong>
              </div>
              <div>
                <span>Z Position</span>
                <strong>{formatAxis(pose.z)}</strong>
              </div>
              <div>
                <span>Rotate X</span>
                <strong>{formatAngle(pose.rotateX)}</strong>
              </div>
              <div>
                <span>Rotate Y</span>
                <strong>{formatAngle(pose.rotateY)}</strong>
              </div>
              <div>
                <span>Rotate Z</span>
                <strong>{formatAngle(pose.rotateZ)}</strong>
              </div>
            </div>
          </div>

          <div className="controls-card">
            <p className="section-tag">Controls</p>
            {CONTROL_GROUPS.map((group) => (
              <div key={group.title} className="control-group">
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.keyLabel}>
                      <kbd>{item.keyLabel}</kbd>
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="notes-card">
            <p className="section-tag">Lab Summary</p>
            <p>
              Functionality is preserved from the reference task: four arrow keys control planar
              translation, <strong>W/S</strong> move on the depth axis, and <strong>X/Y/Z</strong>{' '}
              rotate the cube around the three axes.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
