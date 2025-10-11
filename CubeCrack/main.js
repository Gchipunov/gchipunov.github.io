// Global WebGL context
let gl;
// Physics world
let world;
// Data arrays for cubes and their physics bodies
let cubes = [];

function initWebGL() {
    const canvas = document.getElementById('glcanvas');
    gl = canvas.getContext('webgl');
    if (!gl) { alert('WebGL not supported'); return; }

    initPhysics();
    initScene();
    
    // Start the render loop
    requestAnimationFrame(renderLoop);
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); 
    
    // 1. Create Terrain (a simple ground plane for now)
    const groundBody = new CANNON.Body({
        mass: 0, // mass = 0 makes the body static
        shape: new CANNON.Plane(),
    });
    // Rotate the plane to face up (it's created facing the negative Z axis by default)
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // 2. Create 10 Cubes
    for (let i = 0; i < 10; i++) {
        const size = 0.5;
        const cubeBody = new CANNON.Body({
            mass: 1, 
            position: new CANNON.Vec3(i * 1.5 - 7, 5 + i * 0.5, 0),
            shape: new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
        });
        world.addBody(cubeBody);
        cubes.push({
            body: cubeBody,
            size: size,
            // Store the geometry data for rendering
            geometry: createCubeGeometry(size) 
        });
    }
}

// Placeholder: In a real app, this would set up shaders and VBOs
function initScene() { /* Setup shaders, buffers, and lighting */ } 

initWebGL();

// Time keeping for physics stepping
let lastTime = 0;
const fixedTimeStep = 1 / 60; // 60 updates per second

function renderLoop(now) {
    // 1. Physics Step
    world.step(fixedTimeStep);

    // 2. Rendering
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render the terrain (conceptual)
    // drawTerrain(); 

    // Render Cubes and Debug Info
    cubes.forEach(cube => {
        // Update model matrix based on physics
        const modelMatrix = updateModelMatrix(cube.body);
        
        // A. Draw the solid cube geometry
        drawCube(modelMatrix, cube.geometry); 
        
        // B. Draw Debug Overlays (Vertices and Edges)
        drawDebugVertices(modelMatrix, cube.geometry);
        drawDebugLines(modelMatrix, cube.geometry);
    });

    requestAnimationFrame(renderLoop);
}

// Function to convert physics position/rotation to a WebGL matrix
function updateModelMatrix(body) {
    const matrix = mat4.create();
    const p = body.position;
    const q = body.quaternion;
    
    // Create translation matrix
    mat4.translate(matrix, matrix, [p.x, p.y, p.z]); 
    
    // Convert quaternion to rotation matrix and multiply
    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, [q.x, q.y, q.z, q.w]);
    mat4.mul(matrix, matrix, rotationMatrix);
    
    return matrix;
}

// Creates a simple cube geometry data structure
function createCubeGeometry(size) {
    const half = size / 2;
    // 8 vertices of a cube
    const vertices = [
        // Front face
        -half, -half,  half, // 0
         half, -half,  half, // 1
         half,  half,  half, // 2
        -half,  half,  half, // 3
        // Back face
        -half, -half, -half, // 4
         half, -half, -half, // 5
         half,  half, -half, // 6
        -half,  half, -half, // 7
    ];

    // Indices defining the 12 edges
    const lines = [
        0, 1, 1, 2, 2, 3, 3, 0, // Front face edges
        4, 5, 5, 6, 6, 7, 7, 4, // Back face edges
        0, 4, 1, 5, 2, 6, 3, 7  // Connecting edges
    ];
    
    return { vertices, lines, numVertices: 8 };
}

function drawDebugVertices(modelMatrix, geometry) {
    // 1. Prepare Vertex Buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);

    // 2. Use a simple point shader (Assumed to be defined elsewhere)
    // gl.useProgram(pointShaderProgram); 

    // 3. Set Uniforms (MVP matrix, point size, color)
    // gl.uniformMatrix4fv(location_MVP, false, MVP_matrix); 
    // gl.uniform1f(location_PointSize, 5.0); 
    // gl.uniform4fv(location_Color, [1.0, 0.0, 0.0, 1.0]); // Red

    // 4. Bind Attribute (position)
    // gl.vertexAttribPointer(attrib_Position, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(attrib_Position);

    // 5. Draw
    gl.drawArrays(gl.POINTS, 0, geometry.numVertices);

    // 6. Cleanup (Good practice)
    // gl.bindBuffer(gl.ARRAY_BUFFER, null); 
}

function drawDebugLines(modelMatrix, geometry) {
    // 1. Prepare Index Buffer (EBO)
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.lines), gl.STATIC_DRAW);
    
    // 2. Prepare Vertex Buffer (same as before)
    // Bind and set vertexBuffer data for positions...

    // 3. Use a simple line shader (Assumed to be defined elsewhere)
    // gl.useProgram(lineShaderProgram); 

    // 4. Set Uniforms (MVP matrix, color)
    // gl.uniformMatrix4fv(location_MVP, false, MVP_matrix); 
    // gl.uniform4fv(location_Color, [0.0, 1.0, 0.0, 1.0]); // Green

    // 5. Draw
    // Note: GL_LINES draws pairs of vertices (e.g., 0-1, 1-2, etc.)
    gl.drawElements(gl.LINES, geometry.lines.length, gl.UNSIGNED_SHORT, 0);

    // 6. Cleanup 
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
