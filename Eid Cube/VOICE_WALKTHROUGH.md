# 🎙️ Voice Control — Complete Implementation Walkthrough

This document explains the entire voice system used in the Eid Mubarak 3D Box project — what API is used, why it was chosen, how it works step by step, and how all the pieces connect.

---

## The Short Answer

**API used:** Web Speech API (built into Chrome and Edge — zero external calls)  
**Approach:** Local regex NLP with fuzzy corrections and interim matching  
**Latency:** Near-zero — commands fire as you speak, no network round-trip  
**File:** `src/useVoice.js` — the entire voice engine lives here

---

## Why We Ended Up Here — The History

### Version 1: Gemini API
The first voice implementation sent transcripts to Google's Gemini API for intent parsing. It was removed because every command required a network round-trip, creating a consistent 1–2 second delay between speaking and seeing any result. API quota limits also caused random failures.

### Version 2: Groq API (llama-3.1-8b-instant)
Groq was tried as a faster alternative. It was marginally quicker than Gemini but still had 800ms–1.5s of network delay. Attempts to build a hybrid (instant map + Groq fallback) reduced delay for simple commands but still made color and text commands feel sluggish.

### Version 3 (Final): Web Speech API + Local Regex NLP
The insight: this project has roughly 30 known commands. A local regex pattern table handles all of them perfectly — faster than any API, works offline, never fails. Groq and Gemini were removed entirely. The result is a voice system that fires commands the instant you say the keyword.

---

## Architecture Overview

```
src/useVoice.js
│
├── COLOR_MAP + COLOR_PHRASES      — 60+ color name → hex mappings
├── resolveColor()                 — translates "dark red" → "#8b0000"
├── FUZZY_MAP                      — corrects common speech-to-text mishears
├── applyFuzzy()                   — applies all fuzzy corrections to transcript
├── normalise()                    — lowercases, strips punctuation + filler words
├── COMMANDS[]                     — table of {label, instant, pat, fn} objects
├── tryMatch()                     — runs transcript through every command pattern
├── fire()                         — executes a matched command with debounce
└── useVoice() hook                — SpeechRecognition setup, exported to App.jsx
```

```
src/App.jsx
│
├── voiceActions{}                 — maps voice intents → React setters + Three.js refs
├── callback refs (openBoxRef etc) — bridge between React state and Three.js scope
└── useVoice(voiceActions)         — single hook call wires everything together
```

---

## Part 1 — useVoice.js, Section by Section

### 1A. Color Resolution

The user says color names, not hex codes. The resolver handles both single words and phrases:

```js
const COLOR_MAP = {
  red: "#e74c3c",  gold: "#f1c40f",  blue: "#2980b9",
  navy: "#1a2a6c", teal: "#1abc9c",  coral: "#ff6b6b",
  // ...60+ entries
};

const COLOR_PHRASES = {
  "dark red":    "#8b0000",
  "sky blue":    "#87ceeb",
  "rose gold":   "#b76e79",
  "mint green":  "#98ff98",
  "royal blue":  "#4169e1",
  "deep purple": "#4a148c",
  // ...
};

const resolveColor = (raw) => {
  const s = raw.trim().toLowerCase().replace(/[^a-z ]/g,"").replace(/\s+/g," ");
  if (COLOR_PHRASES[s]) return COLOR_PHRASES[s];       // multi-word first
  const single = s.replace(/\s/g,"");
  if (COLOR_MAP[single]) return COLOR_MAP[single];     // exact single word
  for (const [k,v] of Object.entries(COLOR_MAP)) {
    if (single.includes(k) || s.includes(k)) return v; // partial match
  }
  return null; // unknown color — do nothing
};
```

Multi-word phrases are checked before single words so `"dark red"` matches correctly rather than matching `"red"` first.

---

### 1B. Fuzzy Corrections

The Web Speech API mishears certain words in consistent, predictable ways. These are corrected before any matching:

```js
const FUZZY_MAP = [
  // Lid is commonly misheard
  [/\blight colou?r\b/g,  "lid color"],
  [/\blead colou?r\b/g,   "lid color"],
  [/\blip colou?r\b/g,    "lid color"],

  // Physics commands
  [/\bvortices\b/g,       "vertices"],   // most common mishear of "vertices"
  [/\bvertice\b/g,        "vertices"],
  [/\bvertexes\b/g,       "vertices"],

  // Colors
  [/\bgoal\b/g,           "gold"],
  [/\bgulf\b/g,           "gold"],
  [/\bread\b/g,           "red"],        // "read" said aloud → "red"
  [/\bblew\b/g,           "blue"],
  [/\bblur\b/g,           "blue"],

  // Box open/close
  [/\bclothes\b/g,        "close"],
  [/\bopen book\b/g,      "open box"],
  [/\bclose book\b/g,     "close box"],

  // Confetti (gets mangled constantly)
  [/\bspaghetti\b/g,      "confetti"],
  [/\bconfidence\b/g,     "confetti"],

  // Presets
  [/\bmid night\b/g,      "midnight"],
  [/\bforrest\b/g,        "forest"],
];
```

Applied via:

```js
const applyFuzzy = (s) => {
  let r = s;
  for (const [pattern, replacement] of FUZZY_MAP) r = r.replace(pattern, replacement);
  return r;
};
```

---

### 1C. Normaliser

Strips filler words so natural conversational speech still matches commands:

```js
const FILLER_RE = /^(please|can you|could you|would you|hey|okay|ok|um+|uh+|so|just|now)\s+/i;

const normalise = (raw) => {
  let s = raw.toLowerCase()
    .replace(/[.,!?;:']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 3; i++) s = s.replace(FILLER_RE, "").trim();
  return applyFuzzy(s);
};
```

The loop runs 3 times to strip chained fillers like `"hey can you please open the box"` → `"open the box"`.

---

### 1D. COMMANDS Table

Every voice command is defined as an object in this array:

```js
const COMMANDS = [
  {
    label:   "Open box",
    instant: true,        // fire on INTERIM (partial) speech — near-zero latency
    pat:     /\b(open|unwrap|open box|open gift|open up)\b/,
    fn:      (_, a) => a.openBox()
  },
  {
    label:   "Box color",
    instant: false,       // wait for FINAL result — need full sentence for color name
    pat:     /\bbox\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:      (m, a) => { const h = resolveColor(m[1]); if (h) a.setBox(h); }
  },
  // ...
];
```

**`instant: true`** — matched against partial (interim) speech as you're still talking. Used for single-keyword commands: open, close, stop, spin, gravity, vertices, split, etc. These feel immediate.

**`instant: false`** — matched only against the final transcript. Used for commands that need the complete sentence: color changes, `set text to ...`. This prevents partial matches triggering the wrong color.

**Pattern ordering matters.** More specific patterns come first. `"text color"` appears before `"text"` so `"text color red"` matches the right command.

**Full command table:**

```js
// BOX
open / unwrap / reveal                → openBox()
close / shut / seal                   → closeBox()
toggle                                → toggleBox()

// CAMERA
rotate left / turn left / go left    → rotateCam("left")
rotate right / turn right            → rotateCam("right")
rotate up / tilt up                  → rotateCam("up")
rotate down / tilt down              → rotateCam("down")
stop / halt / freeze / pause         → stopCam()
reset / front view / reset view      → resetCam()
spin / auto spin / spinning          → autoSpin()
zoom in / closer / move closer       → zoomIn()
zoom out / move back / farther       → zoomOut()

// PRESETS
classic / ocean / forest / midnight  → applyPreset(name)

// CONFETTI
confetti / celebrate / party         → fireConfetti()

// PHYSICS (new)
gravity / drop it / let it fall      → toggleGravity()
vertices / edges / wireframe         → toggleVertices()
split / explode / burst / blow up    → splitBox()
unsplit / reassemble / put back      → unsplitBox()

// COLORS (all instant:false, need full sentence)
box [color] <colorname>              → setBox(hex)
lid [color] <colorname>              → setLid(hex)
ribbon [color] <colorname>           → setRibbon(hex)
button [color] <colorname>           → setBtn(hex)
border [color] <colorname>           → setBorder(hex)
text color <colorname>               → setTxtColor(hex)

// TEXT
set text to / change text to ...     → setMsg(text)

// HELP
help / commands / voice commands     → showHelp()
```

---

### 1E. Match Engine

```js
const tryMatch = (transcript, instantOnly) => {
  const norm = normalise(transcript);
  for (const cmd of COMMANDS) {
    if (instantOnly && !cmd.instant) continue;  // skip non-instant when in interim mode
    const m = norm.match(cmd.pat);
    if (m) return { cmd, m, norm };
  }
  return null;
};
```

Returns the first matching command object plus the regex match array (which contains captured groups for color names and text values).

---

### 1F. Result Handler — Interim + Final

```js
recog.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const res = event.results[i];

    // Collect all 3 alternative transcripts (maxAlternatives = 3)
    const alts = [];
    for (let a = 0; a < res.length; a++) alts.push(res[a].transcript);
    const primary = alts[0];

    setLastTranscript(primary.trim());

    if (res.isFinal) {
      // FINAL: try all commands on all 3 alternatives
      interimKeysRef.current.clear();
      let found = null;
      for (const t of alts) { found = tryMatch(t, false); if (found) break; }
      if (found) fire(found);
      else setLastStatus("miss");

    } else {
      // INTERIM: instant-only commands, deduplicated by key
      const key = normalise(primary).slice(0, 25);
      if (interimKeysRef.current.has(key)) continue;
      let found = null;
      for (const t of alts) { found = tryMatch(t, true); if (found) break; }
      if (found) { interimKeysRef.current.add(key); fire(found); }
    }
  }
};
```

Key design decisions:
- `event.resultIndex` — only NEW results processed, never old ones from the buffer. This was the root cause of commands replaying in earlier versions.
- `interimKeysRef` — deduplicates interim triggers. As you say "open the box", interim fires multiple times as the transcript grows. The key (first 25 chars) prevents re-firing.
- `maxAlternatives = 3` — if the primary transcript misses, the second or third interpretation of the audio may catch it.

---

### 1G. Debounce

Prevents the same command firing twice if speech recognition emits it across both interim and final:

```js
const fire = ({ cmd, m }) => {
  const now = Date.now();
  if (debounceRef.current.label === cmd.label &&
      now - debounceRef.current.time < 1200) return;
  debounceRef.current = { label: cmd.label, time: now };
  cmd.fn(m, actionsRef.current);
  setLastCommand(cmd.label);
  setLastStatus("ok");
  setLog(prev => [cmd.label, ...prev].slice(0, 5));
};
```

---

### 1H. Continuous Mic with Auto-Restart

```js
recog.continuous     = true;   // stays on after each command
recog.interimResults = true;   // fire while still speaking
recog.lang           = "en-US";

recog.onend = () => {
  // Chrome sometimes kills continuous sessions after silence
  if (listeningRef.current)
    setTimeout(() => { if (listeningRef.current) try { recog.start(); } catch(_) {} }, 100);
};
```

The mic stays active indefinitely once started. You say command after command without tapping anything. Tap the mic button only to stop.

---

### 1I. The actionsRef Pattern (Avoiding Stale Closures)

```js
const actionsRef = useRef(actions);
useEffect(() => { actionsRef.current = actions; }); // runs after every render
```

The `onresult` callback is created once on mount. If `actions` were used directly, it would close over the initial render's state setters and never see updated state. Storing `actions` in a ref that's updated every render ensures the callback always calls the latest version of each setter.

---

## Part 2 — App.jsx Integration

### Step 1: Define voiceActions

```js
const voiceActions = {
  openBox:        () => openBoxRef.current?.(),
  closeBox:       () => closeBoxRef.current?.(),
  toggleBox:      () => toggleBoxRef.current?.(),
  rotateCam:      (dir) => rotateCamRef.current?.(dir),
  stopCam:        () => stopCamRef.current?.(),
  resetCam:       () => resetCamRef.current?.(),
  autoSpin:       () => autoSpinRef.current?.(),
  zoomIn:         () => zoomInRef.current?.(),
  zoomOut:        () => zoomOutRef.current?.(),
  setMsg:         (t) => setMsgText(t),
  setBox:         (h) => setBoxColor(h),
  setLid:         (h) => setLidColor(h),
  setRibbon:      (h) => setRibbonColor(h),
  setBtn:         (h) => setBtnColor(h),
  setTxtColor:    (h) => setTextColor(h),
  setBorder:      (h) => setLidBorderColor(h),
  applyPreset:    (n) => applyPreset(n),
  fireConfetti:   () => fireConfRef.current?.(),
  showHelp:       () => setShowVoiceHelp(v => !v),
  toggleGravity:  () => toggleGravityRef.current?.(),
  toggleVertices: () => toggleVerticesRef.current?.(),
  splitBox:       () => toggleSplitRef.current?.(true),
  unsplitBox:     () => toggleSplitRef.current?.(false),
};
```

### Step 2: Call the hook

```js
const {
  listening, toggle: toggleVoice,
  lastTranscript: lastHeard, lastCommand, lastStatus, log: voiceLog, supported,
} = useVoice(voiceActions);
```

### Step 3: Callback Refs in useEffect

Inside the Three.js `useEffect`, every action is assigned to a ref:

```js
openBoxRef.current   = doOpen;
closeBoxRef.current  = doClose;
toggleBoxRef.current = doToggle;
rotateCamRef.current = (dir) => { voiceRotDir = dir; };
stopCamRef.current   = () => { voiceRotDir = null; voiceSpinning = false; };
toggleGravityRef.current  = () => { gravityActive = !gravityActive; ... };
toggleVerticesRef.current = () => { verticesActive = !verticesActive; vtxMeshes.forEach(...); };
toggleSplitRef.current    = (wantSplit) => { splitActive = wantSplit; splitAnimDir = ...; };
```

### Step 4: Camera Rotation in Animate Loop

Camera rotation runs every frame while a direction is active — this gives smooth continuous rotation rather than a single jump:

```js
if (voiceRotDir === "left")  { sph.theta -= 0.025; applyCamera(); }
if (voiceRotDir === "right") { sph.theta += 0.025; applyCamera(); }
if (voiceRotDir === "up")    { sph.phi = Math.max(0.15, sph.phi - 0.018); applyCamera(); }
if (voiceRotDir === "down")  { sph.phi = Math.min(Math.PI*0.48, sph.phi + 0.018); applyCamera(); }
if (voiceSpinning)           { sph.theta += 0.012; applyCamera(); }
```

---

## Part 3 — Physics Features Implementation

### Gravity (in animate loop)

```js
if (gravityActive) {
  if (!onGround) {
    gravVel -= 0.018;                          // accelerate downward
    gG.position.y += gravVel;
    if (gG.position.y <= 0) {
      gG.position.y = 0;
      gravVel = Math.abs(gravVel) * 0.42;      // bounce — 42% energy retained
      if (gravVel < 0.02) {
        gravVel = 0; onGround = true;
        gG.scale.set(1.12, 0.82, 1.12);        // squash on hard landing
      }
    }
  }
  // Recover squash smoothly every frame
  gG.scale.x += (1 - gG.scale.x) * 0.12;
  gG.scale.y += (1 - gG.scale.y) * 0.12;
  gG.scale.z += (1 - gG.scale.z) * 0.12;
}
```

### Vertices (setup at scene init)

```js
// 8 corner dots
CORNERS.forEach(([x,y,z]) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );
  dot.position.set(x, y, z);
  dot.visible = false;
  gG.add(dot); vtxMeshes.push(dot);
});

// 12 edge tubes — LineSegments not used because WebGL ignores linewidth
EDGES.forEach(([a, b]) => {
  const pA = new THREE.Vector3(...CORNERS[a]);
  const pB = new THREE.Vector3(...CORNERS[b]);
  const len = pA.distanceTo(pB);
  const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, len, 6),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );
  tube.position.copy(mid);
  tube.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3().subVectors(pB, pA).normalize()
  );
  tube.visible = false;
  gG.add(tube); vtxMeshes.push(tube);
});
```

### Split (in animate loop)

```js
if (splitAnimDir !== 0) {
  splitProg = Math.max(0, Math.min(1, splitProg + splitAnimDir * 0.03));
  const ease = 1 - Math.pow(1 - splitProg, 3);   // easeOutCubic
  splitFaces.forEach(mesh => {
    const d = mesh.userData.splitDir;
    const o = mesh.userData.origPos;
    mesh.position.set(
      o.x + d.x * ease * SPLIT_DIST,
      o.y + d.y * ease * SPLIT_DIST,
      o.z + d.z * ease * SPLIT_DIST
    );
  });
  if (splitProg >= 1 || splitProg <= 0) splitAnimDir = 0;
}
```

Each face's `splitDir` is the outward horizontal normal from the box center. The bottom face goes down. All faces travel `SPLIT_DIST = 3.0` units at their peak.

---

## Part 4 — Complete Data Flow

```
User says: "lid gold"
        │
        ▼
SpeechRecognition.onresult fires (interim or final)
        │
        ▼
alts[0] = "lid gold"
        │
        ▼
normalise("lid gold"):
  lowercase → "lid gold"
  no fillers to strip
  applyFuzzy → "lid gold" (no change)
  result: "lid gold"
        │
        ▼
tryMatch("lid gold", false):
  test COMMANDS in order...
  matches: /\blid\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/
  m[1] = "gold"
        │
        ▼
fn(m, actions):
  resolveColor("gold") → "#f1c40f"
  actions.setLid("#f1c40f")
        │
        ▼
setLidColor("#f1c40f")   ← React state setter
        │
        ▼
useEffect: R.lidColor.current = "#f1c40f"
           rebuildColors.current()
        │
        ▼
matLid.color.set("#f1c40f")   ← Three.js material update
        │
        ▼
Lid turns gold in 3D scene ✅
```

---

## Part 5 — Browser Compatibility

| Browser | Voice Works? | Notes |
|---------|-------------|-------|
| Chrome | ✅ Yes | Best support, recommended |
| Edge | ✅ Yes | Full support |
| Firefox | ❌ No | No Web Speech API |
| Safari | ⚠️ Partial | Requires HTTPS |

For production: deploy to **Vercel** or **Netlify** — both provide HTTPS automatically and free.

---

## Quick Test Checklist

Run `npm run dev`, open in **Chrome**, click 🎤, then test:

- [ ] "open the box" → lid flies open
- [ ] "close the box" → lid closes
- [ ] "rotate left" → camera rotates continuously left
- [ ] "stop" → camera stops
- [ ] "zoom in" → view moves closer
- [ ] "reset view" → back to front view
- [ ] "spin" → auto-rotation starts
- [ ] "box color blue" → box turns blue
- [ ] "lid gold" → lid turns gold
- [ ] "apply midnight preset" → full dark theme
- [ ] "set text to Happy Eid" → floating text changes
- [ ] "confetti" → particles burst
- [ ] "gravity" → box drops and bounces
- [ ] "vertices" → cyan edge wireframe appears
- [ ] "split" → box faces explode outward
- [ ] "unsplit" → box reassembles