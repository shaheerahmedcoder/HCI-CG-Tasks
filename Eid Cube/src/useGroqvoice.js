// ═══════════════════════════════════════════════════════════════════
//  useGroqVoice.js (exported as useGeminiVoice for drop-in replace)
//
//  HOW IT WORKS:
//  1. Click mic → Web Speech API transcribes your voice to text (free, instant)
//  2. Transcribed text → Groq API (llama-3.1-8b-instant model, free tier)
//  3. Groq returns JSON command in ~150ms
//  4. Action fires in the 3D scene
//
//  Groq free tier: 14,400 requests/day — plenty for demos
//  Get key free at: console.groq.com → API Keys → Create API Key
// ═══════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from "react";

// ── Color map ──────────────────────────────────────────────────────
const COLOR_MAP = {
  red:"#e74c3c", crimson:"#dc143c", scarlet:"#c0392b", maroon:"#7b1a1a",
  pink:"#f07090", "hot pink":"#ff69b4", orange:"#e67e22", amber:"#f39c12",
  gold:"#f1c40f", golden:"#f1c40f", yellow:"#f9e400", lime:"#2ecc71",
  green:"#27ae60", forest:"#1e8449", teal:"#1abc9c", cyan:"#00bcd4",
  "sky blue":"#87ceeb", blue:"#2980b9", navy:"#1a2a6c", cobalt:"#0047ab",
  purple:"#8e44ad", violet:"#9b59b6", magenta:"#e91e63", white:"#ffffff",
  black:"#111111", grey:"#7f8c8d", gray:"#7f8c8d", silver:"#bdc3c7",
  brown:"#795548", coral:"#ff6b6b", peach:"#ffbe76", lavender:"#d7aefb",
  indigo:"#3949ab", "dark red":"#8b0000", "dark blue":"#1a237e",
  "dark green":"#1b5e20", "light blue":"#87ceeb", "rose gold":"#b76e79",
  "mint green":"#98ff98", "deep purple":"#4a148c", "royal blue":"#4169e1",
  "bright red":"#ff1a1a", "neon green":"#39ff14",
};
const resolveColor = (name) => {
  if (!name) return null;
  const k = name.toLowerCase().trim();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  if (/^#[0-9a-f]{6}$/i.test(k)) return k;
  for (const [key, val] of Object.entries(COLOR_MAP))
    if (k.includes(key) || key.includes(k)) return val;
  return null;
};

// ── Presets ────────────────────────────────────────────────────────
const PRESETS = {
  classic:  { box:"#c0392b", lid:"#922b21", rib:"#f1c40f", btn:"#c0881a", border:"#7b1a10", txt:"#FFD700" },
  ocean:    { box:"#2ab4e8", lid:"#f07090", rib:"#f5a623", btn:"#c0881a", border:"#0d7aa8", txt:"#ffffff" },
  forest:   { box:"#27ae60", lid:"#8e44ad", rib:"#f39c12", btn:"#b7950b", border:"#1a6b3a", txt:"#fffde0" },
  midnight: { box:"#2c3e50", lid:"#8e44ad", rib:"#f1c40f", btn:"#d4ac0d", border:"#1a252f", txt:"#FFD700" },
};

// ── System prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a voice command interpreter for a 3D Eid gift box scene.
The user speaks casually — their words may be imperfect, indirect, or creative. Your job is to figure out their INTENT.
Reply with ONLY a valid JSON object. No explanation. No markdown. Just JSON.

AVAILABLE ACTIONS with example phrasings that map to them:

Open box: "open", "open it", "open up", "show me", "reveal it", "unwrap", "lift the lid"
→ {"action":"open"}

Close box: "close", "shut it", "put the lid back", "close it up", "hide it"
→ {"action":"close"}

Toggle: "toggle", "switch it"
→ {"action":"toggle"}

Rotate camera left: "rotate left", "turn left", "go left", "move left", "spin left"
→ {"action":"rotate","dir":"left"}

Rotate camera right: "rotate right", "turn right", "go right", "move right"
→ {"action":"rotate","dir":"right"}

Rotate up: "rotate up", "tilt up", "look up", "go up"
→ {"action":"rotate","dir":"up"}

Rotate down: "rotate down", "tilt down", "look down", "go down"
→ {"action":"rotate","dir":"down"}

Stop moving: "stop", "halt", "freeze", "don't move", "stay still", "pause"
→ {"action":"stop"}

Reset view: "reset", "go back", "front view", "face me", "default view", "original position"
→ {"action":"reset"}

Auto spin: "spin", "keep spinning", "spin around", "rotate automatically", "auto rotate"
→ {"action":"spin"}

Zoom in: "zoom in", "get closer", "move closer", "come closer", "bigger", "closer"
→ {"action":"zoom","dir":"in"}

Zoom out: "zoom out", "move back", "go back", "farther", "smaller", "back up"
→ {"action":"zoom","dir":"out"}

Change color (target=box,lid,ribbon,button,border,text; value=color name):
"make it red", "box red", "color the box blue", "turn it gold", "change to purple"
→ {"action":"color","target":"box","value":"red"}
"lid gold", "make the lid yellow", "lid should be gold"
→ {"action":"color","target":"lid","value":"gold"}
"ribbon blue", "change ribbon to blue"
→ {"action":"color","target":"ribbon","value":"blue"}
"button purple", "make button purple"
→ {"action":"color","target":"button","value":"purple"}
"text white", "make text white", "change text color to white"
→ {"action":"color","target":"text","value":"white"}

Change message text: "set text to Happy Eid", "change message to Eid Mubarak", "write Mubarak ho", "say happy eid everyone"
→ {"action":"text","value":"Happy Eid"}

Apply preset theme: "classic", "go classic", "ocean theme", "apply ocean", "use forest", "midnight theme"
→ {"action":"preset","name":"classic"}  (name: classic/ocean/forest/midnight)

Confetti: "confetti", "throw confetti", "celebrate", "party", "launch confetti"
→ {"action":"confetti"}

If genuinely unclear or random noise:
→ {"action":"unknown","heard":"what they said"}

IMPORTANT RULES:
- Be GENEROUS with interpretation — guess the most likely intent
- "takes to hello world" could be noise/mishear — return unknown
- "happy" alone is not a command — return unknown
- If someone says a color + part name in any order, map it correctly
- Default color target is "box" if unclear
- Color values must be simple English color names
- ONLY output the JSON, absolutely nothing else`;

// ── Action dispatcher ──────────────────────────────────────────────
const dispatch = (json, actions) => {
  switch (json.action) {
    case "open":     actions.openBox();                          break;
    case "close":    actions.closeBox();                         break;
    case "toggle":   actions.toggleBox();                        break;
    case "stop":     actions.stopCam();                          break;
    case "reset":    actions.resetCam();                         break;
    case "spin":     actions.autoSpin();                         break;
    case "confetti": actions.fireConfetti();                     break;
    case "rotate":   actions.rotateCam(json.dir || "left");      break;
    case "zoom":     json.dir==="in" ? actions.zoomIn() : actions.zoomOut(); break;
    case "color": {
      const hex = resolveColor(json.value);
      if (!hex) break;
      const map = { box:actions.setBox, lid:actions.setLid,
        ribbon:actions.setRibbon, button:actions.setBtn,
        border:actions.setBorder, text:actions.setTxtColor };
      (map[json.target] || actions.setBox)(hex);
      break;
    }
    case "text":   if (json.value) actions.setMsg(json.value);          break;
    case "preset": actions.applyPreset((json.name||"").toLowerCase());  break;
    default: break;
  }
};

// ── Call Groq API ──────────────────────────────────────────────────
const askGroq = async (transcript, apiKey) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",   // fastest free model on Groq
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: transcript },
      ],
      temperature: 0.1,
      max_tokens: 40,  // commands are tiny — faster response
    }),
  });

  const data = await res.json();
  console.log("Groq response:", data);

  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }

  const raw = data?.choices?.[0]?.message?.content || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON. Got: "${raw.slice(0, 80)}"`);
  return JSON.parse(match[0]);
};

// ════════════════════════════════════════════════════════════════
//  THE HOOK
// ════════════════════════════════════════════════════════════════
export const useGeminiVoice = (actions) => {
  const [status,          setStatus]         = useState("idle");
  const [lastHeard,       setLastHeard]      = useState("");
  const [lastCommand,     setLastCommand]    = useState("");
  const [lastStatus,      setLastStatus]     = useState("");
  const [log,             setLog]            = useState([]);
  const [apiKeyMissing,   setApiKeyMissing]  = useState(false);
  const [noSpeechSupport, setNoSpeechSupport]= useState(false);

  const recogRef   = useRef(null);
  const actionsRef = useRef(actions);
  const activeRef  = useRef(false);

  useEffect(() => { actionsRef.current = actions; });

  // ── Process transcript through Groq ─────────────────────────
  const processTranscript = useCallback(async (transcript) => {
    const text = transcript.trim().toLowerCase();
    if (!text) { setStatus("idle"); return; }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_key_here") {
      setApiKeyMissing(true); setStatus("error"); return;
    }

    // ── INSTANT PATH: simple single-word commands skip Groq entirely ──
    // This fires in <50ms vs ~300ms for API call
    const instantMap = {
      open: {action:"open"}, "open up": {action:"open"}, "open the box": {action:"open"},
      close: {action:"close"}, shut: {action:"close"}, "close the box": {action:"close"},
      stop: {action:"stop"}, halt: {action:"stop"}, freeze: {action:"stop"},
      spin: {action:"spin"}, "spin around": {action:"spin"},
      reset: {action:"reset"}, "reset view": {action:"reset"}, "front view": {action:"reset"},
      confetti: {action:"confetti"}, celebrate: {action:"confetti"}, party: {action:"confetti"},
      "zoom in": {action:"zoom",dir:"in"}, closer: {action:"zoom",dir:"in"},
      "zoom out": {action:"zoom",dir:"out"}, "move back": {action:"zoom",dir:"out"},
      "rotate left": {action:"rotate",dir:"left"}, "turn left": {action:"rotate",dir:"left"},
      "rotate right": {action:"rotate",dir:"right"}, "turn right": {action:"rotate",dir:"right"},
      classic: {action:"preset",name:"classic"}, ocean: {action:"preset",name:"ocean"},
      forest: {action:"preset",name:"forest"}, midnight: {action:"preset",name:"midnight"},
    };
    const matched = instantMap[text];
    if (matched) {
      dispatch(matched, actionsRef.current);
      const lbl = matched.action + (matched.dir ? " " + matched.dir : "") + (matched.name ? ": " + matched.name : "");
      setLastHeard(transcript);
      setLastCommand(lbl);
      setLastStatus("ok");
      setLog(prev => [lbl, ...prev].slice(0, 5));
      setStatus("idle");
      return; // done — no API call needed
    }

    setStatus("processing");
    setLastHeard(transcript);

    try {
      const json = await askGroq(transcript, apiKey);

      if (json.action === "unknown") {
        setLastStatus("miss");
        setLastCommand(`❓ Not understood: "${json.heard || transcript}"`);
        setStatus("idle");
        return;
      }

      let label = json.action;
      if (json.action === "color")  label = `${json.target} → ${json.value}`;
      if (json.action === "preset") label = `preset: ${json.name}`;
      if (json.action === "text")   label = `text: "${json.value}"`;
      if (json.action === "rotate") label = `rotate ${json.dir}`;
      if (json.action === "zoom")   label = `zoom ${json.dir}`;

      // Fire the action FIRST before any state updates (zero extra delay)
      dispatch(json, actionsRef.current);
      // Then update UI
      setLastCommand(label);
      setLastStatus("ok");
      setLog(prev => [label, ...prev].slice(0, 5));
      setStatus("idle");

    } catch (err) {
      console.error("Groq error:", err);
      setLastCommand(`❌ ${err.message.slice(0, 60)}`);
      setLastStatus("miss");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, []);

  // ── Setup Web Speech for transcription ──────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setNoSpeechSupport(true); return; }

    const recog = new SR();
    recog.lang            = "en-US";
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.maxAlternatives = 2;

    recog.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
        else interimText = event.results[i][0].transcript;
      }
      if (interimText) setLastHeard(interimText);
      if (finalText.trim()) {
        // Stop recognition immediately so browser doesn't keep buffering
        activeRef.current = false;
        try { recog.abort(); } catch(_) {}  // abort is faster than stop
        // Process right away — no setTimeout, no delay
        processTranscript(finalText.trim());
      }
    };

    recog.onerror = (e) => {
      if (e.error === "no-speech") { setStatus("idle"); return; }
      if (e.error === "not-allowed") {
        setLastCommand("❌ Mic permission denied");
        setLastStatus("miss");
      }
      setStatus("idle");
      activeRef.current = false;
    };

    recog.onend = () => { activeRef.current = false; };

    recogRef.current = recog;
    return () => { try { recog.abort(); } catch(_) {} };
  }, [processTranscript]);

  // ── Start (click mic) ────────────────────────────────────────
  const startRecording = useCallback(() => {
    const recog = recogRef.current;
    if (!recog || activeRef.current) return;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_key_here") {
      setApiKeyMissing(true); setStatus("error"); return;
    }

    activeRef.current = true;
    setStatus("recording");
    setLastStatus("");
    setLastHeard("🎤 listening…");
    try { recog.start(); } catch(_) { setStatus("idle"); activeRef.current = false; }
  }, []);

  const stopRecording = useCallback(() => {
    activeRef.current = false;
  }, []);

  return { status, startRecording, stopRecording,
           lastHeard, lastCommand, lastStatus, log,
           apiKeyMissing, noSpeechSupport };
};
