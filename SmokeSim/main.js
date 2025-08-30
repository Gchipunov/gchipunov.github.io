// Ensure the script runs after the DOM is fully loaded
window.onload = function() {
    const canvas = document.getElementById('smokeCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error("WebGL not supported!");
        return;
    }

    // --- 1. Resize canvas to fill browser window ---
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // --- 2. Define and compile shaders ---
    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;

        void main() {
            // Convert position from pixels to 0.0 to 1.0
            vec2 zeroToOne = a_position / u_resolution;
            // Convert from 0->1 to 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;
            // Convert from 0->2 to -1->+1 (clip space)
            vec2 clipSpace = zeroToTwo - 1.0;

            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); // Flip Y
            gl_PointSize = 60.0; // Size of the particle
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_sampler;

        void main() {
            // gl_PointCoord gives us the coordinate within the point (0.0 to 1.0)
            // We use this to sample our texture
            vec4 textureColor = texture2D(u_sampler, gl_PointCoord);
            
            // Premultiply alpha
            textureColor.rgb *= textureColor.a;
            
            gl_FragColor = textureColor;
        }
    `;

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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // --- 3. Get attribute and uniform locations ---
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const samplerUniformLocation = gl.getUniformLocation(program, "u_sampler");

    // --- 4. Create buffers and particle data ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    let particles = [];
    const MAX_PARTICLES = 500;
    const PARTICLE_LIFETIME = 180; // in frames

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            // Simple physics: move up and slightly drift left/right
            this.velocityX = (Math.random() - 0.5) * 0.5;
            this.velocityY = Math.random() * -1 - 0.5; // Move up
            this.life = PARTICLE_LIFETIME;
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.life--;
        }
    }
    
    // --- 5. Load the smoke texture ---
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill the texture with a 1x1 blue pixel while we wait for the image to load
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    // IMPORTANT: Use a texture from a source that allows cross-origin requests, or host it yourself.
    // For a quick test, you can find a base64 encoded smoke texture online.
    image.src = "https://webglfundamentals.org/webgl/resources/images/smoke.png"; // Example texture
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };


    // --- 6. The Animation Loop ---
    function drawScene() {
        // --- Update particle logic ---
        // Create new particles at the bottom center
        if (particles.length < MAX_PARTICLES) {
            particles.push(new Particle(canvas.width / 2, canvas.height));
        }

        // Update and filter out dead particles
        const livingParticles = [];
        const particlePositions = [];
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update();
            if (p.life > 0) {
                livingParticles.push(p);
                particlePositions.push(p.x, p.y);
            }
        }
        particles = livingParticles;

        // --- Render logic ---
        gl.clearColor(0, 0, 0, 1); // Black background
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);

        // Enable attribute
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
        // Update buffer data
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particlePositions), gl.DYNAMIC_DRAW);

        // Tell the attribute how to get data out of positionBuffer
        const size = 2;          // 2 components per iteration (x, y)
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
        
        // Set uniforms
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(samplerUniformLocation, 0); // texture unit 0

        // --- Enable blending for smoke transparency ---
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Standard alpha blending
        // For a more "additive" smoke/fire effect, you can use:
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // Draw the particles
        const primitiveType = gl.POINTS;
        const drawOffset = 0;
        const count = particles.length;
        gl.drawArrays(primitiveType, drawOffset, count);
        
        requestAnimationFrame(drawScene);
    }

    // Start the loop
    drawScene();
};
