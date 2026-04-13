import "./ui.css";

export default function Ui({ phase, setPhase }) {
  const handleStart = () => {
    if (phase === "idle") setPhase("walking");
  };

  return (
    <div className="ui-overlay">

      {/* Top title */}
      <div className="ui-title">
        <span className="crescent">☽</span> EID GREET HCI-CG <span className="crescent">☾</span>
      </div>

      {/* Start button */}
      {phase === "idle" && (
        <button className="ui-btn start-btn" onClick={handleStart}>
          🔨 Smash the Cube!
        </button>
      )}

      {phase === "walking" && (
        <div className="ui-hint">Lego character is approaching... 🚶</div>
      )}

      {phase === "windup" && (
        <div className="ui-hint ui-hint--warning">⚡ Get ready... HAMMER TIME!</div>
      )}

      {phase === "smash" && (
        <div className="ui-hint ui-hint--smash">💥 SMASH!!</div>
      )}

      {phase === "opening" && (
        <div className="ui-hint ui-hint--open">✨ The cube is opening...</div>
      )}

      {/* Revealed — stays on screen, no button, no sub-message */}
      {phase === "revealed" && (
        <div className="ui-revealed">
          <div className="ui-eid-text">☽ Eid Mubarak ☾</div>
        </div>
      )}

    </div>
  );
}