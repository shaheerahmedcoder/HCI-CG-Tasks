# Gravity Cube 🧊

A Three.js + React simulation of a cube falling under gravity, using a **right-hand coordinate system** (Y up, X right, Z toward viewer) — matching the Vuforia spatial frame reference theory.

## Gravity Simulation on 3D Cube Using Right Hand Coordinate System (Live Demo )



https://github.com/user-attachments/assets/5be0075d-2d6d-40df-a3bc-561c22c46b01



https://github.com/user-attachments/assets/6c26bd5d-d57b-48cf-b247-d441837656d0
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
