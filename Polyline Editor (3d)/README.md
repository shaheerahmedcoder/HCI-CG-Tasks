# Polyline Editor with 3D view (HCI LAB MOCK MID)
This project was developed as part of the **Human-Computer Interaction (HCI) Mid Lab**.  
During the design process, concepts from **Chapter 5 of the HCI book** were studied and applied to guide the interaction design and usability considerations of the system.  

### Phase 4: Implementation and Deployment

**Name:** Shaheer Ahmed  
**Seat No:** B23110006154  

---
#### Deployment Link
https://hcimidlab154.vercel.app/

---

# Team Members

| Name | Seat No | Phase | Repo Link |
|-----|-----|-----|-----|
| Shaheer Ahmed | B23110006154 | Implementation and Deployment | [*Phase 4*](https://github.com/shaheerahmedcoder/HCI-Polyline-Editor-3d-) |
| M Bilal Atif Usmani  | B23110006057 |Analysis | Repo |
| Muhammad Ibrahim  | B23110006103 | Design | [Phase 3](https://github.com/muhammadibrahim146/-Polyline-Editor) |
| Muhammad Mujtaba | B23110006107 | Requirement | Repo |

---

# My Contribution

* Implemented the interactive Polyline Editor using React and TypeScript.
* Developed vertex editing features including Move, Delete, and Insert.
* Implemented the Undo history stack (maximum 30 steps).
* Created Save/Load JSON functionality for storing polylines.
* Added Export PNG functionality for saving the canvas as an image.
* Implemented 3D visualization of polylines using Three.js.
* Implemented keyboard based interaction controls.
* Designed the data structures used to store polylines and vertices.

---

# 1. Tech Stack Used
* Reactjs
* Tailwind CSS 
* Three.js (for 3d rendering)
* HTML5 Canvas (for 2d rendering)
* Vercel (for deployment)

---

# 2. Whole System Functionality

## Keyboard Shortcuts Controls

| Key | Action | Description |
|-----|--------|-------------|
| B | Begin | Start creating a new polyline |
| D | Delete | Remove the closest vertex |
| M | Move | Pick a vertex and place it at a new location |
| I | Insert | Insert a new point on the nearest segment |
| Z | Undo | Undo the last action (up to 30 steps) |
| R | Refresh | Redraw all polylines on the canvas |
| ESC | End | End current polyline drawing |
| Q | Quit | Clear the canvas and end the session |

---

# 3. Additional Functions Added Beyond Basic Requirements

| Function | Implementation |
|--------|--------|
| Undo (Z) |  Pressing Z restores the previous state. |
| Export PNG |  downloaded as a PNG file. |
| Save / Load JSON | polyline array into a `.json` file and restores it when loaded. |
| View in 3D | Converts 2D coordinates into a 3D scene rendered using Three.js. |
| Color & Stroke Width | Users can select polyline color and thickness in real time. |

---

# 4. Polyline editor with 3d view Interaction Details

### Begin Mode (B)
* Click on the canvas to place vertices and create a polyline.
* A **ghost preview line** follows the cursor from the last vertex.
* The polyline can be completed by:
  - **Double-click**
  - **Right-click**
  - Pressing **ESC**
* Polylines with **fewer than two vertices** are automatically removed.

### Delete Mode (D)
* Hover near a vertex to see a **red glow highlight**.
* Click to remove the **closest vertex**.
* If only **one vertex remains**, the entire polyline is removed.

### Move Mode (M)
* A **two-step interaction**:
  1. First click selects the vertex.
  2. Second click places it at a new position.
* A **dashed guide line** shows the movement path.

### Insert Mode (I)
* Hover near a **line segment** to see a **teal preview point**.
* Click to insert a **new vertex on the segment**.
* The segment is automatically **split into two segments**.

### Refresh (R)
* Redraws all polylines on the canvas **without modifying stored data**.

### Undo (Z)
* Restores the previous editor state using a **history stack** (maximum **30 snapshots**).

### 3D View
* Opens a **Three.js modal viewer**.
* All polylines are displayed in a **3D layered scene**.
* Users can **rotate, zoom, and pan** the view.

### Save / Load
* **Save:** Exports polylines as a **JSON file**.
* **Load:** Restores polylines from a previously saved JSON file.

### Export PNG
* Downloads the current canvas as a **PNG image**.

---

# 5. Data Structures Used

The primary data structure is a **dynamic array of polyline objects**.  
Each polyline contains an array of **Point2D vertices**.

The undo system uses a **stack (LIFO)** of deep-cloned snapshots.

## Type Definitions

```typescript
interface Point2D {
  x: number;
  y: number;
}

interface Polyline {
  id: number;
  name: string;
  points: Point2D[];
  color: string;
  width: number;
}

interface EditorState {
  polys: Polyline[];
  history: Polyline[][];
  nextId: number;
}
```

## Deep Clone for History

```typescript
function deepClonePolys(polys: Polyline[]): Polyline[] {
  return polys.map(p => ({
    ...p,
    points: p.points.map(pt => ({ ...pt }))
  }));
}
```

---

# 6. Why Arrays Were Used (Justification for using this Data Structure)

Arrays were chosen because they provide:
* Efficient sequential traversal for rendering
* Constant time append operations
* Simple insertion and deletion using index-based operations

| Operation | Complexity |
|---|---|
| Add Vertex | O(1) |
| Delete Vertex | O(n) |
| Insert Vertex | O(n) |
| Nearest Vertex Search | O(n) |

---

# 7. Whole Mechanism for Inserting a New Point
The system uses **point-to-segment projection**.
For each segment `[A,B]`:
```
t = dot(M − A , B − A) / dot(B − A , B − A)
```
The value of **t** is clamped between **0 and 1**.
The closest point is calculated as:
```
C = A + t(B − A)
```
If the mouse distance from **C** is within **20px**, that segment becomes eligible for insertion.
```
points.splice(segIdx + 1, 0, closestPoint)
```
---

# 8. Logic Behind Saving and Reading the Array of Polylines

## Save

```typescript
const data = JSON.stringify(
  { polys: state.polys, meta: { saved: new Date().toISOString() } },
  null,
  2
);

const blob = new Blob([data], { type: "application/json" });
```
---
## Load

```typescript
const obj = JSON.parse(text);

const maxId = obj.polys.reduce(
  (m, p) => Math.max(m, p.id),
  0
);

dispatch({
  type: "SET_POLYS",
  polys: obj.polys,
  nextId: maxId + 1
});
```

---

# 9. Challenges Faced

1. Implementing the **two-phase Move interaction** with correct state handling.
2. Implementing the **nearest segment projection algorithm** correctly.
3. Handling **canvas coordinates vs Three.js coordinates**.
4. Preventing flicker in the ghost preview line.
5. Ensuring proper **deep cloning for undo history**.
6. Implementing **manual orbit camera controls**.

---

# 10. Interactive Process

The development followed the **HCI Interaction Design Lifecycle**:

**Requirements → Analysis → Design → Implementation**

---

### Requirements
Requirements gathering was completed in **Phase 1** by **Mujtaba**.

---

### Analysis
During the analysis phase, **Chapter 5 of the HCI textbook** was studied and considered while planning the interaction design.  
The concepts from this chapter helped in understanding **user tasks, interaction flow, and usability considerations** for the polyline editor.

---

### Design
This phase was completed by **Ibrahim**.During the design phase, **Chapter 5 of the HCI textbook** was studied and considered while planning 
Several **HCI principles** were applied in the design, including:

* Direct manipulation
* Immediate visual feedback
* Consistent keyboard shortcuts
* Error prevention

---

### Implementation & Deployment
This phase was completed by **Shaheer Ahmed**.

The final system integrates all the required interaction features and also includes several additional improvements. The implementation focused on:

* Proper use of **data structures** for managing polylines and vertices
* Implementing the **segment insertion mechanism** inside a polyline
* Supporting **keyboard shortcut–based interaction** for efficient editing
* Implementing **undo functionality using a history stack**
* Adding a **3D viewing experience using Three.js** for visualizing polylines in a layered 3D scene



<img width="443" height="202" alt="image" src="https://github.com/user-attachments/assets/70ff8c5b-8f80-4faf-98df-22f1b0b8fa64" />

---

## References
 ALan Dix Book
   *Human-Computer Interaction (3rd Edition)*.  
   Chapter 5 – Interaction Design Basics.

