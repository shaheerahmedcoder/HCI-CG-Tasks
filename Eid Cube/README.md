# 🎁 Eid Mubarak – Three.js Interactive Gift Box

A 3D interactive Eid Mubarak scene built with **React 18** + **Three.js** + **Vite**.  
Voice-controlled using the **Web Speech API** with instant local NLP — no external AI API needed.

---

## 📸 What You See

- A 3D UBIT-style university building in the background
- Green grass field, road, and trees in the foreground
- A red gift box sitting on a path
- Click the golden button (or say **"open"**) → lid flies open → confetti bursts → golden "Eid Mubarak!" text rises
- Full voice control: colors, camera, physics, presets — all hands-free
- Physics toolbar (bottom-right): Gravity, Vertices, Split

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Open in browser
# http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 File Structure

```
eid-mubarak-cube/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite bundler config
├── eslint.config.js        # Linting rules
└── src/
    ├── main.jsx            # React app bootstrap
    ├── index.css           # Global reset styles
    ├── App.css             # (empty placeholder)
    ├── App.jsx             # ⭐ Main file — Three.js scene + React UI + physics
    └── useVoice.js         # ⭐ Voice engine — Web Speech API + local NLP
```

---

## 🎙️ Voice Control — How It Works

### API Used: Web Speech API (Browser-Native, Zero Network Delay)

This project uses the **browser's built-in Web Speech API** — specifically `SpeechRecognition` / `webkitSpeechRecognition`. There is **no external AI API** for voice. No Groq, no Gemini, no OpenAI. Everything is processed locally inside the browser.

```
You speak
   ↓
Browser microphone captures audio
   ↓
Web Speech API (built into Chrome/Edge) converts speech to text
   ↓
useVoice.js receives the transcript (interim + final results)
   ↓
Fuzzy corrections fix common mishears ("vortices" → "vertices", "goal" → "gold")
   ↓
Normaliser strips filler words ("hey can you please open" → "open")
   ↓
COMMANDS table tested — 30+ regex patterns matched
   ↓
Matching command fires instantly (no API call, zero network delay)
   ↓
Three.js 3D scene updates live ✅
```

### Why Not Gemini or Groq?

Earlier versions of this project used both Gemini API and Groq API (llama-3.1-8b-instant). Both were removed:

- **Network latency** — every command had a 1–2 second wait for the API response
- **Reliability** — network failures, API quota limits, and key management were constant problems
- **Unnecessary complexity** — 30 known commands are perfectly handled by local regex patterns, no LLM required

The local NLP approach is faster, works offline, and never fails due to network issues.

---

## 🗣️ All Voice Commands

### Box Control
| Say | Action |
|-----|--------|
| open / open the box / unwrap / reveal | Open lid |
| close / shut / close the box / seal it | Close lid |
| toggle | Toggle open/close |

### Camera
| Say | Action |
|-----|--------|
| rotate left / turn left / go left | Rotate left (continuous) |
| rotate right / turn right / go right | Rotate right |
| rotate up / tilt up | Tilt up |
| rotate down / tilt down | Tilt down |
| stop / halt / freeze / pause | Stop camera movement |
| spin / auto spin / keep rotating | Continuous auto-rotation |
| reset / reset view / front view | Default view |
| zoom in / closer / come closer | Move camera closer |
| zoom out / move back / farther | Move camera further |

### Colors
| Say | Action |
|-----|--------|
| box red / box color blue | Change box body color |
| lid gold / lid color green | Change lid color |
| ribbon purple | Change ribbon color |
| button silver | Change button color |
| border dark red | Change lid border |
| text color white | Change floating text color |

Supported colors: red, crimson, scarlet, maroon, pink, hot pink, orange, amber, gold, yellow, lime, green, teal, cyan, sky blue, blue, navy, cobalt, purple, violet, magenta, white, black, grey, silver, brown, coral, peach, lavender, indigo, dark red, dark blue, dark green, rose gold, mint green, deep purple, royal blue, and more.

### Presets
| Say | Theme Applied |
|-----|--------------|
| classic | Red box, dark red lid, gold ribbon |
| ocean | Blue box, pink lid, orange ribbon |
| forest | Green box, purple lid, orange ribbon |
| midnight | Dark navy box, purple lid, gold ribbon |

### Physics Features
| Say | Action |
|-----|--------|
| gravity / drop it / let it fall | Toggle gravity — box drops and bounces |
| vertices / edges / wireframe / show edges / corners | Toggle cyan edge wireframe |
| split / explode / burst / blow up | Explode box faces outward |
| unsplit / reassemble / put back / put it back | Reassemble the box |

### Other
| Say | Action |
|-----|--------|
| confetti / celebrate / party | Launch confetti particles |
| set text to Happy Eid | Change the floating message |
| help / commands | Toggle voice help |

---

## 🧩 Physics Features

### 🌍 Gravity
Toggle gravity on the entire gift box group:
- Box drops from Y=5 and accelerates downward each frame
- On hitting the ground: velocity reflects at 42% energy (realistic bounce)
- Squash on impact: `scale(1.12, 0.82, 1.12)` then smoothly recovers to normal
- Toggle off: returns to gentle floating animation

### 📐 Vertices / Edges
Shows the wireframe structure of the box body:
- 8 **cyan sphere dots** at each corner
- 12 **cyan cylinder tubes** along every edge
- Tubes oriented using `quaternion.setFromUnitVectors` (standard WebGL linewidth is always 1px so `LineSegments` was replaced with proper cylinder geometry)

### 🧩 Split / Unsplit
Explodes the box faces outward from center:
- Each wall gets an outward `splitDir` vector (horizontal normal from center)
- Faces travel `SPLIT_DIST = 3.0` units away with `easeOutCubic` easing
- When split: lid opens and confetti fires automatically
- When unsplit: faces return to original positions, lid closes

---

## 🔗 React ↔ Three.js Bridge

Three.js runs inside a `useEffect` (a closed scope). React state setters live outside. The project uses **callback refs** to bridge them cleanly:

```js
// Declared in React scope
const openBoxRef     = useRef(null);
const toggleGravityRef = useRef(null);

// Assigned inside useEffect / Three.js scope
openBoxRef.current     = () => { boxOpenState = true; animDir = 1; };
toggleGravityRef.current = () => { gravityActive = !gravityActive; };

// Called from voice actions (works from anywhere)
voiceActions = {
  openBox:       () => openBoxRef.current?.(),
  toggleGravity: () => toggleGravityRef.current?.(),
};
```

Voice commands, UI buttons, and mouse clicks all call the same voiceActions object — one source of truth for every interaction.

---

## 🎨 Technologies Used

| Technology | Purpose |
|-----------|---------|
| React 18 | Component structure, state management |
| Three.js | 3D rendering engine (WebGL wrapper) |
| Vite | Dev server and bundler |
| Web Speech API | Browser-native voice recognition (no external API) |
| HTML Canvas API | Rendering the floating text as a texture |
| WebGL (via Three.js) | GPU-accelerated 3D in the browser |

---

## 🌐 Browser Compatibility

| Browser | Voice Works? | Notes |
|---------|-------------|-------|
| Chrome | ✅ Yes | Best support — recommended |
| Edge | ✅ Yes | Full support |
| Firefox | ❌ No | No Web Speech API |
| Safari | ⚠️ Partial | Requires HTTPS |

---

## 🌙 About

Created as a **Computer Graphics / HCI course project** at UBIT, University of Karachi.

**Eid Mubarak to everyone! عيد مبارك** 🌙