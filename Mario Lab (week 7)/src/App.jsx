import { useEffect, useMemo, useRef, useState } from 'react';

const TASKS = [
  { width: 108, x: 73, y: 36 },
  { width: 94, x: 68, y: 33 },
  { width: 82, x: 63, y: 29 },
  { width: 70, x: 58, y: 25 },
  { width: 58, x: 54, y: 22 },
];

const GHOSTS = [
  { id: 'ghost-a', x: 8, y: 19, scale: 1.05, delay: 0.1 },
  { id: 'ghost-b', x: 36, y: 41, scale: 0.95, delay: 0.4 },
  { id: 'ghost-c', x: 64, y: 20, scale: 1.1, delay: 0.2 },
];

const START_POSITION = { x: 8, y: 78 };
const A = 180;
const B = 110;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetween(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function computeTaskMetrics(task, sceneSize) {
  const startCenter = {
    x: (START_POSITION.x / 100) * sceneSize.width + 28,
    y: (START_POSITION.y / 100) * sceneSize.height + 42,
  };
  const targetCenter = {
    x: (task.x / 100) * sceneSize.width + task.width / 2,
    y: (task.y / 100) * sceneSize.height + task.width / 2,
  };
  const distance = distanceBetween(startCenter, targetCenter);
  const indexOfDifficulty = Math.log2(distance / task.width + 1);
  const motionTime = A + B * indexOfDifficulty;

  return {
    distance,
    startCenter,
    targetCenter,
    indexOfDifficulty,
    motionTime,
  };
}

function formatMs(value) {
  return `${value.toFixed(0)} ms`;
}

function formatNumber(value) {
  return value.toFixed(2);
}

function IntroCard() {
  return (
    <section className="intro-card">
      <p className="eyebrow">Week 07 Lab Exercise 2</p>
      <h1>Human motor performance in a target selection task</h1>
      <p className="intro-copy">
        Measure perception, decision-making, and motor execution in a mouse-based interface that
        uses Fitts&apos; Law to change movement time as targets get smaller and farther away.
      </p>

      <div className="model-block">
        <h2>You will model:</h2>
        <ul>
          <li>
            <span>Perception</span>
            <strong>Identify the shaking target while ignoring moving ghosts.</strong>
          </li>
          <li>
            <span>Decision</span>
            <strong>Choose the correct diagonal motion path to the highlighted target.</strong>
          </li>
          <li>
            <span>Motor execution</span>
            <strong>Acquire and click the target accurately with the cursor.</strong>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Ghost({ ghost, target = false, taskWidth }) {
  const style = {
    '--x': `${ghost.x}%`,
    '--y': `${ghost.y}%`,
    '--scale': ghost.scale,
    '--delay': `${ghost.delay}s`,
    '--bob-range': target ? '5px' : '16px',
  };

  const classes = ['ghost'];
  if (target) classes.push('target-ghost');

  return (
    <div className={classes.join(' ')} style={style}>
      <div className="ghost-cap" />
      <div className="ghost-body">
        <span />
        <span />
      </div>
      {target ? <div className="target-ring" style={{ width: taskWidth, height: taskWidth }} /> : null}
    </div>
  );
}

function HouseScene() {
  return (
    <div className="house">
      <div className="roof roof-left" />
      <div className="roof roof-right" />
      <div className="roof roof-center" />
      <div className="house-body">
        <div className="window-row">
          <div className="window" />
          <div className="window" />
          <div className="window" />
        </div>
      </div>
      <div className="ladder">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

function Character({ moving, motionTime, position }) {
  const style = {
    '--char-x': `${position.x}%`,
    '--char-y': `${position.y}%`,
    '--motion-time': `${motionTime}ms`,
  };

  return (
    <div className={`character ${moving ? 'moving' : ''}`} style={style} aria-hidden="true">
      <div className="hat" />
      <div className="face" />
      <div className="body" />
      <div className="arm arm-left" />
      <div className="arm arm-right" />
      <div className="leg leg-left" />
      <div className="leg leg-right" />
    </div>
  );
}

function StatsPanel({ round, task, metrics, attempts, hits, lastResult }) {
  const successRate = attempts === 0 ? 0 : (hits / attempts) * 100;

  return (
    <aside className="stats-panel">
      <div>
        <p className="stats-label">Round</p>
        <strong>{round + 1} / {TASKS.length}</strong>
      </div>
      <div>
        <p className="stats-label">Distance (D)</p>
        <strong>{metrics.distance.toFixed(0)} px</strong>
      </div>
      <div>
        <p className="stats-label">Target Width (W)</p>
        <strong>{task.width.toFixed(0)} px</strong>
      </div>
      <div>
        <p className="stats-label">Index of Difficulty</p>
        <strong>{formatNumber(metrics.indexOfDifficulty)} bits</strong>
      </div>
      <div>
        <p className="stats-label">Predicted Motion Time</p>
        <strong>{formatMs(metrics.motionTime)}</strong>
      </div>
      <div>
        <p className="stats-label">Success Rate</p>
        <strong>{successRate.toFixed(0)}%</strong>
      </div>
      {lastResult ? (
        <div className={`result-pill ${lastResult.hit ? 'hit' : 'miss'}`}>
          {lastResult.hit
            ? `Hit in ${formatMs(lastResult.acquisitionTime)}`
            : `Miss after ${formatMs(lastResult.acquisitionTime)}`}
        </div>
      ) : (
        <div className="result-pill neutral">Click the shaking target to begin.</div>
      )}
    </aside>
  );
}

function App() {
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [characterPosition, setCharacterPosition] = useState(START_POSITION);
  const [moving, setMoving] = useState(false);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [sceneSize, setSceneSize] = useState({ width: 920, height: 620 });
  const sceneRef = useRef(null);
  const timeoutRef = useRef(null);

  const task = TASKS[round];
  const metrics = useMemo(() => computeTaskMetrics(task, sceneSize), [sceneSize, task]);

  useEffect(() => {
    setStartedAt(performance.now());
  }, [round]);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  useEffect(() => {
    if (!sceneRef.current) return undefined;

    const updateSize = () => {
      const rect = sceneRef.current.getBoundingClientRect();
      setSceneSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(sceneRef.current);

    return () => observer.disconnect();
  }, []);

  const lineStyle = {
    '--line-left': `${(metrics.startCenter.x / sceneSize.width) * 100}%`,
    '--line-top': `${(metrics.startCenter.y / sceneSize.height) * 100}%`,
    '--line-width': `${metrics.distance}px`,
    '--line-angle': `${Math.atan2(
      metrics.targetCenter.y - metrics.startCenter.y,
      metrics.targetCenter.x - metrics.startCenter.x,
    )}rad`,
    '--line-progress': moving ? 1 : 0.32,
  };

  const targetBoxStyle = {
    left: `${task.x}%`,
    top: `${task.y}%`,
    width: `${task.width}px`,
    height: `${task.width}px`,
  };

  function handleAttempt(hit) {
    if (moving) return;

    const acquisitionTime = performance.now() - startedAt;
    setAttempts((value) => value + 1);
    if (hit) {
      setHits((value) => value + 1);
      setMoving(true);
      setCharacterPosition({
        x: clamp(task.x + task.width / 11 - 1.5, 0, 88),
        y: clamp(task.y + task.width / 14 + 4, 0, 84),
      });

      timeoutRef.current = window.setTimeout(() => {
        setMoving(false);
        setLastResult({ hit: true, acquisitionTime });
        setRound((value) => (value + 1) % TASKS.length);
        setCharacterPosition(START_POSITION);
      }, metrics.motionTime);
    } else {
      setLastResult({ hit: false, acquisitionTime });
    }
  }

  return (
    <main className="app-shell">
      <IntroCard />

      <section className="lab-shell">
        <div className="lab-header">
          <div>
            <p className="lab-kicker">Lab Practice CG (Week 07)</p>
            <h2>Find the real target, then click it accurately</h2>
          </div>
          <button
            type="button"
            className="reset-button"
            onClick={() => {
              window.clearTimeout(timeoutRef.current);
              setRound(0);
              setAttempts(0);
              setHits(0);
              setLastResult(null);
              setCharacterPosition(START_POSITION);
              setMoving(false);
              setStartedAt(performance.now());
            }}
          >
            Reset Lab
          </button>
        </div>

        <div className="lab-layout">
          <div className="scene-panel">
            <div className="scene-frame" ref={sceneRef}>
              <div className="scene-sky" />
              <div className="scene-mist mist-a" />
              <div className="scene-mist mist-b" />
              <div className="tree" />
              <HouseScene />

              {GHOSTS.map((ghost) => (
                <Ghost key={ghost.id} ghost={ghost} />
              ))}

              <button
                type="button"
                className="target-button"
                style={targetBoxStyle}
                onClick={() => handleAttempt(true)}
                aria-label="Target ghost"
                disabled={moving}
              >
                <Ghost ghost={{ id: 'target', x: 0, y: 0, scale: 1 }} target taskWidth={task.width} />
              </button>

              <div className="target-guide outer" style={targetBoxStyle} />
              <div
                className="target-guide inner"
                style={{
                  left: `${task.x + 3}%`,
                  top: `${task.y + 3}%`,
                  width: `${task.width - 20}px`,
                  height: `${task.width - 20}px`,
                }}
              />

              <button
                type="button"
                className="miss-layer"
                onClick={() => handleAttempt(false)}
                aria-label="Scene area"
                disabled={moving}
              />

              <div className="path-line" style={lineStyle} />
              <Character moving={moving} motionTime={metrics.motionTime} position={characterPosition} />
            </div>
          </div>

          <StatsPanel
            round={round}
            task={task}
            metrics={metrics}
            attempts={attempts}
            hits={hits}
            lastResult={lastResult}
          />
        </div>

        <div className="lab-footer">
          <div>
            <p className="stats-label">How this shows Fitts&apos; Law</p>
            <p>
              As the target becomes smaller and farther away across rounds, the index of difficulty
              rises and the avatar&apos;s motion time increases accordingly.
            </p>
          </div>
          <div>
            <p className="stats-label">What to submit</p>
            <p>
              Run the lab, record hit times for each round, and compare observed acquisition time to
              the predicted movement time shown in the panel.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
