# 🌙 Eid Mubarak — 3D Interactive Greeting
### HCI-CG Project | Built while experimenting and learning 3D character animation and state machines in Three.js

---

## 📽️ Demo Video


https://github.com/user-attachments/assets/b0e8bc0b-427c-4f4b-b674-a36beb0cbdba




## 🎬 How it Works (for everyone)

| Step | What you see |
|------|-------------|
| 1 | A glowing cube floats in a night sky scene with a mosque and lanterns |
| 2 | Click **"Smash the Cube"** button |
| 3 | A Lego character in a fez hat walks in from the left |
| 4 | He raises a hammer dramatically |
| 5 | SMASH — screen shakes, cube vibrates |
| 6 | Cube panels fly open, coloured confetti bursts out |
| 7 | ☽ Eid Mubarak ☾ appears glowing above the cube and stays |

---

## 🛠️ Tech Stack

| Technology | What it does in this project |
|------------|------------------------------|
| **React 18** | Handles UI, buttons and the animation phase logic |
| **Three.js** | The 3D engine — renders every shape, light and effect |
| **React-Three-Fiber** | Lets Three.js be written as React components |
| **@react-three/drei** | Provides helpers like the star field and 3D text |
| **Vite** | Fast development server and build tool |

---

## 🧠 Key Concepts Used

**3D Character Animation**
The Lego figure has separate body parts (arms, legs, head) each animated individually every frame using sine wave math — no keyframe files, all procedural.

**State Machine**
The whole animation runs through a single phase string:
```
idle → walking → windup → smash → opening → revealed
```
Each component checks the phase and behaves differently. This is the same pattern used in real games.

**Particle System**
200 coloured particles burst from the cube on impact, each with velocity and gravity, updated 60 times per second using a custom buffer geometry.

**Camera Shake**
On hammer impact, the camera position is randomly offset each frame and slowly decays back — simulating real impact.

---

## 🚀 Running Locally

**Requirements:** Node.js 18+ installed

```bash
# Clone the project
git clone https://github.com/YOUR_USERNAME/eid-greet.git
cd eid-greet

# Install everything
npm install

# Start
npm run dev

```
