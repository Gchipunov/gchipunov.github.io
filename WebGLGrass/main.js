window.onload = function() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported!');
        return;
    }

    // Check for instancing support
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
        alert('Instancing not supported!');
        return;
    }

    // --- Shader Compilation ---
    const vsSource = document.getElementById('vertex-shader').text;
    const fsSource = document.getElementById('fragment-shader').text;
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            position: gl.getAttribLocation(shaderProgram, 'a_position'),
            texcoord: gl.getAttribLocation(shaderProgram, 'a_texcoord'),
            offset: gl.getAttribLocation(shaderProgram, 'a_offset'),
            rotation: gl.getAttribLocation(shaderProgram, 'a_rotation'),
            height: gl.getAttribLocation(shaderProgram, 'a_height'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'u_projection'),
            view: gl.getUniformLocation(shaderProgram, 'u_view'),
            time: gl.getUniformLocation(shaderProgram, 'u_time'),
        },
    };

    // --- Geometry & Instance Data ---
    const buffers = initBuffers(gl, programInfo);
    const numInstances = 50000; // Number of grass blades

    // --- Render Loop ---
    let then = 0;
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, numInstances, now);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

// --- Helper Functions ---

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

function initBuffers(gl, programInfo) {
    // --- 1. Geometry of a single grass blade (a simple quad) ---
    // Two triangles that form a rectangle standing up.
    const positions = new Float32Array([
        // x,   y,    z
        -0.1, 0.0, 0.0, // Triangle 1
         0.1, 0.0, 0.0,
        -0.1, 1.0, 0.0,
        -0.1, 1.0, 0.0, // Triangle 2
         0.1, 0.0, 0.0,
         0.1, 1.0, 0.0,
    ]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Texture coordinates to control the color gradient
    const texcoords = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]);
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

    // --- 2. Data for each instance ---
    const numInstances = 50000;
    const fieldSize = 100;
    const offsets = new Float32Array(numInstances * 2);   // (x, z) position
    const rotations = new Float32Array(numInstances);     // y-rotation
    const heights = new Float32Array(numInstances);       // blade height

    for (let i = 0; i < numInstances; i++) {
        // Position on a plane
        offsets[i * 2 + 0] = (Math.random() - 0.5) * fieldSize; // x
        offsets[i * 2 + 1] = (Math.random() - 0.5) * fieldSize; // z

        // Random rotation
        rotations[i] = Math.random() * Math.PI * 2;

        // Random height
        heights[i] = 0.8 + Math.random() * 0.4; // between 0.8 and 1.2
    }

    const offsetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);

    const rotationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rotationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.STATIC_DRAW);
    
    const heightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, heightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, heights, gl.STATIC_DRAW);


    return {
        position: positionBuffer,
        texcoord: texcoordBuffer,
        offset: offsetBuffer,
        rotation: rotationBuffer,
        height: heightBuffer,
    };
}

function drawScene(gl, programInfo, buffers, numInstances, time) {
    // Canvas setup
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0); // Light blue sky
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    
    // Use our shader program
    gl.useProgram(programInfo.program);

    // --- Set up attributes ---
    const ext = gl.getExtension('ANGLE_instanced_arrays');

    // 1. Blade Vertex Positions (changes for each vertex)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.position);

    // 2. Blade Texcoords (changes for each vertex)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
    gl.vertexAttribPointer(programInfo.attribLocations.texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.texcoord);
    
    // 3. Instance Offsets (changes for each instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.offset);
    gl.vertexAttribPointer(programInfo.attribLocations.offset, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.offset);
    ext.vertexAttribDivisorANGLE(programInfo.attribLocations.offset, 1); // This is the magic for instancing!

    // 4. Instance Rotations
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.rotation);
    gl.vertexAttribPointer(programInfo.attribLocations.rotation, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.rotation);
    ext.vertexAttribDivisorANGLE(programInfo.attribLocations.rotation, 1);
    
    // 5. Instance Heights
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.height);
    gl.vertexAttribPointer(programInfo.attribLocations.height, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.height);
    ext.vertexAttribDivisorANGLE(programInfo.attribLocations.height, 1);


    // --- Set up uniforms (camera, etc.) ---
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 200.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 2, 10], [0, 0, -20], [0, 1, 0]); // Camera position, target, up

    gl.uniformMatrix4fv(programInfo.uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.view, false, viewMatrix);
    gl.uniform1f(programInfo.uniformLocations.time, time);

    // --- Draw Call ---
    ext.drawArraysInstancedANGLE(
        gl.TRIANGLES, // Draw triangles
        0,            // Start from vertex 0
        6,            // 6 vertices in our blade (2 triangles)
        numInstances  // Number of times to draw the blade
    );
}

// Minimal 4x4 matrix library (gl-matrix is a full-featured alternative)
const mat4 = {
    create: () => new Float32Array(16),
    perspective: (out, fov, aspect, near, far) => {
        const f = 1.0 / Math.tan(fov / 2);
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
    },
    lookAt: (out, eye, center, up) => {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0], eyey = eye[1], eyez = eye[2];
        let upx = up[0], upy = up[1], upz = up[2];
        let centerx = center[0], centery = center[1], centerz = center[2];
        z0 = eyex - centerx; z1 = eyey - centery; z2 = eyez - centerz;
        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len; z1 *= len; z2 *= len;
        x0 = upy * z2 - upz * z1; x1 = upz * z0 - upx * z2; x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) { x0 = 0; x1 = 0; x2 = 0; } else { len = 1 / len; x0 *= len; x1 *= len; x2 *= len; }
        y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) { y0 = 0; y1 = 0; y2 = 0; } else { len = 1 / len; y0 *= len; y1 *= len; y2 *= len; }
        out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
        out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
        out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
    }
};
