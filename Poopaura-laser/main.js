// main.js

// --- Global Variables ---
let gl;
let shaderProgram;
let cubeVertexBuffer;
let cubeIndexBuffer;
let modelViewMatrix, projectionMatrix;
let planeUniformLocation;

// --- Main Function ---
window.onload = function main() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // --- Shaders ---
    const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        // Pass vertex position to fragment shader
        varying vec4 vWorldPosition; 

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vWorldPosition = aVertexPosition;
        }
    `;

    const fsSource = `
        precision mediump float;
        
        // Passed from vertex shader
        varying vec4 vWorldPosition; 
        
        // The cutting plane equation: ax + by + cz - d = 0
        // vec4(normal.xyz, distance)
        uniform vec4 uPlane; 

        void main(void) {
            // Calculate the distance from the point to the plane
            float distance = dot(vWorldPosition.xyz, uPlane.xyz) - uPlane.w;
            
            // If the distance is positive, the fragment is "behind" the plane, so we discard it
            if (distance > 0.0) {
                discard; 
            }
            
            // Otherwise, color the fragment
            gl_FragColor = vec4(0.4, 0.7, 1.0, 1.0); // Blue color for the cube
        }
    `;

    // Initialize shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    planeUniformLocation = gl.getUniformLocation(shaderProgram, "uPlane");

    // --- Geometry ---
    const vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
    ];
    // We define all 8 vertices and then use indices to draw the 6 faces (12 triangles)
    const indices = [
        0, 1, 2,  0, 2, 3, // Front
        4, 5, 6,  4, 6, 7, // Back
        3, 2, 6,  3, 6, 5, // Top
        0, 7, 1,  0, 4, 7, // Bottom
        1, 7, 6,  1, 6, 2, // Right
        0, 3, 5,  0, 5, 4  // Left
    ];
    
    cubeVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // --- Set up matrices ---
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);

    // --- Render Loop ---
    let cubeRotation = 0.0;
    let lastTime = 0;

    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - lastTime;
        lastTime = now;

        // Update cube rotation
        cubeRotation += deltaTime * 0.5;
        mat4.identity(modelViewMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0.7, 0.5, 0.2]);

        // --- Animate the cutting plane ---
        // This makes the "cut" move back and forth
        const cutPosition = Math.sin(now) * 1.5; 
        // The plane is defined by a normal vector (e.g., pointing along X-axis) and a distance.
        const cuttingPlane = [1.0, 0.0, 0.0, cutPosition];

        // Draw the scene
        drawScene(positionAttributeLocation, projectionMatrixUniformLocation, modelViewMatrixUniformLocation, cuttingPlane);
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};


// --- Drawing Function ---
function drawScene(posAttrLoc, projMatrixLoc, mvMatrixLoc, cuttingPlane) {
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL how to pull out the positions from the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posAttrLoc);
    
    // Bind the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

    // Tell WebGL to use our program
    gl.useProgram(shaderProgram);

    // Set the shader uniforms
    gl.uniformMatrix4fv(projMatrixLoc, false, projectionMatrix);
    gl.uniformMatrix4fv(mvMatrixLoc, false, modelViewMatrix);
    gl.uniform4fv(planeUniformLocation, cuttingPlane);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}


// --- WebGL Helper Functions ---
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}
