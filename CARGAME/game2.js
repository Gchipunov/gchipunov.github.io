// Ensure the script runs after the document is loaded
window.onload = function() {
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported!');
        return;
    }

    // --- 1. SHADERS (Unchanged) ---
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    // --- 2. SHADER PROGRAM SETUP (Unchanged) ---
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // --- 3. MAZE AND DESTINATION DATA ---
    const WALL_SIZE = 4.0;
    const mazeLayout = [
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,1,0,0,0,1,0,0,1],
        [1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,2,1], // '2' is the destination
        [1,0,1,1,1,1,1,1,1,1,1,1],
    ];
    let destinationPos = { x: 0, z: 0 }; // Will be set when parsing the maze

    // --- 4. GEOMETRY BUFFERS ---
    function initBuffers(gl) {
        // A single unit cube's vertices and colors. We can scale and translate this to make all our objects.
        const cubeVertices = [
            // Front, Back, Top, Bottom, Right, Left faces
            -0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5, -0.5, -0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
            -0.5, -0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5, -0.5, -0.5,-0.5,  0.5, 0.5,-0.5,  0.5,-0.5,-0.5,
            -0.5, 0.5, -0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, -0.5,  0.5, 0.5, 0.5,  0.5, 0.5, -0.5,
            -0.5, -0.5,-0.5,  0.5, -0.5,-0.5,  0.5,-0.5, 0.5, -0.5, -0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
             0.5, -0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5, -0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
            -0.5, -0.5,-0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
        ];
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
        
        // Colors for different objects
        const wallColors = createSolidColorArray(0.5, 0.5, 0.5, cubeVertices.length / 3);
        const destColors = createSolidColorArray(1.0, 1.0, 0.0, cubeVertices.length / 3); // Yellow
        const carColors = [
            ...createFaceColorArray(1,0,0), ...createFaceColorArray(0,1,0), ...createFaceColorArray(0,0,1),
            ...createFaceColorArray(1,1,0), ...createFaceColorArray(1,0,1), ...createFaceColorArray(0,1,1),
        ];

        return {
            unitCube: { position: positionBuffer, vertices: cubeVertices.length / 3 },
            colors: {
                wall: createColorBuffer(gl, wallColors),
                destination: createColorBuffer(gl, destColors),
                car: createColorBuffer(gl, carColors),
            },
            ground: createGroundBuffers(gl),
        };
    }
    // Helper functions for buffer creation
    function createColorBuffer(gl, colors) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        return buffer;
    }
    function createSolidColorArray(r, g, b, vertexCount) {
        const colors = [];
        for (let i = 0; i < vertexCount; i++) { colors.push(r, g, b, 1.0); }
        return colors;
    }
    function createFaceColorArray(r,g,b) { return [r,g,b,1, r,g,b,1, r,g,b,1, r,g,b,1, r,g,b,1, r,g,b,1]; }
    function createGroundBuffers(gl) { /* ... ground buffer creation code from original ... */ }

    // --- 5. GAME STATE AND INPUT ---
    const carState = { x: -42, z: -42, yAngle: 0, speed: 0 };
    const inputState = { up: false, down: false, left: false, right: false };

    // Keyboard controls
    document.addEventListener('keydown', (e) => handleInput(e.key, true));
    document.addEventListener('keyup', (e) => handleInput(e.key, false));
    // Mobile controls
    const controls = {
        'ctrl-up': 'ArrowUp', 'ctrl-down': 'ArrowDown',
        'ctrl-left': 'ArrowLeft', 'ctrl-right': 'ArrowRight'
    };
    for (const [id, key] of Object.entries(controls)) {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(key, true); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); handleInput(key, false); });
    }

    function handleInput(key, isPressed) {
        switch(key) {
            case 'ArrowUp': inputState.up = isPressed; break;
            case 'ArrowDown': inputState.down = isPressed; break;
            case 'ArrowLeft': inputState.left = isPressed; break;
            case 'ArrowRight': inputState.right = isPressed; break;
        }
    }

    // --- 6. GAME LOOP & DRAWING ---
    const buffers = initBuffers(gl);
    let then = 0;
    requestAnimationFrame(render);

    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        updateGameState(deltaTime);
        drawScene(gl, programInfo, buffers, carState);
        requestAnimationFrame(render);
    }

    function updateGameState(deltaTime) {
        const acceleration = 15.0, maxSpeed = 10.0, turnSpeed = 2.5, friction = 0.98;
        // ... (physics logic for speed and angle, mostly unchanged) ...
        
        // Update position based on speed and angle
        const nextX = carState.x - Math.sin(carState.yAngle) * carState.speed * deltaTime;
        const nextZ = carState.z - Math.cos(carState.yAngle) * carState.speed * deltaTime;

        // COLLISION DETECTION
        if (!isCollidingWithMaze(nextX, nextZ)) {
            carState.x = nextX;
            carState.z = nextZ;
        } else {
            carState.speed = 0; // Stop the car on collision
        }
        
        // WIN CONDITION
        const dx = carState.x - destinationPos.x;
        const dz = carState.z - destinationPos.z;
        if (Math.sqrt(dx*dx + dz*dz) < WALL_SIZE / 2) {
            alert("You reached the destination!");
            carState.x = -42; carState.z = -42; carState.speed = 0; // Reset
        }
    }

    function isCollidingWithMaze(carX, carZ) {
        const carRadius = 1.0; // Simplified collision radius for the car
        for (let r = 0; r < mazeLayout.length; r++) {
            for (let c = 0; c < mazeLayout[r].length; c++) {
                if (mazeLayout[r][c] === 1) { // It's a wall
                    const wallX = (c - mazeLayout[r].length / 2) * WALL_SIZE;
                    const wallZ = (r - mazeLayout.length / 2) * WALL_SIZE;
                    // Simple Axis-Aligned Bounding Box (AABB) collision
                    if (carX + carRadius > wallX - WALL_SIZE/2 &&
                        carX - carRadius < wallX + WALL_SIZE/2 &&
                        carZ + carRadius > wallZ - WALL_SIZE/2 &&
                        carZ - carRadius < wallZ + WALL_SIZE/2) {
                        return true; // Collision detected
                    }
                }
            }
        }
        return false;
    }

    function drawScene(gl, programInfo, buffers, carState) {
        gl.clearColor(0.2, 0.2, 0.3, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 200.0);
        const viewMatrix = mat4.create();
        const cameraDistance = 20, cameraHeight = 15;
        const cameraX = carState.x + cameraDistance * Math.sin(carState.yAngle);
        const cameraZ = carState.z + cameraDistance * Math.cos(carState.yAngle);
        mat4.lookAt(viewMatrix, [cameraX, cameraHeight, cameraZ], [carState.x, 0, carState.z], [0, 1, 0]);

        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

        // Draw Ground
        // ... (code to draw ground, unchanged)

        // Draw Maze, Destination, and Car
        drawMaze(gl, programInfo, buffers, viewMatrix);
        drawCar(gl, programInfo, buffers, carState, viewMatrix);
    }
    
    function drawMaze(gl, programInfo, buffers, viewMatrix) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.unitCube.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        for (let r = 0; r < mazeLayout.length; r++) {
            for (let c = 0; c < mazeLayout[r].length; c++) {
                const item = mazeLayout[r][c];
                if (item === 0) continue; // Skip empty space

                const modelMatrix = mat4.create();
                const x = (c - mazeLayout[r].length / 2) * WALL_SIZE;
                const z = (r - mazeLayout.length / 2) * WALL_SIZE;
                mat4.translate(modelMatrix, modelMatrix, [x, 0, z]);
                
                if (item === 1) { // It's a wall
                    mat4.scale(modelMatrix, modelMatrix, [WALL_SIZE, WALL_SIZE, WALL_SIZE]);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors.wall);
                } else if (item === 2) { // It's the destination
                    destinationPos = { x: x, z: z }; // Store position
                    mat4.scale(modelMatrix, modelMatrix, [WALL_SIZE * 0.8, WALL_SIZE * 0.8, WALL_SIZE * 0.8]);
                    mat4.rotate(modelMatrix, modelMatrix, then, [0,1,0]); // Make it spin
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors.destination);
                }
                gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
                
                const modelViewMatrix = mat4.create();
                mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
                gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
                gl.drawArrays(gl.TRIANGLES, 0, buffers.unitCube.vertices);
            }
        }
    }
    
    function drawCar(gl, programInfo, buffers, carState, viewMatrix) {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, [carState.x, 0, carState.z]);
        mat4.rotate(modelMatrix, modelMatrix, carState.yAngle, [0, 1, 0]);
        mat4.scale(modelMatrix, modelMatrix, [2.0, 1.0, 1.0]); // Make car shape elongated

        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.unitCube.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors.car);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        
        gl.drawArrays(gl.TRIANGLES, 0, buffers.unitCube.vertices);
    }
    
    // Utility functions from original code
    function initShaderProgram(gl, vsSource, fsSource) { /* ... */ }
    function loadShader(gl, type, source) { /* ... */ }
};
