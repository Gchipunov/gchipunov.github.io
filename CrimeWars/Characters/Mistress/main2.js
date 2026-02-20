const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

let programInfo;
let buffers;
let startTime = Date.now();

function initWebGL() {
    if (!gl) {
        alert("WebGL not supported.");
        return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 1. Compile Shaders and Link Program
    const vsSource = document.getElementById('vertex-shader').text;
    const fsSource = document.getElementById('fragment-shader').text;
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // 2. Look up locations for attributes and uniforms
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            position: gl.getAttribLocation(shaderProgram, 'a_position'),
        },
        uniformLocations: {
            u_time: gl.getUniformLocation(shaderProgram, 'u_time'),
            u_resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        },
    };

    // 3. Create the Quad Buffer
    buffers = initBuffers(gl);

    // 4. Start the render loop
    requestAnimationFrame(render);
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Two triangles to make a quad covering clip space (-1 to +1)
    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
        -1.0, -1.0,
         1.0,  1.0,
         1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return { position: positionBuffer };
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

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
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function render() {
    const currentTime = (Date.now() - startTime) / 1000.0;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use Program
    gl.useProgram(programInfo.program);

    // Bind the position buffer and point the attribute to it
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.position);

    // Update Uniforms
    gl.uniform1f(programInfo.uniformLocations.u_time, currentTime);
    gl.uniform2f(programInfo.uniformLocations.u_resolution, canvas.width, canvas.height);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Loop
    requestAnimationFrame(render);
}

initWebGL();
