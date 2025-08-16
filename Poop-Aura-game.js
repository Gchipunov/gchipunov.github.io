// --- GLSL Shader Code ---

// This shader positions the vertices.
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

// This shader sets the color for each pixel.
const fsSource = `
    void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0); // Orange color
    }
`;
