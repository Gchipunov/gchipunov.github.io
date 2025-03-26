;(function(){
  "use strict"
  window.addEventListener("load", setupWebGL, false);

  function render(gl, program, timeUniformLocation, startTime) {
    let currentTime = (performance.now() - startTime) / 1000; // Convert to seconds
    gl.uniform1f(timeUniformLocation, currentTime);
    gl.drawArrays(gl.POINTS, 0, 1);
    // Rest of your rendering code...
    requestAnimationFrame(() => render(gl, program, timeUniformLocation, startTime));
  }

  function setupWebGL (evt) {
    window.removeEventListener(evt.type, setupWebGL, false);
    var gl = getRenderingContext();
    if (!gl) return;

    var source = document.querySelector("#vertex-shader").innerHTML;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader,source);
    gl.compileShader(vertexShader);
    source = document.querySelector("#fragment-shader").innerHTML
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader,source);
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
    gl.drawArrays(gl.POINTS, 0, 1);

    var timeUniformLocation = gl.getUniformLocation(program, 'time');
    var startTime = performance.now();
    render(gl, program, timeUniformLocation, startTime);
  }

  function initializeAttributes(gl, program) {
    gl.enableVertexAttribArray(0);
    var buffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0]), gl.STATIC_DRAW);
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
