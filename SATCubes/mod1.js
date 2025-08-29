// A simple 2D Vector class
class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    subtract(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    normal() {
        return new Vec2(-this.y, this.x);
    }
    normalize() {
        const mag = Math.sqrt(this.x * this.x + this.y * this.y);
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }
}

// Represents any rectangular object in the game
class Box {
    constructor(x, y, width, height, rotation = 0, color = [1, 1, 1, 1]) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation; // in radians
        this.color = color;

        // Physics properties
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.jumpCount = 0; // For double jump feature
    }

    // Get the four corners of the box in world coordinates
    getVertices() {
        const w = this.width / 2;
        const h = this.height / 2;
        const corners = [
            new Vec2(-w, -h),
            new Vec2(w, -h),
            new Vec2(w, h),
            new Vec2(-w, h),
        ];

        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        return corners.map(p => {
            const rotatedX = p.x * cos - p.y * sin;
            const rotatedY = p.x * sin + p.y * cos;
            return new Vec2(this.x + rotatedX, this.y + rotatedY);
        });
    }

    // Get the axes to test for SAT (the normals of the edges)
    getAxes() {
        const vertices = this.getVertices();
        const axes = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[i + 1 === vertices.length ? 0 : i + 1];
            const edge = p1.subtract(p2);
            axes.push(edge.normal().normalize());
        }
        return axes;
    }

    // Project the box's vertices onto an axis
    project(axis) {
        const vertices = this.getVertices();
        let min = axis.dot(vertices[0]);
        let max = min;
        for (let i = 1; i < vertices.length; i++) {
            const p = axis.dot(vertices[i]);
            if (p < min) {
                min = p;
            } else if (p > max) {
                max = p;
            }
        }
        return { min, max };
    }
}

// SAT collision detection function
function checkCollision(boxA, boxB) {
    const axes = [...boxA.getAxes(), ...boxB.getAxes()];
    let minOverlap = Infinity;
    let smallestAxis = null;

    for (const axis of axes) {
        const projA = boxA.project(axis);
        const projB = boxB.project(axis);

        const overlap = Math.max(0, Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min));

        if (overlap === 0) {
            // Found a separating axis, no collision
            return null;
        }

        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis = axis;
        }
    }

    // Ensure the MTV is pointing from B to A
    const centerA = new Vec2(boxA.x, boxA.y);
    const centerB = new Vec2(boxB.x, boxB.y);
    const direction = centerA.subtract(centerB);
    if (direction.dot(smallestAxis) < 0) {
        smallestAxis = smallestAxis.scale(-1);
    }

    return {
        overlap: minOverlap,
        axis: smallestAxis,
    };
}


// --- Main Application ---
function main() {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2 not available");
        return;
    }

    // --- Shader and Program Setup ---
    const vsSource = document.getElementById("vertex-shader-2d").text.trim();
    const fsSource = document.getElementById("fragment-shader-2d").text.trim();
    const program = createProgram(gl, vsSource, fsSource);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");

    // --- Vertex Buffers ---
    // Buffer for a filled unit square (for game objects)
    const fillPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fillPositionBuffer);
    const fillPositions = [
        -0.5, -0.5,
         0.5, -0.5,
         0.5,  0.5,
        -0.5,  0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fillPositions), gl.STATIC_DRAW);

    // Buffer for a line loop (for collision box outline)
    const outlinePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, outlinePositionBuffer);
    const outlinePositions = [
        -0.5, -0.5,
         0.5, -0.5,
         0.5,  0.5,
        -0.5,  0.5,
        -0.5, -0.5, // To close the loop
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outlinePositions), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Game State ---
    const player = new Box(150, 100, 30, 40, 0, [0.2, 0.6, 1.0, 1.0]);
    const platforms = [
        new Box(400, 550, 700, 50, 0, [0.5, 0.5, 0.5, 1.0]), // Floor
        new Box(600, 450, 150, 20, Math.PI / 8, [0.8, 0.3, 0.3, 1.0]), // Angled platform
        new Box(200, 350, 200, 20, -Math.PI / 12, [0.3, 0.8, 0.3, 1.0]),
        new Box(450, 250, 80, 80, Math.PI / 4, [0.8, 0.8, 0.3, 1.0]), // Rotated diamond
    ];
    const gameObjects = [player, ...platforms];
    const keys = {};
    const GRAVITY = 0.5;
    const JUMP_FORCE = -12;
    const MOVE_SPEED = 4;

    // Mouse drag state
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // --- Input Handling ---
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        // Double jump logic
        if ((e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') && player.jumpCount < 2) {
            player.vy = JUMP_FORCE;
            player.jumpCount++;
        }
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    // Mouse drag handling
    canvas.addEventListener('mousedown', (e) => {
        // Check if the click is on the player box
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const playerVertices = player.getVertices();
        const minX = Math.min(...playerVertices.map(v => v.x));
        const maxX = Math.max(...playerVertices.map(v => v.x));
        const minY = Math.min(...playerVertices.map(v => v.y));
        const maxY = Math.max(...playerVertices.map(v => v.y));

        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
            isDragging = true;
            dragOffsetX = mouseX - player.x;
            dragOffsetY = mouseY - player.y;
            // Stop other movement while dragging
            player.vx = 0;
            player.vy = 0;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            player.x = e.clientX - dragOffsetX;
            player.y = e.clientY - dragOffsetY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // --- Game Loop ---
    let lastTime = 0;
    function gameLoop(currentTime) {
        currentTime *= 0.001; // convert to seconds
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // --- Update (Physics and Logic) ---
        if (!isDragging) {
            // Player movement
            player.vx = 0;
            if (keys['KeyA'] || keys['ArrowLeft']) {
                player.vx = -MOVE_SPEED;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                player.vx = MOVE_SPEED;
            }

            // Apply gravity
            player.vy += GRAVITY;

            // Update position
            player.x += player.vx;
            player.y += player.vy;
        }

        // Collision detection and resolution
        let wasOnGround = player.onGround;
        player.onGround = false;
        for (const platform of platforms) {
            const collisionInfo = checkCollision(player, platform);
            if (collisionInfo) {
                const { overlap, axis } = collisionInfo;
                const mtv = axis.scale(overlap);
                player.x += mtv.x;
                player.y += mtv.y;

                // If collision is mostly vertical, stop vertical movement and allow jumping
                if (Math.abs(axis.y) > Math.abs(axis.x)) {
                    if (player.vy > 0 && axis.y < 0) { // landing on top
                         player.onGround = true;
                    }
                    player.vy = 0;
                }
            }
        }
        // Reset jump count if player landed
        if (player.onGround && !wasOnGround) {
            player.jumpCount = 0;
        }


        // --- Render ---
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.1, 0.1, 0.15, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gameObjects.forEach(obj => {
            const projectionMatrix = createOrthographic(0, gl.canvas.width, gl.canvas.height, 0);
            const translationMatrix = createTranslation(obj.x, obj.y);
            const rotationMatrix = createRotation(obj.rotation);
            const scaleMatrix = createScale(obj.width, obj.height);

            let matrix = multiply(projectionMatrix, translationMatrix);
            matrix = multiply(matrix, rotationMatrix);
            matrix = multiply(matrix, scaleMatrix);

            gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);
            gl.uniform4fv(colorUniformLocation, obj.color);

            // Draw the filled box
            gl.bindBuffer(gl.ARRAY_BUFFER, fillPositionBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            // Draw the collision box outline
            gl.uniform4fv(colorUniformLocation, [1.0, 1.0, 1.0, 1.0]); // White outline
            gl.bindBuffer(gl.ARRAY_BUFFER, outlinePositionBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINE_STRIP, 0, 5);
        });

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

// --- WebGL & Matrix Helper Functions ---
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vsSource, fsSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// Matrix functions for 2D transformations (using mat3)
function createOrthographic(left, right, bottom, top) {
    return [
        2 / (right - left), 0, 0,
        0, 2 / (top - bottom), 0,
        (left + right) / (left - right),
        (bottom + top) / (bottom - top),
        1,
    ];
}

function createTranslation(tx, ty) {
    return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
    ];
}

function createRotation(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
        c, -s, 0,
        s, c, 0,
        0, 0, 1,
    ];
}

function createScale(sx, sy) {
    return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
    ];
}

function multiply(a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];
    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];
    return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
    ];
}

main();
