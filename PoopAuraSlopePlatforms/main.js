// Get the canvas and WebGL context
const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported!');
}

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

// Set a clear color (e.g., light blue for the sky)
gl.clearColor(0.6, 0.8, 1.0, 1.0);

// Basic shader setup (more detail below)
// ... WebGL program, shaders, buffers will be initialized here ...

// Start the game
gameLoop();
