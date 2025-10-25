// Vertex Shader (vShaderSource)
const vShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    uniform mat4 u_matrix;
    varying vec2 v_texCoord;

    void main() {
        // Apply the projection/view/world matrix to the position
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// Fragment Shader (fShaderSource)
const fShaderSource = `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_texCoord;

    void main() {
        // Sample the color from the texture
        gl_FragColor = texture2D(u_image, v_texCoord);
    }
`;

const canvas = document.getElementById('game-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error("WebGL not supported");
}

// 1. Compile Shaders (Helper function needed here: createShader, createProgram)
// ...

// 2. Look up attribute and uniform locations (a_position, u_matrix, etc.)
// ...

// 3. Set up Orthographic Projection Matrix
// This matrix transforms world coordinates (e.g., player position) into clip space.
const projectionMatrix = [
    2/canvas.width, 0, 0, 0,
    0, -2/canvas.height, 0, 0, // Negative for Y-up in WebGL
    0, 0, 2/1, 0,
    -1, 1, 0, 1
];

// In the render loop:
// gl.uniformMatrix4fv(u_matrixLocation, false, projectionMatrix);
// gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

const input = {
    left: false,
    right: false,
    jump: false
};

const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const jumpButton = document.getElementById('jump-button');

// Function to handle both mouse down/up and touch start/end
function setupInput(element, key) {
    const startEvent = 'touchstart';
    const endEvent = 'touchend';

    // Start (Press Down)
    element.addEventListener(startEvent, (e) => {
        e.preventDefault(); // Prevent scrolling/default mobile behavior
        input[key] = true;
    });

    // End (Release Up)
    element.addEventListener(endEvent, (e) => {
        e.preventDefault();
        // Check if the touch that ended was over the button, for robustness
        // Simple approach: just set to false on any touch end
        input[key] = false;
    });
    
    // Also include mouse/keyboard for debugging on desktop
    element.addEventListener('mousedown', () => input[key] = true);
    element.addEventListener('mouseup', () => input[key] = false);
}

setupInput(leftButton, 'left');
setupInput(rightButton, 'right');
setupInput(jumpButton, 'jump');

// The main game loop will check the 'input' object:
// if (input.jump && player.onGround) {
//     player.vy = JUMP_STRENGTH;
//     player.onGround = false;
// }
