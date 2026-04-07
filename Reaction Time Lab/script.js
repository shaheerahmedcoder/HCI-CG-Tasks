const stimulusDiv = document.getElementById("stimulus");
const startBtn = document.getElementById("startBtn");

const trialsSpan = document.getElementById("trials");
const correctSpan = document.getElementById("correct");
const avgRTSpan = document.getElementById("avgRT");

let totalTrials = 10;
let currentTrial = 0;
let correct = 0;
let reactionTimes = [];

let stimulus = "";
let startTime = 0;
let waitingForResponse = false;

// Generate random stimulus (Letter or Number)
function generateStimulus() {
    const isLetter = Math.random() < 0.5;

    if (isLetter) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        stimulus = letters[Math.floor(Math.random() * letters.length)];
    } else {
        stimulus = Math.floor(Math.random() * 10).toString();
    }

    stimulusDiv.textContent = stimulus;
    startTime = performance.now();
    waitingForResponse = true;
}

// Start experiment
startBtn.addEventListener("click", () => {
    currentTrial = 0;
    correct = 0;
    reactionTimes = [];

    trialsSpan.textContent = 0;
    correctSpan.textContent = 0;
    avgRTSpan.textContent = 0;

    startBtn.disabled = true;
    nextTrial();
});

// Next trial with random delay
function nextTrial() {
    if (currentTrial >= totalTrials) {
        stimulusDiv.textContent = "Finished!";
        startBtn.disabled = false;
        return;
    }

    stimulusDiv.textContent = "...";

    setTimeout(() => {
        generateStimulus();
    }, Math.random() * 2000 + 1000); // 1–3 sec delay
}

// Handle key press
document.addEventListener("keydown", (e) => {
    if (!waitingForResponse) return;

    const key = e.key.toLowerCase();
    let isCorrect = false;

    if (/[a-zA-Z]/.test(stimulus) && key === "a") {
        isCorrect = true;
    } else if (/[0-9]/.test(stimulus) && key === "l") {
        isCorrect = true;
    }

    const reactionTime = performance.now() - startTime;

    if (isCorrect) {
        correct++;
        reactionTimes.push(reactionTime);
    }

    currentTrial++;
    waitingForResponse = false;

    // Update UI
    trialsSpan.textContent = currentTrial;
    correctSpan.textContent = correct;

    const avg =
        reactionTimes.length > 0
            ? (reactionTimes.reduce((a, b) => a + b, 0) /
                  reactionTimes.length).toFixed(2)
            : 0;

    avgRTSpan.textContent = avg;

    nextTrial();
});