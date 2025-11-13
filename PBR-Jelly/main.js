// Global WebGL context and matrix variables
let gl;
let program;
let pMatrix; // Projection Matrix
let mvMatrix; // Model-View Matrix

/**
 * Main function to initialize WebGL
 */
function initWebGL() {
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Clear the color and depth buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initShaders();
    initMatrices(canvas.width, canvas.height);

    // Now you can call a function to draw your scene
    // drawScene();
    console.log("WebGL context and matrices initialized successfully.");
}

// --- Shader Initialization ---

function initShaders() {
    const fragmentShader = getShader(gl, "FRAGMENT_SHADER", createFragmentShaderSource());
    const vertexShader = getShader(gl, "VERTEX_SHADER", createVertexShaderSource());

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialize shaders: " + gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Get attribute and uniform locations
    program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
}

function getShader(gl, type, source) {
    const shader = gl.createShader(gl[type]);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error (" + type + "): " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// --- Shader Source Code (Simple Passthrough) ---

function createVertexShaderSource() {
    // aVertexPosition: Input 2D/3D coordinate from the buffer
    // uMVMatrix: Model-View matrix (gl-matrix)
    // uPMatrix: Projection matrix (gl-matrix)
    return `
        attribute vec3 aVertexPosition;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        void main(void) {
            gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        }
    `;
}

function createFragmentShaderSource() {
    // Sets a fixed color (white) for all fragments
    return `
        precision mediump float;
        void main(void) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `;
}

// --- gl-matrix Initialization ---

function initMatrices(width, height) {
    // 1. Initialize Projection Matrix (pMatrix)
    pMatrix = mat4.create();
    
    // For 2D platformer, we'll use an Orthographic Projection.
    // This sets up a view volume where (0, 0) is the bottom-left corner
    // and (width, height) is the top-right corner of the canvas.
    const left = 0.0;
    const right = width;
    const bottom = 0.0;
    const top = height;
    const near = 0.1;
    const far = 100.0;
    
    // mat4.ortho(out, left, right, bottom, top, near, far)
    mat4.ortho(pMatrix, left, right, bottom, top, near, far);


    // 2. Initialize Model-View Matrix (mvMatrix)
    mvMatrix = mat4.create();
    
    // Move the camera back slightly to view the scene (since the Ortho view is 
    // set to the screen plane, this only matters if you're using Z depth).
    // The "Model-View" matrix is initially an identity matrix.
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -1.0]); // Move back 1 unit in Z
}

// Start the setup when the window loads
window.onload = initWebGL;
