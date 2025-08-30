// --- script.js ---

// Basic WebGL setup
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported!');
}

let shaderSource;
let program;
let positionBuffer;
let timeLocation, resolutionLocation;

let startTime = Date.now();

// Main setup function
async function setup() {
    // Fetch the shader code
    const response = await fetch('shader.glsl');
    shaderSource = await response.text();

    // Create and compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaderSource);

    // Create program and link shaders
    program = createProgram(gl, vertexShader, fragmentShader);

    // Look up attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    timeLocation = gl.getUniformLocation(program, "u_time");
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    
    // Create a buffer to hold vertex data
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // A simple quad that fills the entire canvas
    const positions = [
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Tell WebGL how to pull data out of the buffer
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Start the render loop
    requestAnimationFrame(render);
}

// Render loop
function render() {
    // Resize canvas to match display size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use our program
    gl.useProgram(program);
    
    // Pass uniforms to the shader
    gl.uniform1f(timeLocation, (Date.now() - startTime) * 0.001);
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // Draw the quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Call render again on the next frame
    requestAnimationFrame(render);
}

// --- WebGL Helper Functions ---
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// Start the application
setup();
