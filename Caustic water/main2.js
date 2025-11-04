// main.js
'use strict';

// Ensure gl-matrix is loaded
const { mat4, vec3 } = window;

async function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported!');
        return;
    }

    // --- Shader Sources (for simplicity, we'll keep them here) ---
    // In a real app, you'd fetch these from files or script tags
    const causticsVS = `// In a file or script tag, e.g., id="caustics-vs"
attribute vec3 a_position;
uniform mat4 u_lightProjectionMatrix;
uniform mat4 u_lightViewMatrix;
uniform float u_time;

varying vec3 v_worldPosition;

// Simple noise function to create waves
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    v_worldPosition = a_position;
    // Displace vertices to create waves
    float height = noise(a_position.xz * 0.1 + u_time * 0.1) * 0.2;
    v_worldPosition.y += height;

    gl_Position = u_lightProjectionMatrix * u_lightViewMatrix * vec4(v_worldPosition, 1.0);
}`;
    const causticsFS = `// In a file or script tag, e.g., id="caustics-fs"
precision mediump float;

varying vec3 v_worldPosition;
uniform float u_time;

// Noise function to get normals
vec3 getNormal(vec2 p) {
    float h1 = fract(sin(dot(p + vec2(0.01, 0.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.2;
    float h2 = fract(sin(dot(p + vec2(0.0, 0.01), vec2(12.9898, 78.233))) * 43758.5453) * 0.2;
    vec3 normal = normalize(vec3(h1 - v_worldPosition.y, 0.02, h2 - v_worldPosition.y));
    return normal;
}

void main() {
    // Calculate perturbed normal for refraction
    vec3 normal = getNormal(v_worldPosition.xz * 0.1 + u_time * 0.1);
    
    // Calculate refracted light direction (simplified)
    // eta is the ratio of refractive indices (air to water ~ 1.0 / 1.33)
    float eta = 0.75;
    vec3 refracted = refract(normalize(vec3(0.0, -1.0, 0.0)), normal, eta);

    // Project this refracted vector onto the floor (at y = -1)
    float t = (-1.0 - v_worldPosition.y) / refracted.y;
    vec3 projectedPos = v_worldPosition + refracted * t;

    // Output the projected position as a color to store in the texture
    // We scale and bias to fit into the 0.0-1.0 color range
    gl_FragColor = vec4(projectedPos.xz * 0.1 + 0.5, 0.0, 1.0);
}`;
    const sceneVS = `// In a file or script tag, e.g., id="scene-vs"
attribute vec4 a_position;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying vec3 v_position;

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
  v_position = a_position.xyz;
}`;
    const floorFS = `// In a file or script tag, e.g., id="floor-fs"
precision mediump float;
uniform sampler2D u_causticsTexture;
uniform mat4 u_lightProjectionMatrix;
uniform mat4 u_lightViewMatrix;

varying vec3 v_position;

void main() {
    // Project current fragment position into light space
    vec4 lightSpacePos = u_lightProjectionMatrix * u_lightViewMatrix * vec4(v_position, 1.0);
    vec3 lightSpaceNDC = lightSpacePos.xyz / lightSpacePos.w;
    vec2 lightSpaceUV = lightSpaceNDC.xy * 0.5 + 0.5;

    // Sample the caustics texture
    float caustic = texture2D(u_causticsTexture, lightSpaceUV).a;
    
    // A simple blue floor color, brightened by the caustic value
    vec3 floorColor = vec3(0.1, 0.3, 0.7);
    gl_FragColor = vec4(floorColor + caustic * 0.8, 1.0);
}`;
    // (You would also need shaders for the water surface itself)

    // --- Compile Shaders and Link Programs ---
    const causticsProgram = createProgram(gl, causticsVS, causticsFS);
    const floorProgram = createProgram(gl, sceneVS, floorFS);

    // --- Get Shader Locations ---
    const causticsLocations = {
        position: gl.getAttribLocation(causticsProgram, 'a_position'),
        lightViewMatrix: gl.getUniformLocation(causticsProgram, 'u_lightViewMatrix'),
        lightProjectionMatrix: gl.getUniformLocation(causticsProgram, 'u_lightProjectionMatrix'),
        time: gl.getUniformLocation(causticsProgram, 'u_time'),
    };
    const floorLocations = {
        position: gl.getAttribLocation(floorProgram, 'a_position'),
        modelViewMatrix: gl.getUniformLocation(floorProgram, 'u_modelViewMatrix'),
        projectionMatrix: gl.getUniformLocation(floorProgram, 'u_projectionMatrix'),
        causticsTexture: gl.getUniformLocation(floorProgram, 'u_causticsTexture'),
        lightViewMatrix: gl.getUniformLocation(floorProgram, 'u_lightViewMatrix'),
        lightProjectionMatrix: gl.getUniformLocation(floorProgram, 'u_lightProjectionMatrix'),
    };
    
    // --- Create Geometry (a simple plane) ---
    const planeBuffer = createPlaneBuffer(gl);

    // --- Create Framebuffer for Caustics Pass ---
    const causticsFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, causticsFramebuffer);

    const causticsTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, causticsTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, causticsTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // --- Matrices ---
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 2, 5], [0, 0, 0], [0, 1, 0]);

    const lightPosition = [0, 5, 0];
    const lightViewMatrix = mat4.create();
    mat4.lookAt(lightViewMatrix, lightPosition, [0, 0, 0], [0, 0, -1]);
    
    const lightProjectionMatrix = mat4.create();
    mat4.ortho(lightProjectionMatrix, -5, 5, -5, 5, 0.1, 20);


    // --- Render Loop ---
    let then = 0;
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;
        
        // --- PASS 1: Render Caustics to Framebuffer ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, causticsFramebuffer);
        gl.viewport(0, 0, 512, 512);
        gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to transparent black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(causticsProgram);
        gl.uniformMatrix4fv(causticsLocations.lightViewMatrix, false, lightViewMatrix);
        gl.uniformMatrix4fv(causticsLocations.lightProjectionMatrix, false, lightProjectionMatrix);
        gl.uniform1f(causticsLocations.time, now);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);
        gl.vertexAttribPointer(causticsLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(causticsLocations.position);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw the water surface from light's view

        // --- PASS 2: Render Scene to Canvas ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.1, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw the floor
        gl.useProgram(floorProgram);
        const floorModelMatrix = mat4.create();
        mat4.translate(floorModelMatrix, floorModelMatrix, [0, -1, 0]); // Position floor
        mat4.scale(floorModelMatrix, floorModelMatrix, [5, 5, 5]);
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, floorModelMatrix);

        gl.uniformMatrix4fv(floorLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(floorLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(floorLocations.lightViewMatrix, false, lightViewMatrix);
        gl.uniformMatrix4fv(floorLocations.lightProjectionMatrix, false, lightProjectionMatrix);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, causticsTexture);
        gl.uniform1i(floorLocations.causticsTexture, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);
        gl.vertexAttribPointer(floorLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(floorLocations.position);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // (Here you would also draw the water surface itself using its own shaders)

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// --- Helper Functions ---
function createProgram(gl, vsSource, fsSource) {
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

function createPlaneBuffer(gl) {
    const positions = [
        //-1, 0, -1,  1, 0, -1,  -1, 0, 1,
        //-1, 0, 1,   1, 0, -1,   1, 0, 1,
		-5, 0, -5,  5, 0, -5,  -5, 0, 5,
        -5, 0, 5,   5, 0, -5,   5, 0, 5,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

main();
