# LAB 3 Deployment Link
https://lab3-154.vercel.app/

# LAB 3 (Process Data Button Demo)

## Overview
This project demonstrates a simple interactive web button that processes an action each time it is clicked. The system keeps track of how many times the button has been pressed and displays feedback to the user.

The button can only be used a limited number of times. Once the limit is reached, the button becomes disabled and a warning message is displayed.

---

## Features
- Tracks how many times the button is clicked
- Displays status messages after each action
- Provides visual click feedback (button scaling effect)
- Disables the button after reaching the maximum limit
- Displays a warning message when the limit is reached

---

## Project Structure
Originally, the entire project was written inside a **single HTML file** containing HTML, CSS, and JavaScript together.

For better organization and maintainability, the code was separated into three files:

project-folder/
│
├── index.html   → Contains the HTML structure  
├── style.css    → Contains all styling (CSS)  
└── script.js    → Contains JavaScript logic  

---

## Improvements Made
The following improvements were implemented **without changing the output or behavior of the program**:

- Separated the code into **three different files (HTML, CSS, JavaScript)**
- Removed inline CSS from the HTML file and placed it in `style.css`
- Moved all JavaScript logic to `script.js`
- Improved readability and maintainability of the code
- Organized the project structure following **standard web development practices**

These changes make the code easier to maintain, debug, and expand in the future while keeping the same functionality.

---

## How It Works
1. The user clicks the **Process Data** button.
2. A counter increases each time the button is clicked.
3. The system displays the number of times the process has run.
4. After **3 clicks**, the button becomes disabled.
5. A warning message appears indicating that the limit has been reached.

---

## Technologies Used
- HTML
- CSS
- JavaScript

---

## Purpose
This project demonstrates basic **user interaction handling using JavaScript** and simple UI feedback mechanisms.
