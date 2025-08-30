// Ensure the script runs after the document is loaded
window.onload = function() {
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported!');
        return;
    }

    // --- 1. SHADERS (GLSL Code) ---
    // Vertex shader: calculates the position of each vertex
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

    // Fragment shader: determines the color of each pixel
    const fsSource = `
        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    // --- 2. SHADER PROGRAM SETUP ---
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

    // --- 3. GEOMETRY BUFFERS ---
    function initBuffers(gl) {
        // CAR (a colorful cube)
        const carPositions = [
            // Front face
            -0.5, -0.25, 0.5, 0.5, -0.25, 0.5, 0.5, 0.25, 0.5, -0.5, 0.25, 0.5,
            // Back face
            -0.5, -0.25, -0.5, -0.5, 0.25, -0.5, 0.5, 0.25, -0.5, 0.5, -0.25, -0.5,
            // Other faces omitted for brevity, but a full cube needs 6 faces
        ];
        // For simplicity, we create a simple elongated box for the car body
        const carVertices = [
            // Front face (red)
            -1.0, -0.5,  0.5,  1.0,  0.5,  0.5,  1.0, -0.5,  0.5, -1.0, -0.5,  0.5,  1.0,  0.5,  0.5, -1.0,  0.5,  0.5,
            // Back face (green)
            -1.0, -0.5, -0.5, -1.0,  0.5, -0.5,  1.0,  0.5, -0.5, -1.0, -0.5, -0.5,  1.0,  0.5, -0.5,  1.0, -0.5, -0.5,
            // Top face (blue)
            -1.0,  0.5, -0.5, -1.0,  0.5,  0.5,  1.0,  0.5,  0.5, -1.0,  0.5, -0.5,  1.0,  0.5,  0.5,  1.0,  0.5, -0.5,
            // Bottom face (yellow)
            -1.0, -0.5, -0.5,  1.0, -0.5, -0.5,  1.0, -0.5,  0.5, -1.0, -0.5, -0.5,  1.0, -0.5,  0.5, -1.0, -0.5,  0.5,
            // Right face (magenta)
             1.0, -0.5, -0.5,  1.0,  0.5, -0.5,  1.0,  0.5,  0.5,  1.0, -0.5, -0.5,  1.0,  0.5,  0.5,  1.0, -0.5,  0.5,
            // Left face (cyan)
            -1.0, -0.5, -0.5, -1.0, -0.5,  0.5, -1.0,  0.5,  0.5, -1.0, -0.5, -0.5, -1.0,  0.5,  0.5, -1.0,  0.5, -0.5,
        ];

        const carPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, carPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(carVertices), gl.STATIC_DRAW);
        
        const carColors = [
            // Face colors
            ...[1,0,0,1], ...[1,0,0,1], ...[1,0,0,1], ...[1,0,0,1], ...[1,0,0,1], ...[1,0,0,1], // Red
            ...[0,1,0,1], ...[0,1,0,1], ...[0,1,0,1], ...[0,1,0,1], ...[0,1,0,1], ...[0,1,0,1], // Green
            ...[0,0,1,1], ...[0,0,1,1], ...[0,0,1,1], ...[0,0,1,1], ...[0,0,1,1], ...[0,0,1,1], // Blue
            ...[1,1,0,1], ...[1,1,0,1], ...[1,1,0,1], ...[1,1,0,1], ...[1,1,0,1], ...[1,1,0,1], // Yellow
            ...[1,0,1,1], ...[1,0,1,1], ...[1,0,1,1], ...[1,0,1,1], ...[1,0,1,1], ...[1,0,1,1], // Magenta
            ...[0,1,1,1], ...[0,1,1,1], ...[0,1,1,1], ...[0,1,1,1], ...[0,1,1,1], ...[0,1,1,1], // Cyan
        ];
        const carColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, carColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(carColors), gl.STATIC_DRAW);


        // GROUND (a large flat plane)
        const groundPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, groundPositionBuffer);
        const groundVertices = [
            -50.0, -0.5, -50.0,
             50.0, -0.5, -50.0,
             50.0, -0.5,  50.0,
            -50.0, -0.5,  50.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices), gl.STATIC_DRAW);

        const groundColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, groundColorBuffer);
        const groundColors = [
            0.3, 0.3, 0.3, 1.0,
            0.3, 0.3, 0.3, 1.0,
            0.3, 0.3, 0.3, 1.0,
            0.3, 0.3, 0.3, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundColors), gl.STATIC_DRAW);
        
        const groundIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
        const groundIndices = [0, 1, 2, 0, 2, 3];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(groundIndices), gl.STATIC_DRAW);


        return {
            car: { position: carPositionBuffer, color: carColorBuffer, vertices: carVertices.length / 3 },
            ground: { position: groundPositionBuffer, color: groundColorBuffer, indices: groundIndexBuffer, vertices: groundIndices.length },
        };
    }

    // --- 4. GAME STATE AND INPUT ---
    const carState = {
        x: 0,
        z: 0,
        yAngle: 0,
        speed: 0,
    };

    const inputState = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp': inputState.up = true; break;
            case 'ArrowDown': inputState.down = true; break;
            case 'ArrowLeft': inputState.left = true; break;
            case 'ArrowRight': inputState.right = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowUp': inputState.up = false; break;
            case 'ArrowDown': inputState.down = false; break;
            case 'ArrowLeft': inputState.left = false; break;
            case 'ArrowRight': inputState.right = false; break;
        }
    });

    // --- 5. GAME LOOP & DRAWING ---
    const buffers = initBuffers(gl);
    let then = 0;

    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        updateGameState(deltaTime);
        drawScene(gl, programInfo, buffers, carState);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function updateGameState(deltaTime) {
        const acceleration = 0.1;
        const deceleration = 0.05;
        const maxSpeed = 20.0;
        const turnSpeed = 2.5; // radians per second
        const friction = 0.98; // Multiplier to slow down the car

        // Acceleration and Braking
        if (inputState.up) {
            carState.speed += acceleration;
        }
        if (inputState.down) {
            carState.speed -= deceleration;
        }
        
        // Cap speed
        if (carState.speed > maxSpeed) carState.speed = maxSpeed;
        if (carState.speed < -maxSpeed / 2) carState.speed = -maxSpeed / 2;

        // Steering (only when moving)
        if (carState.speed !== 0) {
            const turnDirection = carState.speed > 0 ? 1 : -1;
            if (inputState.left) {
                carState.yAngle += turnSpeed * deltaTime * turnDirection;
            }
            if (inputState.right) {
                carState.yAngle -= turnSpeed * deltaTime * turnDirection;
            }
        }
        
        // Apply friction
        carState.speed *= friction;
        if (Math.abs(carState.speed) < 0.01) {
            carState.speed = 0;
        }

        // Update position based on speed and angle
        carState.x -= Math.sin(carState.yAngle) * carState.speed * deltaTime;
        carState.z -= Math.cos(carState.yAngle) * carState.speed * deltaTime;
    }

    function drawScene(gl, programInfo, buffers, carState) {
        gl.clearColor(0.7, 0.8, 1.0, 1.0); // Light blue sky
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- Camera and Projection ---
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

        const viewMatrix = mat4.create();
        // Camera follows the car from a distance
        const cameraDistance = 15;
        const cameraHeight = 8;
        const cameraX = carState.x + cameraDistance * Math.sin(carState.yAngle);
        const cameraZ = carState.z + cameraDistance * Math.cos(carState.yAngle);
        mat4.lookAt(viewMatrix, [cameraX, cameraHeight, cameraZ], [carState.x, 0, carState.z], [0, 1, 0]);

        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

        // --- Draw the Ground ---
        const groundModelViewMatrix = mat4.create();
        mat4.multiply(groundModelViewMatrix, viewMatrix, groundModelViewMatrix); // Apply view
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, groundModelViewMatrix);
        
        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ground.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ground.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.ground.indices);
        gl.drawElements(gl.TRIANGLES, buffers.ground.vertices, gl.UNSIGNED_SHORT, 0);

        // --- Draw the Car ---
        const carModelMatrix = mat4.create();
        mat4.translate(carModelMatrix, carModelMatrix, [carState.x, 0, carState.z]);
        mat4.rotate(carModelMatrix, carModelMatrix, carState.yAngle, [0, 1, 0]); // Rotate around Y axis
        
        const carModelViewMatrix = mat4.create();
        mat4.multiply(carModelViewMatrix, viewMatrix, carModelMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, carModelViewMatrix);
        
        // Bind car position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.car.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        // Bind car color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.car.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

        // Draw car
        gl.drawArrays(gl.TRIANGLES, 0, buffers.car.vertices);
    }
};
