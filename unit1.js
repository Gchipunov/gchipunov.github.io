
// --- 2. JavaScript (main.js) ---

// Global variables
let gl;
let program;
let positionBuffer;
let character = {
    position: [0.0, 0.0, 0.0], // x, y, z
    targetPosition: [0.0, 0.0, 0.0],
    speed: 0.05, // Units per frame
    modelMatrix: mat4.create(), // Placeholder, needs gl-matrix library
};
let projectionMatrix = mat4.create();
let viewMatrix = mat4.create();

// Basic Shaders (GLSL)
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    }
`;

const fsSource = `
    void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0); // Orange color
    }
`;

function main() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Initialize shaders
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Look up shader uniform and attribute locations
    program.attribLocations = {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
    };
    program.uniformLocations = {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        viewMatrix: gl.getUniformLocation(program, 'uViewMatrix'),
        modelMatrix: gl.getUniformLocation(program, 'uModelMatrix'),
    };

    // Create a simple square for the character
    const positions = [
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         0.5,  0.5, 0.0,
        -0.5,  0.5, 0.0,
    ];
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Setup projection matrix (perspective for 3D)
    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    // You'll need a library like 'gl-matrix' for these operations.
    // Example: mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    // For simplicity here, let's assume gl-matrix is loaded.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Setup view matrix (camera position)
    // Example: mat4.lookAt(viewMatrix, [0, 1, 5], [0, 0, 0], [0, 1, 0]); // Eye, Target, Up

    // Event listeners for touch
    canvas.addEventListener('touchstart', onTouchStart, false);

    // Start the render loop
    requestAnimationFrame(renderLoop);
}

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

function onTouchStart(event) {
    event.preventDefault(); // Prevent default browser touch behavior (e.g., scrolling)

    const touch = event.touches[0];
    const rect = gl.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // --- Core Logic for Touch-to-World-Space ---
    // This is a complex part. For a flat ground plane (y=0),
    // you can unproject the touch point from screen space to world space.
    // This typically involves:
    // 1. Convert touch coordinates to normalized device coordinates (NDC).
    // 2. Create an inverse projection matrix.
    // 3. Create an inverse view matrix.
    // 4. Transform two points (near and far clip plane) from NDC to world space.
    // 5. Calculate the ray from the camera through the touch point.
    // 6. Intersect this ray with your ground plane (e.g., y=0).

    // Placeholder for actual unprojection logic:
    // For a simple 2D game or a fixed camera looking down,
    // you might map screen coords directly to world XY.
    // For full 3D, you need raycasting.

    // A very simplified example assuming a direct mapping for a flat plane for demonstration:
    // (This is highly simplified and won't work correctly for perspective camera without unprojection)
    const worldX = (x / gl.canvas.width) * 10 - 5; // Map to a range like -5 to 5
    const worldZ = (y / gl.canvas.height) * 10 - 5; // Map to a range like -5 to 5 (assuming Z is depth)

    character.targetPosition = [worldX, 0.0, worldZ]; // Assuming a ground plane at y=0
    console.log(`Touch at screen (${x}, ${y}), target world (${worldX}, 0.0, ${worldZ})`);
}


function updateCharacter(deltaTime) {
    const currentPos = vec3.fromValues(character.position[0], character.position[1], character.position[2]);
    const targetPos = vec3.fromValues(character.targetPosition[0], character.targetPosition[1], character.targetPosition[2]);

    const distance = vec3.distance(currentPos, targetPos);
    const minDistance = 0.1; // Stop if very close to target

    if (distance > minDistance) {
        const direction = vec3.create();
        vec3.subtract(direction, targetPos, currentPos);
        vec3.normalize(direction, direction);

        const moveAmount = character.speed * deltaTime; // Adjust speed by delta time
        const actualMove = Math.min(moveAmount, distance); // Don't overshoot

        const displacement = vec3.create();
        vec3.scale(displacement, direction, actualMove);
        vec3.add(currentPos, currentPos, displacement);

        character.position = [currentPos[0], currentPos[1], currentPos[2]];
    }
}


let lastRenderTime = 0;
function renderLoop(currentTime) {
    currentTime *= 0.001; // convert to seconds
    const deltaTime = currentTime - lastRenderTime;
    lastRenderTime = currentTime;

    updateCharacter(deltaTime);
    drawScene();

    requestAnimationFrame(renderLoop);
}

function drawScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    // Set the camera position (view matrix)
    mat4.lookAt(viewMatrix, [0, 5, 10], [0, 0, 0], [0, 1, 0]); // Example: Camera at (0,5,10) looking at origin

    // Update the model matrix for the character
    mat4.identity(character.modelMatrix);
    mat4.translate(character.modelMatrix, character.modelMatrix, character.position);
    // Add rotation, scaling if needed

    // Set the shader uniforms
    gl.uniformMatrix4fv(program.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(program.uniformLocations.viewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(program.uniformLocations.modelMatrix, false, character.modelMatrix);

    // Tell WebGL how to pull out the positions from the position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        program.attribLocations.vertexPosition,
        3, // 3 components per vertex (x, y, z)
        gl.FLOAT, // the data in the buffer is 32bit floats
        false, // don't normalize
        0, // how many bytes to get from one set of values to the next
        0 // how many bytes inside the buffer to start from
    );
    gl.enableVertexAttribArray(program.attribLocations.vertexPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw the square
}

// Ensure the gl-matrix library is loaded before this script runs.
// You can include it via a CDN in your HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/3.3.0/gl-matrix-min.js"></script>

main();
