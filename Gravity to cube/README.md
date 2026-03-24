# Gravity Cube 🧊

A Three.js + React simulation of a cube falling under gravity, using a **right-hand coordinate system** (Y up, X right, Z toward viewer) — matching the Vuforia spatial frame reference theory.

## Physics
- Gravity acts in **−Y** direction at **9.8 m/s²**
- Euler integration: `v += g·dt`, `y += v·dt`
- Bounce with restitution coefficient **0.55**
- Angular velocity during free-fall, damped on landing
- Impact particles burst on each bounce

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Controls

- **Click** anywhere to re-drop the cube
- Cube auto re-drops every 5 seconds

## Coordinate System

| Axis | Direction |
|------|-----------|
| X (red)   | Right |
| Y (green) | Up — gravity = −Y |
| Z (blue)  | Toward viewer |
