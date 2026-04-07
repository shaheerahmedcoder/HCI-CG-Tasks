const canvas = document.getElementById('lerpCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('t-slider');
const tValueDisplay = document.getElementById('t-value');

const shapeA = [
    { x: 1, y: -1 }, 
    { x: -1, y: -1 }, 
    { x: -1, y: 1 }, 
    { x: 1, y: 1 }
];

const shapeB = [
    { x: 5, y: -2 }, 
    { x: 4, y: -3 }, 
    { x: 4, y: 0 }, 
    { x: 3, y: 2 }
];

// Drawing offsets and scaling to make it visible on the canvas
const SCALE = 50;
const OFFSET_X = 150;
const OFFSET_Y = 200;

// The standard linear interpolation formula
function lerp(start, end, t) {
    return start + (end - start) * t; 
    // This is mathematically identical to: (1 - t) * start + t * end
}

// Function to calculate the new polygon array based on 't'
function getMorphedShape(t) {
    let morphedShape = [];
    for (let i = 0; i < shapeA.length; i++) {
        morphedShape.push({
            x: lerp(shapeA[i].x, shapeB[i].x, t),
            y: lerp(shapeA[i].y, shapeB[i].y, t)
        });
    }
    return morphedShape;
}

function drawPolygon(vertices, color, isDashed = false, fill = false) {
    ctx.beginPath();
    // Move to the first scaled/offset vertex
    ctx.moveTo(vertices[0].x * SCALE + OFFSET_X, vertices[0].y * SCALE + OFFSET_Y);
    
    // Draw lines to subsequent vertices
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x * SCALE + OFFSET_X, vertices[i].y * SCALE + OFFSET_Y);
    }
    ctx.closePath(); // Connect last vertex to the first

    if (isDashed) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
}

function render() {
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current 't' from the slider
    const t = parseFloat(slider.value);
    
    // Draw base shapes (Guides)
    drawPolygon(shapeA, 'rgba(255, 198, 42, 1)', true); // Blue square
    drawPolygon(shapeB, 'rgba(3, 205, 255, 1)', true); // Green wedge

    // Calculate and draw the Morphed Shape!
    const currentShape = getMorphedShape(t);
    drawPolygon(currentShape, 'red', false, 'rgba(0, 255, 115, 1)'); // Solid red with fill
}

// Event Listeners to update real-time
slider.addEventListener('input', () => {
    tValueDisplay.innerText = parseFloat(slider.value).toFixed(2);
    render();
});

// Initial draw
render();