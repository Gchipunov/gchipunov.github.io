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


// Global VBOs and particle data
let planeVBO;
let jellyVBO;
const GRID_SIZE = 10;
const PARTICLE_COUNT = GRID_SIZE * GRID_SIZE;
let particles = []; // Array to hold the 100 particle objects

// ... (initWebGL, initShaders, initMatrices from previous step) ...

/**
 * Main function to initialize WebGL
 */
function initWebGL() {
    // ... (Setup code from previous step) ...

    initShaders();
    initMatrices(canvas.width, canvas.height);
    
    // NEW: Initialize geometry buffers
    initBuffers(canvas.width, canvas.height);

    // Start the rendering loop
    tick(); 
}

/**
 * The main render/update loop
 */
function tick() {
    requestAnimationFrame(tick);
    // 1. UPDATE PHYSICS (PBD logic goes here)
    // updatePhysics(); 
    
    // 2. RENDER SCENE
    drawScene();
}

// Start the setup when the window loads
//window.onload = initWebGL;

// Dimensions for the jelly object
const JELLY_START_X = 250;
const JELLY_START_Y = 200;
const PARTICLE_SPACING = 5.0; // Spacing in pixels

function createJellyParticles() {
    // We'll store particle position data as a flat array of X, Y, Z coordinates (Z=0 for 2D)
    const particlePositions = []; 

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = JELLY_START_X + j * PARTICLE_SPACING;
            const y = JELLY_START_Y + i * PARTICLE_SPACING;

            // Store the position for the WebGL buffer
            particlePositions.push(x, y, 0.0); // X, Y, Z

            // Store the full particle object for PBD physics later
            particles.push({
                position: [x, y, 0.0],
                velocity: [0.0, 0.0, 0.0],
                mass: 1.0
                // ... other PBD data
            });
        }
    }
    return new Float32Array(particlePositions);
}

function initBuffers(width, height) {
    // --- 1. Ground Plane (Platform) ---
    
    // We'll define a simple large rectangle at the bottom of the screen (0, 0).
    const PLANE_HEIGHT = 50.0;
    const PLANE_Y = 0.0; 
    
    // Vertices for a quad: (X, Y, Z) - two triangles make a rectangle
    const planeVertices = [
        // Bottom-Left
        0.0, PLANE_Y, 0.0,
        // Bottom-Right
        width, PLANE_Y, 0.0,
        // Top-Left
        0.0, PLANE_Y + PLANE_HEIGHT, 0.0,
        
        // Top-Left (for the second triangle)
        0.0, PLANE_Y + PLANE_HEIGHT, 0.0,
        // Bottom-Right
        width, PLANE_Y, 0.0,
        // Top-Right
        width, PLANE_Y + PLANE_HEIGHT, 0.0
    ];

    planeVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeVertices), gl.STATIC_DRAW);
    planeVBO.itemSize = 3; // Each vertex has 3 components (X, Y, Z)
    planeVBO.numItems = planeVertices.length / 3; // Total number of vertices (6 for the quad)

    // --- 2. Jelly Particle Grid (10x10) ---
    
    const jellyPositions = createJellyParticles();

    jellyVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, jellyVBO);
    gl.bufferData(gl.ARRAY_BUFFER, jellyPositions, gl.DYNAMIC_DRAW); 
    // Use DYNAMIC_DRAW because the particle positions will change every frame
    jellyVBO.itemSize = 3; 
    jellyVBO.numItems = PARTICLE_COUNT;
}

function drawScene() {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Upload the matrices to the shader program
    gl.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);

    // --- Draw the Ground Plane ---
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.vertexAttribPointer(program.vertexPositionAttribute, planeVBO.itemSize, gl.FLOAT, false, 0, 0);

    // Temporarily set fragment color for the plane (if using the simple shader)
    // NOTE: In a real PBR/multi-object scene, you'd use uniforms to pass color/texture
    // to draw a different color, you'd need a separate shader or uniform.
    // Assuming a temporary uniform named uColor is available for now:
    // gl.uniform4f(program.colorUniform, 0.5, 0.5, 0.5, 1.0); // Gray

    gl.drawArrays(gl.TRIANGLES, 0, planeVBO.numItems);
    
    // --- Draw the Jelly Particles ---

    // gl.uniform4f(program.colorUniform, 1.0, 0.0, 0.0, 1.0); // Red for Jelly

    // Re-bind the jelly's buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, jellyVBO);
    gl.vertexAttribPointer(program.vertexPositionAttribute, jellyVBO.itemSize, gl.FLOAT, false, 0, 0);

    // Draw the particles as points
    gl.drawArrays(gl.POINTS, 0, jellyVBO.numItems);
}

