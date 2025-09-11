// --- Fake Data Generation (for a reinforcement learning model) ---
// Each data point will be [episode, cumulative_reward, loss]
// We'll normalize these values to fit in the WebGL coordinate system (-1 to 1)
function generateFakeRLData(numEpisodes) {
    const data = [];
    const maxReward = 1000;
    const minLoss = 0.01;
    const maxLoss = 5.0;

    for (let i = 0; i < numEpisodes; i++) {
        const episode = i;
        // Reward increases over time, with some noise
        const reward = Math.min(maxReward, i * 20 + Math.random() * 200 - 100);
        // Loss decreases over time, with some noise
        const loss = Math.max(minLoss, maxLoss - i * 0.05 + Math.random() * 0.5 - 0.25);
        data.push([episode, reward, loss]);
    }
    return data;
}

// --- Main WebGL Code ---
function main() {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    // Set canvas dimensions to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Compile shaders
    const vertexShaderSource = document.getElementById("vertex-shader").text;
    const fragmentShaderSource = document.getElementById("fragment-shader").text;
    const program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    
    // Get attribute and uniform locations
    const programInfo = {
        program: program,
        attribLocations: {
            position: gl.getAttribLocation(program, 'a_position'),
            color: gl.getAttribLocation(program, 'a_color'),
        },
        uniformLocations: {
            matrix: gl.getUniformLocation(program, 'u_matrix'),
        },
    };

    // Generate and prepare data
    const rawData = generateFakeRLData(200);
    const positions = [];
    const colors = [];

    // Normalize and color data
    const maxEpisode = rawData.length - 1;
    const maxReward = Math.max(...rawData.map(d => d[1]));
    const maxLoss = Math.max(...rawData.map(d => d[2]));

    for (const [episode, reward, loss] of rawData) {
        // Normalize positions to range [-1, 1]
        const x = (episode / maxEpisode) * 2 - 1;
        const y = (reward / maxReward) * 2 - 1;
        const z = (loss / maxLoss) * 2 - 1;
        positions.push(x, y, z);

        // Color based on reward (e.g., green for high reward, red for low)
        const normalizedReward = reward / maxReward;
        const r = 1.0 - normalizedReward; // More red for low reward
        const g = normalizedReward;       // More green for high reward
        const b = 0.0;
        colors.push(r, g, b);
    }

    // Create and bind buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    // Basic camera and rotation
    let rotation = 0;
    
    // Draw loop
    function render(now) {
        now *= 0.001; // convert to seconds
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // Compute a projection and model-view matrix (simplified)
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.perspective(mat4.create(), fieldOfView, aspect, zNear, zFar);
        
        let modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]); // Move back
        
        rotation += 0.005; // Auto-rotate
        mat4.rotateX(modelViewMatrix, modelViewMatrix, -0.5); // Tilt a bit
        mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation);

        // Combine into a single matrix
        const finalMatrix = mat4.create();
        mat4.multiply(finalMatrix, projectionMatrix, modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.matrix, false, finalMatrix);

        // Set up the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.position);

        // Set up the color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.color, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.color);

        // Draw the points
        gl.drawArrays(gl.POINTS, 0, positions.length / 3);

        requestAnimationFrame(render);
    }

    // Start the animation loop
    requestAnimationFrame(render);
}

// --- Shader and Matrix Utility Functions (would be in a separate file) ---

function initShaderProgram2(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}
function initShaderProgram(gl, vsSource, fsSource) {
    // ... (previous code)
const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    gl.linkProgram(shaderProgram);

    // Add error checking
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Add error checking
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Simplified Mat4 functions (e.g., from gl-matrix library)
const mat4 = {
    create: () => new Float32Array(16),
    perspective: (out, fovy, aspect, near, far) => {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0;
        out[10] = (near + far) / (near - far);
        out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
        return out;
    },
    translate: (out, a, v) => {
        let x = v[0], y = v[1], z = v[2];
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
        return out;
    },
    rotateX: (out, a, rad) => {
        let s = Math.sin(rad), c = Math.cos(rad);
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        return out;
    },
    rotateY: (out, a, rad) => {
        let s = Math.sin(rad), c = Math.cos(rad);
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        return out;
    },
    multiply: (out, a, b) => {
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    }
};

window.onload = main;
