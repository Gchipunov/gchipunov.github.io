;(function(){
  "use strict"
  window.addEventListener("load", setupWebGL, false);

  function render(gl, program, timeUniformLocation, startTime) {
    let currentTime = (performance.now() - startTime) / 1000; // Convert to seconds
    gl.uniform1f(timeUniformLocation, currentTime);
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas each frame
    gl.drawArrays(gl.TRIANGLES, 0, 24); // Draw 24 vertices (4 quads * 6 vertices each)
    requestAnimationFrame(() => render(gl, program, timeUniformLocation, startTime));
  }

  function setupWebGL(evt) {
    window.removeEventListener(evt.type, setupWebGL, false);
    var gl = getRenderingContext();
    if (!gl) return;

    // Vertex shader: Simple pass-through with time-based animation
    var vertexShaderSource = `
      attribute vec4 a_position;
      attribute float a_type;
      uniform float time;
      void main() {
        // Example animation: slightly offset positions based on time
        vec2 animatedPos = a_position.xy + vec2(sin(time) * 0.1, cos(time) * 0.1);
        gl_Position = vec4(animatedPos, 0.0, 1.0);
      }
    `;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    // Fragment shader: Simple color (e.g., red)
    var fragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
      }
    `;
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var linkErrLog = gl.getProgramInfoLog(program);
      cleanup(gl, program);
      document.querySelector("p").innerHTML = 
        "Shader program did not link successfully. "
        + "Error log: " + linkErrLog;
      return;
    } 
    initializeAttributes(gl, program);
    gl.useProgram(program);

    var timeUniformLocation = gl.getUniformLocation(program, 'time');
    var startTime = performance.now();
    render(gl, program, timeUniformLocation, startTime);
  }

  function initializeAttributes(gl, program) {
    gl.enableVertexAttribArray(0);
    var buffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Define vertices for 4 quads (each quad is 2 triangles, 6 vertices)
    // Quad positions in clip space (-1 to 1)
   var quadtypes = { 0.0,0.0,0.0,0.0,0.0,0.0
     ,
                    1.0,1.0,1.0,1.0,1.0,1.0,
                    2.0,2.0,2.0,2.0,2.0,2.0,
                    3.0,3.0,3.0,3.0,3.0,3.0 };
    
                      
    const quadVertices = new Float32Array([
      // Quad 1 (top-left)
      -0.8,  0.8,  // top-left
      -0.8,  0.4,  // bottom-left
      -0.4,  0.8,  // top-right
      -0.8,  0.4,  // bottom-left
      -0.4,  0.4,  // bottom-right
      -0.4,  0.8,  // top-right

      // Quad 2 (top-right)
       0.4,  0.8,  // top-left
       0.4,  0.4,  // bottom-left
       0.8,  0.8,  // top-right
       0.4,  0.4,  // bottom-left
       0.8,  0.4,  // bottom-right
       0.8,  0.8,  // top-right

      // Quad 3 (bottom-left)
      -0.8, -0.4,  // top-left
      -0.8, -0.8,  // bottom-left
      -0.4, -0.4,  // top-right
      -0.8, -0.8,  // bottom-left
      -0.4, -0.8,  // bottom-right
      -0.4, -0.4,  // top-right

      // Quad 4 (bottom-right)
       0.4, -0.4,  // top-left
       0.4, -0.8,  // bottom-left
       0.8, -0.4,  // top-right
       0.4, -0.8,  // bottom-left
       0.8, -0.8,  // bottom-right
       0.8, -0.4   // top-right
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  function cleanup(gl, program, buffer) {
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
