// Get the canvas element
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

// Define vertices and texture coordinates for player, terrain, and platform
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

// Create vertex buffers
function createVertexBuffer(vertices) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return buffer;
}

const playerBuffer = createVertexBuffer(playerVertices);
const terrainBuffer = createVertexBuffer(terrainVertices);
const platformBuffer = createVertexBuffer(platformVertices);

// Load textures
function loadTexture(src) {
  const texture = gl.createTexture();
  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  image.src = src;
  return texture;
}

const playerTexture = loadTexture('player.png');
const terrainTexture = loadTexture('terrain.png');
const platformTexture = loadTexture('platform.png');

// Compile shaders
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, document.getElementById('vertex-shader').textContent);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, document.getElementById('fragment-shader').textContent);

// Create program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Define uniforms and attributes
const positionLocation = gl.getAttribLocation(program, 'a_position');
const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
const textureLocation = gl.getUniformLocation(program, 'u_texture');

// Set up player movement
let playerX = 0;
let playerY = 0;
let playerSpeed = 2;

// Main loop
function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Draw terrain
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
  gl.uniform1i(textureLocation, 0);
  const terrainMatrix = [
    1, 0, 0,
    0, 1, 0,
    0, canvas.height / 2 - 16, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, terrainMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // Draw platform
  gl.bindBuffer(gl.ARRAY_BUFFER, platformBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, platformTexture);
  gl.uniform1i(textureLocation, 0);
  const platformMatrix = [
    1, 0, 0,
    0, 1, 0,
    200, canvas.height / 2 - 64, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, platformMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // Draw player
  gl.bindBuffer(gl.ARRAY_BUFFER, playerBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, playerTexture);
  gl.uniform1i(textureLocation, 0);
  const playerMatrix = [
    1, 0, 0,
    0, 1, 0,
    playerX, playerY, 1
  ];
  gl.uniformMatrix3fv(matrixLocation, false, playerMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // Update player position
  if (playerX < canvas.width / 2) {
    playerX += playerSpeed;
  }

  requestAnimationFrame(draw);
}

draw();

// Handle keyboard input
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    playerX -= playerSpeed;
  } else if (event.key === 'ArrowRight') {
    playerX += playerSpeed;
  } else if (event.key === 'ArrowUp') {
    playerY -= playerSpeed;
  } else if (event.key === 'ArrowDown') {
    playerY += playerSpeed;
  }
});
