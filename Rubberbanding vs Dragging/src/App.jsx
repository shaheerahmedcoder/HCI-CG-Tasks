import { useRef, useState } from 'react';

const CANVAS_WIDTH = 860;
const CANVAS_HEIGHT = 520;

const INITIAL_BOXES = [
  { id: 'box-a', label: 'Box A', x: 290, y: 300, width: 112, height: 76, accent: 'orange' },
  { id: 'box-b', label: 'Box B', x: 92, y: 116, width: 112, height: 76, accent: 'cyan' },
  { id: 'box-c', label: 'Box C', x: 565, y: 112, width: 112, height: 76, accent: 'indigo' },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCanvasPoint(event, canvasRect) {
  return {
    x: event.clientX - canvasRect.left,
    y: event.clientY - canvasRect.top,
  };
}

function getRubberbandShape(start, current, shapeType) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  if (shapeType === 'circle') {
    const diameter = Math.max(width, height);
    return {
      left: current.x >= start.x ? start.x : start.x - diameter,
      top: current.y >= start.y ? start.y : start.y - diameter,
      width: diameter,
      height: diameter,
      shapeType,
    };
  }

  return { left, top, width, height, shapeType };
}

function App() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const rubberbandRef = useRef(null);

  const [mode, setMode] = useState('drag');
  const [shapeType, setShapeType] = useState('rectangle');
  const [boxes, setBoxes] = useState(INITIAL_BOXES);
  const [shapes, setShapes] = useState([]);
  const [activeBoxId, setActiveBoxId] = useState('box-b');
  const [ghostShape, setGhostShape] = useState(null);
  const [statusText, setStatusText] = useState('Dragging active: move boxes inside the canvas with mouse or touch.');

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setGhostShape(null);
    setStatusText(
      nextMode === 'drag'
        ? 'Dragging active: move boxes inside the canvas with mouse or touch.'
        : 'Rubberbanding active: press, drag, and release to draw a new shape.',
    );
  }

  function resetLab() {
    setBoxes(INITIAL_BOXES);
    setShapes([]);
    setGhostShape(null);
    setActiveBoxId('box-b');
    setStatusText(
      mode === 'drag'
        ? 'Dragging active: move boxes inside the canvas with mouse or touch.'
        : 'Rubberbanding active: press, drag, and release to draw a new shape.',
    );
  }

  function handleBoxPointerDown(event, box) {
    if (mode !== 'drag') return;

    event.preventDefault();
    event.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const point = getCanvasPoint(event, canvasRect);

    dragRef.current = {
      boxId: box.id,
      offsetX: point.x - box.x,
      offsetY: point.y - box.y,
      pointerId: event.pointerId,
    };

    setActiveBoxId(box.id);
    setStatusText(`Dragging ${box.label}: move it anywhere inside the workspace.`);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerDown(event) {
    if (mode !== 'rubberband') return;

    event.preventDefault();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const point = getCanvasPoint(event, canvasRect);

    rubberbandRef.current = {
      start: point,
      pointerId: event.pointerId,
    };

    setGhostShape({
      left: point.x,
      top: point.y,
      width: 0,
      height: 0,
      shapeType,
    });
    setStatusText(`Rubberbanding ${shapeType}: drag outward to preview the shape.`);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event) {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const point = getCanvasPoint(event, canvasRect);

    if (mode === 'drag' && dragRef.current) {
      const { boxId, offsetX, offsetY } = dragRef.current;

      setBoxes((currentBoxes) =>
        currentBoxes.map((box) => {
          if (box.id !== boxId) return box;

          return {
            ...box,
            x: clamp(point.x - offsetX, 0, CANVAS_WIDTH - box.width),
            y: clamp(point.y - offsetY, 0, CANVAS_HEIGHT - box.height),
          };
        }),
      );
      return;
    }

    if (mode === 'rubberband' && rubberbandRef.current) {
      const nextShape = getRubberbandShape(rubberbandRef.current.start, point, shapeType);
      setGhostShape(nextShape);
    }
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      const draggedBox = boxes.find((box) => box.id === dragRef.current.boxId);
      dragRef.current = null;
      if (draggedBox) {
        setStatusText(`${draggedBox.label} placed at (${Math.round(draggedBox.x)}, ${Math.round(draggedBox.y)}).`);
      }
    }

    if (rubberbandRef.current?.pointerId === event.pointerId) {
      const completedShape = ghostShape;
      rubberbandRef.current = null;

      if (completedShape && completedShape.width > 16 && completedShape.height > 16) {
        const shapeId = `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setShapes((currentShapes) => [...currentShapes, { ...completedShape, id: shapeId }]);
        setStatusText(
          `Rubberbanded ${completedShape.shapeType} added. Total drawn shapes: ${shapes.length + 1}.`,
        );
      } else {
        setStatusText('Shape ignored because it was too small. Drag a little farther to create one.');
      }

      setGhostShape(null);
    }
  }

  function handleClearShapes() {
    setShapes([]);
    setGhostShape(null);
    setStatusText('All rubberbanded shapes were cleared from the canvas.');
  }

  const dragInstruction =
    activeBoxId && mode === 'drag'
      ? `Dragging mode: grab ${boxes.find((box) => box.id === activeBoxId)?.label ?? 'a box'} and reposition it.`
      : 'Dragging mode: drag any labeled box with mouse or touch.';

  const rubberbandInstruction =
    shapeType === 'circle'
      ? 'Rubberbanding mode: drag to define a circular preview, then release.'
      : 'Rubberbanding mode: drag diagonally to define a rectangle, then release.';

  return (
    <main className="lab-shell">
      <section className="lab-hero">
        <div className="hero-copy">
          <p className="eyebrow">HCI Lab Exercise</p>
          <h1>Dragging and Rubberbanding Interaction Demo</h1>
          <p className="hero-text">
            Compare two core direct-manipulation techniques in one workspace. Use dragging to move
            interface objects, then switch to rubberbanding to construct shapes from a live preview.
          </p>
        </div>

        <div className="hero-side">
          <div className="stat-card">
            <span>Mode</span>
            <strong>{mode === 'drag' ? 'Dragging' : 'Rubberbanding'}</strong>
          </div>
          <div className="stat-card">
            <span>Canvas Objects</span>
            <strong>{boxes.length + shapes.length}</strong>
          </div>
        </div>
      </section>

      <section className="lab-grid">
        <div className="demo-panel">
          <div className="panel-head">
            <div>
              <p className="section-tag">Interactive Workspace</p>
              <h2>Practice pointer-based interaction techniques</h2>
            </div>

            <button type="button" className="secondary-button" onClick={resetLab}>
              Reset Lab
            </button>
          </div>

          <div className="mode-toolbar" role="tablist" aria-label="Interaction mode">
            <button
              type="button"
              className={mode === 'drag' ? 'mode-button active' : 'mode-button'}
              onClick={() => handleModeChange('drag')}
            >
              Drag
            </button>
            <button
              type="button"
              className={mode === 'rubberband' ? 'mode-button active' : 'mode-button'}
              onClick={() => handleModeChange('rubberband')}
            >
              Rubberbanding
            </button>
          </div>

          <p className="mode-caption">{mode === 'drag' ? dragInstruction : rubberbandInstruction}</p>

          {mode === 'rubberband' ? (
            <div className="shape-toolbar" role="tablist" aria-label="Shape type">
              <button
                type="button"
                className={shapeType === 'rectangle' ? 'shape-button active' : 'shape-button'}
                onClick={() => setShapeType('rectangle')}
              >
                Rectangle
              </button>
              <button
                type="button"
                className={shapeType === 'circle' ? 'shape-button active' : 'shape-button'}
                onClick={() => setShapeType('circle')}
              >
                Circle
              </button>
            </div>
          ) : null}

          <div
            ref={canvasRef}
            className={mode === 'drag' ? 'canvas-board drag-mode' : 'canvas-board rubberband-mode'}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="canvas-grid" />

            {shapes.map((shape) => (
              <div
                key={shape.id}
                className={shape.shapeType === 'circle' ? 'drawn-shape circle' : 'drawn-shape rectangle'}
                style={{
                  left: `${shape.left}px`,
                  top: `${shape.top}px`,
                  width: `${shape.width}px`,
                  height: `${shape.height}px`,
                }}
              />
            ))}

            {ghostShape ? (
              <div
                className={ghostShape.shapeType === 'circle' ? 'ghost-shape circle' : 'ghost-shape rectangle'}
                style={{
                  left: `${ghostShape.left}px`,
                  top: `${ghostShape.top}px`,
                  width: `${ghostShape.width}px`,
                  height: `${ghostShape.height}px`,
                }}
              />
            ) : null}

            {boxes.map((box) => (
              <button
                key={box.id}
                type="button"
                className={`draggable-box accent-${box.accent}${activeBoxId === box.id ? ' selected' : ''}`}
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                }}
                onPointerDown={(event) => handleBoxPointerDown(event, box)}
              >
                {box.label}
              </button>
            ))}
          </div>

          <div className="canvas-footer">
            <p>{statusText}</p>
            {mode === 'rubberband' ? (
              <button type="button" className="secondary-button small" onClick={handleClearShapes}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        <aside className="info-panel">
          <div className="info-card">
            <p className="section-tag">Concept Focus</p>
            <h3>What this lab demonstrates</h3>
            <ul className="info-list">
              <li>Dragging directly repositions existing interface objects.</li>
              <li>Rubberbanding uses a temporary preview that becomes a final shape on release.</li>
              <li>Both techniques emphasize continuous visual feedback during pointer motion.</li>
            </ul>
          </div>

          <div className="info-card">
            <p className="section-tag">Live Summary</p>
            <div className="summary-grid">
              <div>
                <span>Boxes</span>
                <strong>{boxes.length}</strong>
              </div>
              <div>
                <span>Drawn Shapes</span>
                <strong>{shapes.length}</strong>
              </div>
              <div>
                <span>Shape Type</span>
                <strong>{shapeType}</strong>
              </div>
              <div>
                <span>Selected Box</span>
                <strong>{boxes.find((box) => box.id === activeBoxId)?.label ?? 'None'}</strong>
              </div>
            </div>
          </div>

          <div className="info-card">
            <p className="section-tag">How To Use</p>
            <ul className="info-list">
              <li>Select `Drag` and move any box inside the bounded canvas.</li>
              <li>Select `Rubberbanding` and drag on empty space to draw a new shape.</li>
              <li>Switch between `Rectangle` and `Circle` to compare rubberband feedback styles.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
