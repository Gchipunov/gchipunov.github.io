// --- GLSL Shader Code ---

// This shader positions the vertices.
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

// This shader sets the color for each pixel.
const fsSource = `
    void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0); // Orange color
    }
`;

window.onload = main;

function main() {
    const canvas = document.getElementById('gameCanvas');
    const gl = canvas.getContext('webgl');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // --- Shader Program Setup ---
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // --- Geometry Buffer Setup ---
    const buffers = initBuffers(gl);

    // --- Game State ---
    const player = {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        speed: 5
    };

    const keys = {}; // Object to track pressed keys

    // --- Event Listeners for Controls ---
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // --- Main Game Loop ---
    let lastTime = 0;
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - lastTime;
        lastTime = now;

        update(deltaTime); // Update game state
        drawScene(gl, programInfo, buffers, player); // Draw the scene

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


    // --- Update Function ---
    function update(deltaTime) {
        if (keys['ArrowLeft'] || keys['a']) {
            player.x -= player.speed;
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.x += player.speed;
        }
        if (keys['ArrowUp'] || keys['w']) {
            player.y += player.speed;
        }
        if (keys['ArrowDown'] || keys['s']) {
            player.y -= player.speed;
        }
    }
}

// --- WebGL Helper Functions ---

/**
 * Initialize a shader program, so WebGL knows how to draw our data.
 */
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

/**
 * Creates a shader of the given type, uploads the source and compiles it.
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * Initialize the buffers we'll need. For this demo, we just have one object.
 */
function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // A simple square
    const positions = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return { position: positionBuffer };
}

/**

 * Draw the scene.
 */
function drawScene(gl, programInfo, buffers, player) {
    gl.clearColor(0.2, 0.2, 0.4, 1.0); // Clear to a dark blue
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // --- Projection and View Matrices ---
    // Note: for 2D, a simple orthographic projection is used.
    // This creates a "camera" that maps our world coordinates to screen coordinates.
    const projectionMatrix = createOrthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1);
    
    // The Model-View matrix handles the object's position, rotation, and scale.
    let modelViewMatrix = identity();
    // 1. Translate to player's position
    modelViewMatrix = translate(modelViewMatrix, player.x, player.y, 0);
    // 2. Scale the 2x2 square to our desired player size
    modelViewMatrix = scale(modelViewMatrix, player.width / 2, player.height / 2, 1);


    // --- Drawing the Player ---
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// --- Simple Matrix Math Functions (in place of a library like gl-matrix) ---
function createOrthographic(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = -2 * lr;
    out[5] = -2 * bt;
    out[10] = 2 * nf;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
}

function identity() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function translate(matrix, x, y, z) {
    const out = new Float32Array(matrix);
    out[12] = matrix[12] + matrix[0] * x + matrix[4] * y + matrix[8] * z;
    out[13] = matrix[13] + matrix[1] * x + matrix[5] * y + matrix[9] * z;
    out[14] = matrix[14] + matrix[2] * x + matrix[6] * y + matrix[10] * z;
    return out;
}

function scale(matrix, x, y, z) {
    const out = new Float32Array(matrix);
    out[0] *= x;
    out[1] *= x;
    out[2] *= x;
    out[4] *= y;
    out[5] *= y;
    out[6] *= y;
    out[8] *= z;
    out[9] *= z;
    out[10] *= z;
    return out;
}
