// main.js

// Wait for the DOM to load
window.addEventListener('load', () => {
    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // --- 1. Shaders (GLSL Code) ---
    // Vertex shader positions the vertices
    const vsSource = `
        attribute vec4 a_position;
        attribute vec3 a_normal;

        uniform mat4 u_modelViewMatrix;
        uniform mat4 u_projectionMatrix;
        
        varying vec3 v_worldPosition;
        varying vec3 v_normal;

        void main() {
            // Calculate world position of the vertex
            v_worldPosition = (u_modelViewMatrix * a_position).xyz;
            v_normal = mat3(u_modelViewMatrix) * a_normal;
            gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
        }
    `;

    // Fragment shader colors each pixel
    const fsSource = `
        precision mediump float;

        uniform vec3 u_laserOrigin;
        uniform vec3 u_laserDirection;
        uniform vec3 u_intersectionPoint;
        uniform bool u_isIntersecting;

        varying vec3 v_worldPosition;
        varying vec3 v_normal;

        void main() {
            vec3 normal = normalize(v_normal);
            vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.75));
            float diffuse = max(dot(normal, lightDirection), 0.2); // Basic ambient light
            
            vec3 baseColor = vec3(0.3, 0.5, 0.9) * diffuse;
            
            // Extrusion/Glow effect
            if (u_isIntersecting) {
                // Calculate distance from the fragment to the laser intersection point
                float dist = distance(v_worldPosition, u_intersectionPoint);
                // Create a glowing effect that falls off with distance
                float glow = smoothstep(0.15, 0.0, dist); 
                
                vec3 laserColor = vec3(1.0, 0.2, 0.2); // Bright red laser
                
                // Mix the base color with the laser glow color
                baseColor = mix(baseColor, laserColor, glow);
            }
            
            gl_FragColor = vec4(baseColor, 1.0);
        }
    `;
    
    // --- 2. Compile Shaders and Link Program ---
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

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // --- 3. Get Shader Attribute and Uniform Locations ---
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'a_position'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'a_normal'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_projectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix'),
            laserOrigin: gl.getUniformLocation(shaderProgram, 'u_laserOrigin'),
            laserDirection: gl.getUniformLocation(shaderProgram, 'u_laserDirection'),
            intersectionPoint: gl.getUniformLocation(shaderProgram, 'u_intersectionPoint'),
            isIntersecting: gl.getUniformLocation(shaderProgram, 'u_isIntersecting'),
        },
    };

    // --- 4. Define Cube Geometry ---
    function initBuffers(gl) {
        const positions = [
            // Front face
            -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
            // Back face
            -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
            // Top face
            -1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,
            // Bottom face
            -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
            // Right face
             1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,
            // Left face
            -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0,
        ];
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const normals = [
            // Front
             0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
            // Back
             0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,
            // Top
             0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,
            // Bottom
             0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,
            // Right
             1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,
            // Left
            -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,
        ];
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            normal: normalBuffer,
            indices: indexBuffer,
            vertexCount: indices.length,
        };
    }
    const buffers = initBuffers(gl);

    // --- 5. Input Handling and Raycasting ---
    let laserDirection = glMatrix.vec3.fromValues(0, 0, -1);
    const laserOrigin = glMatrix.vec3.fromValues(0, 0, 5); // Laser is fired from the camera position
    let intersectionPoint = glMatrix.vec3.create();
    let isIntersecting = false;
    
    const projectionMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();

    // Ray-AABB (Axis-Aligned Bounding Box) intersection function
    function rayIntersectsCube(origin, dir) {
        const cubeMin = [-1, -1, -1];
        const cubeMax = [1, 1, 1];
        let tmin = -Infinity, tmax = Infinity;

        for (let i = 0; i < 3; i++) {
            if (Math.abs(dir[i]) < 1e-6) {
                if (origin[i] < cubeMin[i] || origin[i] > cubeMax[i]) return null;
            } else {
                let ood = 1.0 / dir[i];
                let t1 = (cubeMin[i] - origin[i]) * ood;
                let t2 = (cubeMax[i] - origin[i]) * ood;
                if (t1 > t2) [t1, t2] = [t2, t1]; // swap
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2);
                if (tmin > tmax) return null;
            }
        }
        
        const point = glMatrix.vec3.create();
        glMatrix.vec3.scaleAndAdd(point, origin, dir, tmin);
        return point;
    }

    function updateLaserDirection(event) {
        const rect = canvas.getBoundingClientRect();
        // Use the first touch point for mobile, or mouse coordinates for PC
        const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
        const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

        // Convert 2D screen coordinates to 3D world coordinates
        const clipX = (x / canvas.width) * 2 - 1;
        const clipY = (y / canvas.height) * -2 + 1; // Y is inverted in WebGL

        const invertedProjection = glMatrix.mat4.create();
        glMatrix.mat4.invert(invertedProjection, projectionMatrix);
        
        const invertedView = glMatrix.mat4.create();
        glMatrix.mat4.invert(invertedView, viewMatrix);

        const far = glMatrix.vec4.fromValues(clipX, clipY, 1.0, 1.0);
        glMatrix.vec4.transformMat4(far, far, invertedProjection);
        glMatrix.vec4.transformMat4(far, far, invertedView);
        
        glMatrix.vec3.set(laserDirection, far[0] / far[3], far[1] / far[3], far[2] / far[3]);
        glMatrix.vec3.subtract(laserDirection, laserDirection, laserOrigin);
        glMatrix.vec3.normalize(laserDirection, laserDirection);
        
        // Check for intersection
        const hitPoint = rayIntersectsCube(laserOrigin, laserDirection);
        if (hitPoint) {
            isIntersecting = true;
            intersectionPoint = hitPoint;
        } else {
            isIntersecting = false;
        }
    }
    
    // Add event listeners for both mouse and touch
    canvas.addEventListener('mousemove', updateLaserDirection);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        updateLaserDirection(e);
    }, { passive: false });

    // --- 6. Render Loop ---
    let cubeRotation = 0.0;
    
    function render(now) {
        now *= 0.001; // convert to seconds
        
        // --- Resize canvas to fit display ---
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, gl.width, gl.height);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 100.0);

        const modelViewMatrix = glMatrix.mat4.create();
        // Camera position
        glMatrix.mat4.lookAt(viewMatrix, laserOrigin, [0, 0, 0], [0, 1, 0]);
        glMatrix.mat4.copy(modelViewMatrix, viewMatrix);
        
        // Rotate the cube
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0]);
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [1, 0, 0]);
        
        cubeRotation += now * 0.0001; // Slow rotation

        // --- Bind buffers and set attributes ---
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        
        // --- Set uniforms and draw ---
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        
        gl.uniform3fv(programInfo.uniformLocations.laserOrigin, laserOrigin);
        gl.uniform3fv(programInfo.uniformLocations.laserDirection, laserDirection);
        gl.uniform3fv(programInfo.uniformLocations.intersectionPoint, intersectionPoint);
        gl.uniform1i(programInfo.uniformLocations.isIntersecting, isIntersecting);

        gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
});
