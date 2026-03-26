# LAB 04 Deployment Link
https://lab4-154.vercel.app/

# LAB 04 (HCI Principles Interactive Demo)

## Overview
This project demonstrates important **Human-Computer Interaction (HCI) principles** through a simple interactive button interface.

The interface visually represents HCI concepts such as affordance, mapping, feedback, constraint, and signifier using colors and interface changes.

---

## HCI Principles Demonstrated

### Affordance
The button has a **blue border**, indicating that it is clickable and interactive.

### Mapping
The status area has a **green border**, clearly showing where system feedback will appear.

### Feedback
When the button is clicked, it briefly turns **yellow and slightly shrinks**, providing immediate visual feedback to the user.

### Constraint
After **3 clicks**, the button becomes disabled and its border changes to **red**, preventing further actions.

### Signifier
When disabled, the button changes to a **purple background**, clearly indicating that the action can no longer be performed.

---

## Project Structure
Initially, the entire implementation was inside **one HTML file** that contained HTML, CSS, and JavaScript together.

To improve the structure of the project, the code was separated into three files:

project-folder/
│
├── index.html   → Contains the webpage structure  
├── style.css    → Contains styling and HCI visual indicators  
└── script.js    → Contains interaction logic and functionality  

---

## Improvements Made
The following improvements were implemented **without affecting the output or functionality of the project**:

- Separated the project into **three different files (HTML, CSS, JavaScript)**
- Moved all CSS styling from the HTML file into `style.css`
- Moved JavaScript functionality into `script.js`
- Improved code readability and organization
- Followed **standard web development best practices**
- Made the project easier to maintain and expand in the future

All visual HCI demonstrations and interactions remain exactly the same as in the original implementation.

---

## How It Works
1. The user clicks the **Process Data** button.
2. The system provides **visual feedback** using a yellow highlight effect.
3. The status area updates with the number of processed actions.
4. After **3 clicks**, the button becomes disabled.
5. Visual indicators show that the action is no longer allowed.

---

## Technologies Used
- HTML
- CSS
- JavaScript

---

## Purpose
This project is designed to demonstrate **Human-Computer Interaction (HCI) principles in a simple and visual way**, helping users understand how interface design communicates actions and system states.has been separated into three files:
