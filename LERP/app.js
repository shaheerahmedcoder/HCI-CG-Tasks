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


const SCALE = 50;
const OFFSET_X = 150;
const OFFSET_Y = 200;

function lerp(start, end, t) {
    return start + (end - start) * t; 

}

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

    ctx.moveTo(vertices[0].x * SCALE + OFFSET_X, vertices[0].y * SCALE + OFFSET_Y);

    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x * SCALE + OFFSET_X, vertices[i].y * SCALE + OFFSET_Y);
    }
    ctx.closePath(); 

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = parseFloat(slider.value);
    

    drawPolygon(shapeA, 'rgba(230, 0, 255, 0.5)', true); 
    drawPolygon(shapeB, 'rgba(0, 255, 132, 0.67)', true); 

    const currentShape = getMorphedShape(t);
    drawPolygon(currentShape, 'red', false, 'rgba(1, 196, 255, 1)'); 
}


slider.addEventListener('input', () => {
    tValueDisplay.innerText = parseFloat(slider.value).toFixed(2);
    render();
});


render();