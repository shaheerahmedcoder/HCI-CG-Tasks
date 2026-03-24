// ═══════════════════════════════════════════════════════════════════
//  useVoice.js  v3 — INSTANT + FUZZY voice engine
//
//  What changed from v1:
//  1. INTERIM matching — fires commands the moment keywords are heard
//     (no waiting for sentence to end = near-zero latency)
//  2. FUZZY corrections — maps common mishears to correct words
//     "light color" → "lid color",  "close books" → "close box", etc.
//  3. maxAlternatives = 3 — tries backup transcripts if primary fails
//  4. Debounce — same command won't double-fire within 1.2s
//  5. Per-session interim dedup — won't re-fire if interim grows
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react";

// ── COLOR MAP ────────────────────────────────────────────────────
const COLOR_MAP = {
  red:"#e74c3c", crimson:"#dc143c", scarlet:"#c0392b", maroon:"#7b1a1a",
  pink:"#f07090", hotpink:"#ff69b4", orange:"#e67e22", amber:"#f39c12",
  gold:"#f1c40f", golden:"#f1c40f", yellow:"#f9e400", lime:"#2ecc71",
  green:"#27ae60", forest:"#1e8449", olive:"#808000", teal:"#1abc9c",
  cyan:"#00bcd4", skyblue:"#87ceeb", blue:"#2980b9", navy:"#1a2a6c",
  cobalt:"#0047ab", purple:"#8e44ad", violet:"#9b59b6", magenta:"#e91e63",
  white:"#ffffff", black:"#111111", grey:"#7f8c8d", gray:"#7f8c8d",
  silver:"#bdc3c7", brown:"#795548", chocolate:"#7b3f00", beige:"#f5f0e8",
  ivory:"#fffff0", coral:"#ff6b6b", peach:"#ffbe76", lavender:"#d7aefb",
  indigo:"#3949ab", tan:"#d2b48c", cream:"#fffdd0",
};

const COLOR_PHRASES = {
  "dark red":"#8b0000","dark blue":"#1a237e","dark green":"#1b5e20",
  "light blue":"#87ceeb","sky blue":"#87ceeb","hot pink":"#ff69b4",
  "rose gold":"#b76e79","mint green":"#98ff98","bright red":"#ff1a1a",
  "bright blue":"#1565c0","deep purple":"#4a148c","royal blue":"#4169e1",
  "forest green":"#228b22","golden yellow":"#ffc200","light green":"#90ee90",
  "dark purple":"#4a148c","neon green":"#39ff14","neon blue":"#1f51ff",
};

const resolveColor = (raw) => {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/[^a-z ]/g,"").replace(/\s+/g," ");
  if (COLOR_PHRASES[s]) return COLOR_PHRASES[s];
  const single = s.replace(/\s/g,"");
  if (COLOR_MAP[single]) return COLOR_MAP[single];
  // partial / contains match
  for (const [k,v] of Object.entries(COLOR_MAP)) {
    if (single.includes(k) || s.includes(k)) return v;
  }
  return null;
};

// ── FUZZY CORRECTIONS ────────────────────────────────────────────
// Maps what speech-to-text commonly says → what we actually want.
// Applied BEFORE pattern matching.
const FUZZY_MAP = [
  // lid (most common mishear)
  [/\blight colou?r\b/g,  "lid color"],
  [/\blid colou?r\b/g,    "lid color"],
  [/\blead colou?r\b/g,   "lid color"],
  [/\blip colou?r\b/g,    "lid color"],
  [/\blit colou?r\b/g,    "lid color"],
  [/\blipped\b/g,         "lid"],
  // open / close
  [/\bclothes\b/g,        "close"],
  [/\bclose book\b/g,     "close box"],
  [/\bcloves\b/g,         "close"],
  [/\bopan\b/g,           "open"],
  [/\bopen book\b/g,      "open box"],
  // colors
  [/\bgoal\b/g,           "gold"],
  [/\bgulf\b/g,           "gold"],
  [/\bread\b/g,           "red"],   // "read" → "red"
  [/\bblew\b/g,           "blue"],
  [/\bblur\b/g,           "blue"],
  [/\bgreen bean\b/g,     "green"],
  // camera
  [/\breset (few|you|view)\b/g, "reset view"],
  [/\bzoom+ in+\b/g,      "zoom in"],
  [/\bzoom+ out+\b/g,     "zoom out"],
  [/\bzum in\b/g,         "zoom in"],
  // confetti (gets mangled a lot)
  [/\bspaghetti\b/g,      "confetti"],
  [/\bconfidence\b/g,     "confetti"],
  [/\bcountry\b/g,        "confetti"],
  [/\bcontent\b/g,        "confetti"],
  // physics
  [/\bvortices\b/g,       "vertices"],
  [/\bvertice\b/g,        "vertices"],
  [/\bvertexes\b/g,       "vertices"],
  // presets
  [/\bmid night\b/g,      "midnight"],
  [/\bforrest\b/g,        "forest"],
  // rotate
  [/\brotated?\b/g,       "rotate"],
  // ribbon
  [/\bribband\b/g,        "ribbon"],
];

const applyFuzzy = (s) => {
  let r = s;
  for (const [pattern, replacement] of FUZZY_MAP) r = r.replace(pattern, replacement);
  return r;
};

// ── NORMALISE ────────────────────────────────────────────────────
const FILLER_RE = /^(please|can you|could you|would you|hey|okay|ok|um+|uh+|so|just|now)\s+/i;
const normalise = (raw) => {
  let s = raw.toLowerCase()
    .replace(/[.,!?;:']/g," ")
    .replace(/\s+/g," ")
    .trim();
  for (let i=0; i<3; i++) s = s.replace(FILLER_RE,"").trim();
  return applyFuzzy(s);
};

// ── COMMAND TABLE ────────────────────────────────────────────────
// instant:true  → matched on INTERIM (partial) speech — near-zero latency
// instant:false → only matched on FINAL result (use for commands
//                 that need a full sentence, e.g. "set text to ...")
const COMMANDS = [
  // BOX
  { label:"Open box",     instant:true,
    pat:/\b(open|unwrap|open box|open gift|open up)\b/,
    fn:(_,a)=>a.openBox() },
  { label:"Close box",    instant:true,
    pat:/\b(close|shut|close box|close gift|closed)\b/,
    fn:(_,a)=>a.closeBox() },
  { label:"Toggle box",   instant:true,
    pat:/\btoggle\b/,
    fn:(_,a)=>a.toggleBox() },

  // CAMERA — instant single keyword
  { label:"Rotate left",  instant:true,
    pat:/\brotate\s*left\b|\bleft\s*rotate\b/,
    fn:(_,a)=>a.rotateCam("left") },
  { label:"Rotate right", instant:true,
    pat:/\brotate\s*right\b|\bright\s*rotate\b/,
    fn:(_,a)=>a.rotateCam("right") },
  { label:"Rotate up",    instant:true,
    pat:/\brotate\s*up\b/,
    fn:(_,a)=>a.rotateCam("up") },
  { label:"Rotate down",  instant:true,
    pat:/\brotate\s*down\b/,
    fn:(_,a)=>a.rotateCam("down") },
  { label:"Stop",         instant:true,
    pat:/\b(stop|pause|halt)\b/,
    fn:(_,a)=>a.stopCam() },
  { label:"Reset view",   instant:true,
    pat:/\b(reset|reset view|front view|default view|face front)\b/,
    fn:(_,a)=>a.resetCam() },
  { label:"Spin",         instant:true,
    pat:/\b(spin|auto spin|auto rotate|spinning)\b/,
    fn:(_,a)=>a.autoSpin() },
  { label:"Zoom in",      instant:true,
    pat:/\bzoom\s*in\b|\bcloser\b|\bmove closer\b/,
    fn:(_,a)=>a.zoomIn() },
  { label:"Zoom out",     instant:true,
    pat:/\bzoom\s*out\b|\bmove back\b|\bfarther\b/,
    fn:(_,a)=>a.zoomOut() },

  // PRESETS — instant single word
  { label:"Classic preset",  instant:true, pat:/\bclassic\b/, fn:(_,a)=>a.applyPreset("classic") },
  { label:"Ocean preset",    instant:true, pat:/\bocean\b/,   fn:(_,a)=>a.applyPreset("ocean") },
  { label:"Forest preset",   instant:true, pat:/\bforest\b/,  fn:(_,a)=>a.applyPreset("forest") },
  { label:"Midnight preset", instant:true, pat:/\bmidnight\b/,fn:(_,a)=>a.applyPreset("midnight") },

  // CONFETTI
  { label:"Confetti!",    instant:true,
    pat:/\b(confetti|celebrate|celebration|party)\b/,
    fn:(_,a)=>a.fireConfetti() },

  // SET TEXT — needs full sentence → NOT instant
  { label:"Set text",     instant:false,
    pat:/\b(?:set\s+(?:text|message)|change\s+(?:text|message)|text\s+say)\s+(?:to\s+)?(.+)/,
    fn:(m,a)=>a.setMsg(m[1].trim()) },

  // COLORS — NOT instant (need to hear the color word too)
  // text color BEFORE box/lid to avoid "text" matching "box"
  { label:"Text color",   instant:false,
    pat:/\btext\s+colou?r\s*(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setTxtColor(h); } },
  { label:"Box color",    instant:false,
    pat:/\bbox\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setBox(h); } },
  { label:"Lid color",    instant:false,
    pat:/\blid\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setLid(h); } },
  { label:"Ribbon color", instant:false,
    pat:/\bribbon\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setRibbon(h); } },
  { label:"Button color", instant:false,
    pat:/\bbutton\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setBtn(h); } },
  { label:"Border color", instant:false,
    pat:/\bborder\s+(?:colou?r\s*)?(?:to\s+)?(\w[\w ]*)/,
    fn:(m,a)=>{ const h=resolveColor(m[1]); if(h)a.setBorder(h); } },

  // GRAVITY
  { label:"Gravity",      instant:true,
    pat:/\b(gravity|drop it|let it fall|drop|apply gravity)\b/,
    fn:(_,a)=>a.toggleGravity?.() },

  // VERTICES
  { label:"Vertices",     instant:true,
    pat:/\b(vertices|vertex|vertexes|vertice|vortices|edges|wireframe|show edges|show corners|show vertices)\b/,
    fn:(_,a)=>a.toggleVertices?.() },

  // SPLIT / UNSPLIT
  { label:"Split",        instant:true,
    pat:/\b(split|explode|burst|blow up|split the box|split box)\b/,
    fn:(_,a)=>a.splitBox?.() },
  { label:"Unsplit",      instant:true,
    pat:/\b(unsplit|reassemble|put back|put it back|close split|rejoin)\b/,
    fn:(_,a)=>a.unsplitBox?.() },

  // HELP
  { label:"Show help",    instant:true,
    pat:/\b(help|commands|voice commands)\b/,
    fn:(_,a)=>a.showHelp() },
];

// ── MATCH ENGINE ─────────────────────────────────────────────────
const tryMatch = (transcript, instantOnly) => {
  const norm = normalise(transcript);
  for (const cmd of COMMANDS) {
    if (instantOnly && !cmd.instant) continue;
    const m = norm.match(cmd.pat);
    if (m) return { cmd, m, norm };
  }
  return null;
};

// ── THE HOOK ─────────────────────────────────────────────────────
export const useVoice = (actions) => {
  const [listening,      setListening]      = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastCommand,    setLastCommand]    = useState("");
  const [lastStatus,     setLastStatus]     = useState(""); // "ok"|"miss"|""
  const [log,            setLog]            = useState([]);
  const [supported,      setSupported]      = useState(true);

  const recogRef       = useRef(null);
  const actionsRef     = useRef(actions);
  const listeningRef   = useRef(false);
  const debounceRef    = useRef({ label:"", time:0 });
  const interimKeysRef = useRef(new Set()); // dedup interim triggers

  // Always keep actionsRef current (avoids stale closures)
  useEffect(() => { actionsRef.current = actions; });

  // ── fire a matched command (with debounce) ──────────────────
  const fire = useCallback(({ cmd, m }) => {
    const now = Date.now();
    if (debounceRef.current.label === cmd.label &&
        now - debounceRef.current.time < 1200) return; // debounce

    debounceRef.current = { label: cmd.label, time: now };
    cmd.fn(m, actionsRef.current);
    setLastCommand(cmd.label);
    setLastStatus("ok");
    setLog(prev => [cmd.label, ...prev].slice(0, 5));
  }, []);

  // ── setup SpeechRecognition once ────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recog = new SR();
    recog.lang            = "en-US";
    recog.continuous      = true;
    recog.interimResults  = true;   // ← get partial results immediately
    recog.maxAlternatives = 3;      // ← 3 backup transcripts

    recog.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res    = event.results[i];
        const finals = res.isFinal;

        // Collect all alternative transcripts
        const alts = [];
        for (let a = 0; a < res.length; a++) alts.push(res[a].transcript);
        const primary = alts[0];

        setLastTranscript(primary.trim());

        if (finals) {
          // ── FINAL: try all commands on all alternatives ──
          interimKeysRef.current.clear();
          let found = null;
          for (const t of alts) { found = tryMatch(t, false); if (found) break; }
          if (found) fire(found);
          else setLastStatus("miss");

        } else {
          // ── INTERIM: try instant-only commands ──────────
          // Key = first 25 chars of normalised primary (prevents re-fire as interim grows)
          const key = normalise(primary).slice(0, 25);
          if (interimKeysRef.current.has(key)) continue;

          let found = null;
          for (const t of alts) { found = tryMatch(t, true); if (found) break; }
          if (found) {
            interimKeysRef.current.add(key);
            fire(found);
          }
        }
      }
    };

    // Auto-restart after browser kills the session
    recog.onend = () => {
      if (listeningRef.current) {
        setTimeout(() => {
          if (listeningRef.current) try { recog.start(); } catch(_) {}
        }, 100);
      } else {
        setListening(false);
      }
    };

    recog.onerror = (e) => {
      if (e.error === "not-allowed") {
        listeningRef.current = false;
        setListening(false);
        setLastCommand("❌ Mic permission denied");
        setLastStatus("miss");
      }
      // "no-speech"/"aborted" → handled by onend auto-restart
    };

    recogRef.current = recog;
    return () => { listeningRef.current = false; try { recog.abort(); } catch(_) {} };
  }, [fire]);

  // ── toggle on/off ────────────────────────────────────────────
  const toggle = useCallback(() => {
    const recog = recogRef.current;
    if (!recog) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      setListening(false);
      setLastTranscript("");
      interimKeysRef.current.clear();
      try { recog.abort(); } catch(_) {}
    } else {
      listeningRef.current = true;
      setListening(true);
      setLastCommand("");
      setLastStatus("");
      interimKeysRef.current.clear();
      try { recog.start(); } catch(_) {}
    }
  }, []);

  return { listening, toggle, lastTranscript, lastCommand, lastStatus, log, supported };
};
