// --- Main Setup ---
const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL is not supported by your browser.');
}

// --- GLSL Shaders ---

// The Vertex Shader's job is to position the vertices of the shape.
// For this 2D effect, we just draw a rectangle that covers the whole screen.
const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

// The Fragment Shader's job is to color each pixel.
// This is where the PCB and lighting are simulated.
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;

    // --- Color Palette ---
    const vec3 BOARD_COLOR = vec3(0.05, 0.2, 0.15);
    const vec3 TRACE_COLOR = vec3(0.9, 0.7, 0.3);
    const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 0.95);

    // --- Signed Distance Functions (SDFs) ---
    // These functions return the shortest distance from a point to a shape.
    // A negative value means the point is inside the shape.

    // SDF for a circle
    float sdCircle(vec2 p, float r) {
        return length(p) - r;
    }

    // SDF for a line segment
    float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
    }

    // --- Scene Definition ---
    // This function defines the entire PCB layout by combining SDFs.
    float map_scene(vec2 uv) {
        float d = 1e5; // Initialize with a large distance

        // Central IC chip pads
        for (float i = -4.0; i <= 4.0; i++) {
            vec2 pos = vec2(i * 0.05, 0.1);
            d = min(d, sdCircle(uv - pos, 0.015)); // top pads
            d = min(d, sdCircle(uv + pos, 0.015)); // bottom pads
        }

        // Traces from pads
        d = min(d, sdSegment(uv, vec2(-0.2, -0.1), vec2(-0.4, -0.3)));
        d = min(d, sdSegment(uv, vec2(-0.15, -0.1), vec2(-0.2, -0.4)));
        d = min(d, sdSegment(uv, vec2(0.2, 0.1), vec2(0.4, 0.3)));
        d = min(d, sdSegment(uv, vec2(0.15, 0.1), vec2(0.2, 0.4)));
        d = min(d, sdSegment(uv, vec2(0.1, -0.1), vec2(0.0, -0.5)));

        // Some circular components
        d = min(d, sdCircle(uv - vec2(0.4, 0.3), 0.03));
        d = min(d, sdCircle(uv - vec2(-0.4, -0.3), 0.03));

        return d;
    }

    void main() {
        // Normalize coordinates to be aspect-ratio correct and centered at (0,0)
        vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
        vec2 mouse = (2.0 * u_mouse.xy - u_resolution.xy) / u_resolution.y;

        // 1. Get the distance to the nearest part of the PCB design
        float d = map_scene(uv);

        // 2. Determine the base color (board or trace)
        float trace_width = 0.01;
        float t = smoothstep(trace_width, trace_width - 0.005, d);
        vec3 base_color = mix(BOARD_COLOR, TRACE_COLOR, t);

        // 3. Calculate lighting
        float light_dist = length(uv - mouse);
        // Inverse square law for light falloff, with an ambient term
        float brightness = 0.1 + 0.8 / (1.0 + light_dist * light_dist * 8.0);
        vec3 final_color = base_color * brightness * LIGHT_COLOR;

        // 4. Set the final pixel color
        gl_FragColor = vec4(final_color, 1.0);
    }
`;


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

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// --- Initialization ---
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");
const timeUniformLocation = gl.getUniformLocation(program, "u_time");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// --- State Variables ---
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// --- Event Listeners ---
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = event.clientX - rect.left;
    // In WebGL, the y-axis is often inverted (0 is at the bottom)
    mousePos.y = rect.height - (event.clientY - rect.top) - 1;
});


// --- Render Loop ---
function render(time) {
    time *= 0.001; // convert time to seconds

    // Resize canvas to match display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Pass uniforms to the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y);
    gl.uniform1f(timeUniformLocation, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

// Start the animation
requestAnimationFrame(render);
