// In a file or script tag, e.g., id="caustics-vs"
attribute vec3 a_position;
uniform mat4 u_lightProjectionMatrix;
uniform mat4 u_lightViewMatrix;
uniform float u_time;

varying vec3 v_worldPosition;

// Simple noise function to create waves
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    v_worldPosition = a_position;
    // Displace vertices to create waves
    float height = noise(a_position.xz * 0.1 + u_time * 0.1) * 0.2;
    v_worldPosition.y += height;

    gl_Position = u_lightProjectionMatrix * u_lightViewMatrix * vec4(v_worldPosition, 1.0);
}
