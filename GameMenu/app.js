// A simple WebGL library to reduce boilerplate (optional but helpful)
const glUtils = {
    createShader: (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    },
    createProgram: (gl, vs, fs) => {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }
};

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error("WebGL not supported!");
        return;
    }

    // 1. Shaders
    const vsSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform vec2 u_translation;
        void main() {
            vec2 position = a_position + u_translation;
            vec2 zeroToOne = position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `;

    const fsSource = `
        precision mediump float;
        uniform vec4 u_color;
        void main() {
            gl_FragColor = u_color;
        }
    `;
    
    const vertexShader = glUtils.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = glUtils.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = glUtils.createProgram(gl, vertexShader, fragmentShader);

    // 2. Get attribute and uniform locations
    const posAttrLocation = gl.getAttribLocation(program, 'a_position');
    const resUniLocation = gl.getUniformLocation(program, 'u_resolution');
    const colorUniLocation = gl.getUniformLocation(program, 'u_color');
    const transUniLocation = gl.getUniformLocation(program, 'u_translation');

    // 3. Create buffers
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    // A simple 50x50px square
    const positions = [0, 0, 50, 0, 0, 50, 0, 50, 50, 0, 50, 50];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // 4. Game state
    const housePositions = {
        'house1-btn': { x: 100, y: 350 },
        'house2-btn': { x: 375, y: 350 },
        'house3-btn': { x: 650, y: 350 }
    };

    const character = {
        x: housePositions['house1-btn'].x,
        y: housePositions['house1-btn'].y,
        targetX: housePositions['house1-btn'].x,
        targetY: housePositions['house1-btn'].y,
        speed: 0.1 // interpolation speed
    };
    
    // 5. Drawing function
    function drawObject(x, y, color) {
        gl.uniform2f(transUniLocation, x, y);
        gl.uniform4fv(colorUniLocation, color);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    // 6. Main render loop
    function render() {
        // Clear canvas
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.1, 0.15, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.enableVertexAttribArray(posAttrLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(posAttrLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(resUniLocation, gl.canvas.width, gl.canvas.height);

        // Draw houses
        drawObject(housePositions['house1-btn'].x, housePositions['house1-btn'].y - 50, [0.8, 0.2, 0.2, 1]); // Red house
        drawObject(housePositions['house2-btn'].x, housePositions['house2-btn'].y - 50, [0.2, 0.8, 0.2, 1]); // Green house
        drawObject(housePositions['house3-btn'].x, housePositions['house3-btn'].y - 50, [0.2, 0.2, 0.8, 1]); // Blue house

        // Update character position (interpolation)
        character.x += (character.targetX - character.x) * character.speed;
        character.y += (character.targetY - character.y) * character.speed;
        
        // Draw character
        drawObject(character.x, character.y, [1.0, 0.8, 0.0, 1]); // Yellow character

        requestAnimationFrame(render);
    }

    // 7. Setup mouse event listeners
    Object.keys(housePositions).forEach(id => {
        const button = document.getElementById(id);
        button.addEventListener('mouseover', () => {
            const pos = housePositions[id];
            character.targetX = pos.x;
            character.targetY = pos.y;
        });
    });

    // Start the render loop
    render();
});
