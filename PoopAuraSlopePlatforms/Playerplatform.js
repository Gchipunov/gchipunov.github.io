// Player object
const player = {
    x: 100, y: 300,
    width: 30, height: 50,
    velocityX: 0, velocityY: 0,
    onGround: false
};

// Platforms array
// We define platforms by their vertices in counter-clockwise order
const platforms = [
    // A flat ground platform
    { vertices: [{x:0, y:0}, {x:800, y:0}, {x:800, y:50}, {x:0, y:50}], color: [0.3, 0.7, 0.2, 1] },

    // A 45-degree slope (tan(45) = 1)
    { vertices: [{x:200, y:50}, {x:400, y:50}, {x:400, y:250}, {x:200, y:50}], angle: Math.PI / 4, color: [0.5, 0.5, 0.5, 1] },
    { vertices: [{x:450, y:50}, {x:650, y:250}, {x:650, y:50}, {x:450, y:50}], angle: -Math.PI / 4, color: [0.5, 0.5, 0.5, 1] },

    // A 30-degree slope (tan(30) ≈ 0.577)
    { vertices: [{x:700, y:200}, {x:900, y:200}, {x:900, y:200 + 200 * Math.tan(Math.PI/6)}, {x:700, y:200}], angle: Math.PI / 6, color: [0.6, 0.6, 0.5, 1] },
    // ... add 2 more 30-degree and one 60-degree platform similarly
];

// Physics constants
const gravity = -0.5;
const jumpStrength = 12;
const moveSpeed = 4;
