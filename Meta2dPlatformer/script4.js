// Get the canvas element
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

// --- NEW: Handle Alpha Blending (Transparency) ---
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Define vertices (x, y, u, v)
// Note: u,v are texture coordinates (0 to 1)
const playerVertices = [
  -16, -16, 0, 0,
   16, -16, 1, 0,
   16,  16, 1, 1,
  -16,  16, 0, 1,
];

const terrainVertices = [
  -400, -32, 0, 0,
   400, -32, 1, 0,
   400,   0, 1, 1,
  -400,   0, 0, 1,
];

const platformVertices = [
  -64, -16, 0, 0,
   64, -16, 1, 0,
   64,   0, 1, 1,
  -64,   0, 0, 1,
];

function createVertexBuffer(vertices) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return buffer;
}

const playerBuffer = createVertexBuffer(playerVertices);
const terrainBuffer = createVertexBuffer(terrainVertices);
const platformBuffer = createVertexBuffer(platformVertices);

function loadTexture(src) {
  const texture = gl.createTexture();
  // Set a temporary blue pixel so something renders immediately while image loads
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // WebGL1 needs these settings for non-power-of-2 images
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  image.src = src;
  return texture;
}

// Make sure these files exist in your folder!
const playerTexture = loadTexture('player.png');
const terrainTexture = loadTexture('terrain.png');
const platformTexture = loadTexture('platform.png');

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, document.getElementById('vertex-shader').textContent);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, document.getElementById('fragment-shader').textContent);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'a_position');
const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
const textureLocation = gl.getUniformLocation(program, 'u_texture');

// Set player start position (Centered)
let playerX = canvas.width / 2; 
let playerY = canvas.height / 2;
let playerSpeed = 3;

// Helper to set up attributes for the current buffer
function setupAttributes(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
}

function draw() {
  // Clear to transparent (or sky blue defined in CSS)
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  // Update Resolution Uniform
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // --- Draw Terrain ---
  setupAttributes(terrainBuffer);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
  gl.uniform1i(textureLocation, 0);
  
  // Position: Center bottom
  const terrainMatrix = [
    1, 0, 0,
    0, 1, 0,
    canvas.width / 2, canvas.height - 32, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, terrainMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // --- Draw Platform ---
  setupAttributes(platformBuffer);
  gl.bindTexture(gl.TEXTURE_2D, platformTexture);
  
  // Position: Arbitrary platform location
  const platformMatrix = [
    1, 0, 0,
    0, 1, 0,
    200, canvas.height / 2 + 50, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, platformMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // --- Draw Player ---
  setupAttributes(playerBuffer);
  gl.bindTexture(gl.TEXTURE_2D, playerTexture);
  
  // Position: Player variables
  const playerMatrix = [
    1, 0, 0,
    0, 1, 0,
    playerX, playerY, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, playerMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(draw);
}

// Start the loop
draw();

// Handle keyboard input
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Input logic inside a loop is smoother than direct event listeners
function updatePhysics() {
    if (keys['ArrowLeft']) playerX -= playerSpeed;
    if (keys['ArrowRight']) playerX += playerSpeed;
    if (keys['ArrowUp']) playerY -= playerSpeed;
    if (keys['ArrowDown']) playerY += playerSpeed;
    requestAnimationFrame(updatePhysics);
}
updatePhysics();
