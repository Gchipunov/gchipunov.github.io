;(function(){
"use strict"
window.addEventListener("load", setupWebGL, false);
var gl,
  program;
let timeUniformLocation; // Declare globally or in a more accessible scope for render

function render() {
  let currentTime = (performance.now() - startTime) / 1000; // Convert to seconds
  gl.uniform1f(timeUniformLocation, currentTime);

  // Draw the first quad
  gl.drawArrays(gl.TRIANGLES, 0, 6); // 6 vertices for 2 triangles (1 quad)

  // To draw a second quad, you'd typically need to define its vertices
  // and potentially another buffer, or extend the existing buffer.
  // For simplicity, let's assume the second quad's vertices are appended
  // to the same buffer and we draw it by offsetting the start.
  // This assumes 12 vertices total (6 for first quad, 6 for second).
  gl.drawArrays(gl.TRIANGLES, 6, 6); // Draw the second quad, starting from the 7th vertex

  requestAnimationFrame(render);
}

var startTime; // Declare startTime globally

function setupWebGL (evt) {
  window.removeEventListener(evt.type, setupWebGL, false);
  if (!(gl = getRenderingContext()))
    return;

  var source = document.querySelector("#vertex-shader").innerHTML;
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader,source);
  gl.compileShader(vertexShader);
  source = document.querySelector("#fragment-shader").innerHTML
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader,source);
  gl.compileShader(fragmentShader);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var linkErrLog = gl.getProgramInfoLog(program);
    cleanup();
    document.querySelector("p").innerHTML =
      "Shader program did not link successfully. "
      + "Error log: " + linkErrLog;
    return;
  }
  initializeAttributes(); // Call this after program is linked
  gl.useProgram(program);

  // Get the time uniform location after the program is linked and used
  timeUniformLocation = gl.getUniformLocation(program, 'time');
  startTime = performance.now(); // Initialize startTime here

  gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw the first quad initially
  gl.drawArrays(gl.TRIANGLES, 6, 6); // Draw the second quad initially

  render(); // Start the animation loop
  // cleanup() is called after render, typically you wouldn't call it here
  // as it would delete resources needed for rendering.
}

var buffer;
function initializeAttributes() {
  gl.enableVertexAttribArray(0);
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Define vertices for two quads. Each quad needs 6 vertices to be drawn as two triangles.
  // A quad can be defined by 4 unique vertices, but for TRIANGLES mode, you repeat vertices.
  // Quad 1 (e.g., top-left, bottom-left, top-right, bottom-right)
  // Triangle 1: (x1, y1), (x2, y2), (x3, y3)
  // Triangle 2: (x1, y1), (x3, y3), (x4, y4) (or using different combinations)
  // For simplicity, let's just lay out 6 vertices per quad.

  // Vertices for Quad 1 (e.g., centered slightly left)
  const quad1Vertices = [
    // Triangle 1
    -0.8,  0.5,  // Top-left
    -0.8, -0.5,  // Bottom-left
    -0.2,  0.5,  // Top-right
    // Triangle 2
    -0.2,  0.5,  // Top-right (repeated)
    -0.8, -0.5,  // Bottom-left (repeated)
    -0.2, -0.5   // Bottom-right
  ];

  // Vertices for Quad 2 (e.g., centered slightly right)
  const quad2Vertices = [
    // Triangle 1
     0.2,  0.5,  // Top-left
     0.2, -0.5,  // Bottom-left
     0.8,  0.5,  // Top-right
    // Triangle 2
     0.8,  0.5,  // Top-right (repeated)
     0.2, -0.5,  // Bottom-left (repeated)
     0.8, -0.5   // Bottom-right
  ];

  // Combine the vertices for both quads
  const allVertices = quad1Vertices.concat(quad2Vertices);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allVertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

function cleanup() {
  gl.useProgram(null);
  if (buffer)
    gl.deleteBuffer(buffer);
  if (program)
    gl.deleteProgram(program);
}

function getRenderingContext() {
  var canvas = document.querySelector("canvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  var gl = canvas.getContext("webgl")
    || canvas.getContext("experimental-webgl");
  if (!gl) {
    var paragraph = document.querySelector("p");
    paragraph.innerHTML = "Failed to get WebGL context."
      + "Your browser or device may not support WebGL.";
    return null;
  }
  gl.viewport(0, 0,
    gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return gl;
}
})();
