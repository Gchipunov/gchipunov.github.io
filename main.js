// main.js

let gl; // WebGL rendering context
let program; // Shader program
let planeBuffer; // VBO for the plane
let treeBuffer; // VBO for a tree (if using static models)
let groundTexture;
let treeTexture;

// Transformation matrices (using a library like gl-matrix for convenience)
let modelMatrix = mat4.create();
let viewMatrix = mat4.create();
let projectionMatrix = mat4.create();

function initWebGL() {
    const canvas = document.getElementById('webglCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.7, 0.9, 1.0, 1.0); // Sky blue background
    gl.enable(gl.DEPTH_TEST);

    // Initialize shaders, buffers, textures
    program = initShaders(gl);
    if (!program) return;

    gl.useProgram(program);

    // Get attribute and uniform locations
    program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    program.aNormal = gl.getAttribLocation(program, 'aNormal');
    program.aTexCoord = gl.getAttribLocation(program, 'aTexCoord');

    program.uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
    program.uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
    program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    program.uSampler = gl.getUniformLocation(program, 'uSampler');
    program.uLightDirection = gl.getUniformLocation(program, 'uLightDirection');
    program.uCameraPosition = gl.getUniformLocation(program, 'uCameraPosition');


    // Create geometry and buffers
    planeBuffer = createPlaneBuffer(gl);
    // treeBuffer = createTreeBillboardBuffer(gl); // Or createTreeModelBuffer(gl);

    // Load textures
    groundTexture = loadTexture(gl, 'grass_texture.png');
    treeTexture = loadTexture(gl, 'tree_billboard.png'); // Or 'tree_bark.png', 'tree_leaves.png'

    // Set up camera (view matrix)
    const cameraPosition = vec3.fromValues(0, 5, 10);
    const target = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);
    mat4.lookAt(viewMatrix, cameraPosition, target, up);
    gl.uniform3fv(program.uCameraPosition, cameraPosition); // Pass camera position for specular lighting

    // Set up projection matrix
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 1000.0);
    gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);

    // Set light direction
    const lightDirection = vec3.normalize(vec3.create(), vec3.fromValues(0.5, -1.0, -0.5));
    gl.uniform3fv(program.uLightDirection, lightDirection);

    requestAnimationFrame(render);
}

function initShaders(gl) {
    const vertexShaderSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aNormal;
        attribute vec2 aTexCoord;

        uniform mat4 uModelMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vTexCoord;

        void main(void) {
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
            vNormal = mat3(uModelMatrix) * aNormal; // Transform normal to world space
            vPosition = (uModelMatrix * aVertexPosition).xyz; // Vertex position in world space
            vTexCoord = aTexCoord;
        }
    `;

    const fragmentShaderSource = `
        precision highp float;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vTexCoord;

        uniform sampler2D uSampler;
        uniform highp vec3 uLightDirection; // Directional light
        uniform highp vec3 uCameraPosition;

        void main(void) {
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(uLightDirection);
            vec3 viewDir = normalize(uCameraPosition - vPosition);

            // Ambient light
            vec3 ambient = 0.2 * texture2D(uSampler, vTexCoord).rgb;

            // Diffuse light (Lambertian)
            float diff = max(dot(normal, -lightDir), 0.0);
            vec3 diffuse = diff * texture2D(uSampler, vTexCoord).rgb;

            // Specular light (Phong) - Simplified
            vec3 reflectDir = reflect(lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0); // 32.0 is shininess
            vec3 specular = spec * vec3(1.0, 1.0, 1.0); // White specular highlight

            vec4 texColor = texture2D(uSampler, vTexCoord);

            // For billboards, handle transparency
            if (texColor.a < 0.1) { // Alpha threshold
                discard;
            }

            gl_FragColor = vec4(ambient + diffuse + specular, texColor.a);
        }
    `;

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

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

function createPlaneBuffer(gl) {
    const positions = [
        -20.0, 0.0, -20.0, // bottom-left
         20.0, 0.0, -20.0, // bottom-right
        -20.0, 0.0,  20.0, // top-left
         20.0, 0.0,  20.0, // top-right
    ];
    const normals = [
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
    ];
    const texCoords = [
        0.0, 1.0, // Corresponds to -20, -20 (bottom-left of plane, top-left of texture)
        1.0, 1.0, // Corresponds to  20, -20 (bottom-right of plane, top-right of texture)
        0.0, 0.0, // Corresponds to -20,  20 (top-left of plane, bottom-left of texture)
        1.0, 0.0, // Corresponds to  20,  20 (top-right of plane, bottom-right of texture)
    ];
    const indices = [
        0, 1, 2,
        1, 3, 2,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        texCoord: texCoordBuffer,
        indices: indexBuffer,
        vertexCount: indices.length,
    };
}

// Function to create a simple tree billboard (quad facing the camera)
function createTreeBillboardBuffer(gl) {
    // A single quad (two triangles) for the tree billboard
    const width = 2.0;
    const height = 4.0;
    const halfWidth = width / 2.0;

    // Billboards are typically drawn with their base at Y=0, and extend upwards.
    // They are usually rotated to always face the camera in the shader.
    const positions = [
        -halfWidth, 0.0, 0.0,  // Bottom-left
         halfWidth, 0.0, 0.0,  // Bottom-right
        -halfWidth, height, 0.0,  // Top-left
         halfWidth, height, 0.0,  // Top-right
    ];
    // Normals for a billboard are typically dynamic (facing camera) or not used if only texturing
    const normals = [
        0.0, 0.0, 1.0, // Facing towards positive Z (will be rotated)
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
    ];
    const texCoords = [
        0.0, 1.0, // Bottom-left of billboard, top-left of texture
        1.0, 1.0, // Bottom-right of billboard, top-right of texture
        0.0, 0.0, // Top-left of billboard, bottom-left of texture
        1.0, 0.0, // Top-right of billboard, top-right of texture
    ];
    const indices = [
        0, 1, 2,
        1, 3, 2,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        texCoord: texCoordBuffer,
        indices: indexBuffer,
        vertexCount: indices.length,
    };
}


function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill the texture with a 1x1 blue pixel while the image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function drawObject(gl, buffer, texture, modelMat) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
    gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.aVertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
    gl.vertexAttribPointer(program.aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.aNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texCoord);
    gl.vertexAttribPointer(program.aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.aTexCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.uSampler, 0);

    gl.uniformMatrix4fv(program.uModelMatrix, false, modelMat);

    gl.drawElements(gl.TRIANGLES, buffer.vertexCount, gl.UNSIGNED_SHORT, 0);
}

const treePositions = []; // Store positions for multiple trees
const numTrees = 100;
for (let i = 0; i < numTrees; i++) {
    const x = (Math.random() - 0.5) * 35; // Random X between -17.5 and 17.5
    const z = (Math.random() - 0.5) * 35; // Random Z between -17.5 and 17.5
    treePositions.push(vec3.fromValues(x, 0, z)); // Y is 0 as trees are on the plane
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Draw Plane ---
    mat4.identity(modelMatrix); // Plane is at the origin
    drawObject(gl, planeBuffer, groundTexture, modelMatrix);

    // --- Draw Trees (Billboards) ---
    // If you want billboards to always face the camera, you'd modify the model matrix
    // or vertex positions in the vertex shader. Here's a simplified approach
    // where the billboard's local Z axis is aligned with the view direction.
    // For proper billboarding, you'd calculate the inverse of the camera's rotation
    // and apply it to the billboard's model matrix.
    // A simpler way for a general game is to draw the billboard centered at the tree's
    // position, and scale it, then handle rotation in the vertex shader.
    // Example:
    // modelMatrix = mat4.create();
    // mat4.translate(modelMatrix, modelMatrix, treePosition);
    // // In vertex shader:
    // // vec4 transformedPosition = uViewMatrix * uModelMatrix * aVertexPosition;
    // // transformedPosition.xy += aVertexPosition.xy * some_scale; // Make billboard face camera
    // // gl_Position = uProjectionMatrix * transformedPosition;

    // For this example, let's just draw them at their fixed positions.
    // For true billboarding, you'd need to modify the vertex shader
    // or calculate a camera-aligned model matrix per billboard.

    // A more advanced billboard vertex shader would look something like this:
    // gl_Position = uProjectionMatrix * uViewMatrix * vec4(treeCenterWorld + (uViewMatrixInverse[0].xyz * aVertexPosition.x + uViewMatrixInverse[1].xyz * aVertexPosition.y), 1.0);
    // (You'd need to pass uViewMatrixInverse as a uniform).

    if (!treeBuffer) { // Initialize tree buffer only once
        treeBuffer = createTreeBillboardBuffer(gl);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // For alpha blending
    }

    treePositions.forEach(pos => {
        let treeModelMatrix = mat4.create();
        mat4.translate(treeModelMatrix, treeModelMatrix, pos);
        // For a billboard, you'd also want to clear any rotation from the camera
        // to make it always face the camera.
        // Let's assume a simplified billboard where the Z-axis of the quad is always facing the viewer.
        // In the shader, the billboard would be constructed relative to the camera's view plane.
        // Here, we just place the quad. Alpha blending is essential.

        drawObject(gl, treeBuffer, treeTexture, treeModelMatrix);
    });


    requestAnimationFrame(render);
}

window.onload = initWebGL;
