// A simple helper to compile a shader
function compileShader(gl, type, source) {
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

// A simple helper to create a shader program
function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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

// Main WebGL application logic
window.onload = function() {
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Set canvas size to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Vertex shader source code
    // A simple shader that passes position and texture coordinates
    const vsSource = `
        attribute vec4 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = a_position;
            v_texCoord = a_texCoord;
        }
    `;

    // Fragment shader source code
    // A shader that uses a single texture
    const fsSource = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_sampler;
        void main() {
            gl_FragColor = texture2D(u_sampler, v_texCoord);
        }
    `;

    // Create the shader program
    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    // Look up attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const samplerLocation = gl.getUniformLocation(program, 'u_sampler');

    // Create a buffer for positions and texture coordinates
    const positionBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();

    // Quad data: 3 quads arranged horizontally
    // Positions: (x, y) for each vertex
    const positions = new Float32Array([
        // Quad 1 (left)
        -1.0, -0.5,
        -0.5, -0.5,
        -1.0,  0.5,
        -1.0,  0.5,
        -0.5, -0.5,
        -0.5,  0.5,

        // Quad 2 (middle)
        -0.5, -0.5,
         0.0, -0.5,
        -0.5,  0.5,
        -0.5,  0.5,
         0.0, -0.5,
         0.0,  0.5,

        // Quad 3 (right)
         0.0, -0.5,
         0.5, -0.5,
         0.0,  0.5,
         0.0,  0.5,
         0.5, -0.5,
         0.5,  0.5,
    ]);

    // Texture coordinates: (u, v) for each vertex
    const texCoords = new Float32Array([
        // Quad 1
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,

        // Quad 2
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,

        // Quad 3
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
    ]);

    // Put position data into the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Put texture coordinate data into the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // An array to hold our texture objects
    const textures = [];

    // Array of image URLs to load
    const imageUrls = [
        'https://webgl2fundamentals.org/webgl/resources/f-texture.png', // Example image 1
        'https://webgl2fundamentals.org/webgl/resources/flower-1.jpg', // Example image 2
        'https://webgl2fundamentals.org/webgl/resources/leaves.jpg'    // Example image 3
    ];

    let imagesLoaded = 0;
    const numImagesToLoad = imageUrls.length;

    // Load each texture
    imageUrls.forEach((url, index) => {
        const texture = gl.createTexture();
        textures[index] = texture;
        const image = new Image();
        image.src = url;

        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            
            // Upload the image to the texture
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            imagesLoaded++;
            if (imagesLoaded === numImagesToLoad) {
                // Once all images are loaded, start the draw loop
                drawScene();
            }
        };

        // Handle image loading errors
        image.onerror = function() {
            console.error(`Failed to load image at ${url}`);
        };
    });

    // The main drawing function
    function drawScene() {
        gl.clearColor(0.8, 0.8, 0.8, 1.0); // Clear to a light gray
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        // Bind the position buffer and enable the attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        // Bind the texture coordinate buffer and enable the attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);

        // --- Draw each quad individually with its own texture ---
        const verticesPerQuad = 6;

        for (let i = 0; i < 3; i++) {
            // Activate and bind the correct texture unit
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);

            // Tell the shader to use the texture on texture unit 0
            gl.uniform1i(samplerLocation, 0);
            
            // Draw the quad
            // The `offset` parameter specifies the starting vertex in the buffer
            const offset = i * verticesPerQuad * Float32Array.BYTES_PER_ELEMENT;
            gl.drawArrays(gl.TRIANGLES, offset / Float32Array.BYTES_PER_ELEMENT, verticesPerQuad);
        }
    }
};
