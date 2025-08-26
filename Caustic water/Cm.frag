// In a file or script tag, e.g., id="caustics-fs"
precision mediump float;

varying vec3 v_worldPosition;
uniform float u_time;

// Noise function to get normals
vec3 getNormal(vec2 p) {
    float h1 = fract(sin(dot(p + vec2(0.01, 0.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.2;
    float h2 = fract(sin(dot(p + vec2(0.0, 0.01), vec2(12.9898, 78.233))) * 43758.5453) * 0.2;
    vec3 normal = normalize(vec3(h1 - v_worldPosition.y, 0.02, h2 - v_worldPosition.y));
    return normal;
}

void main() {
    // Calculate perturbed normal for refraction
    vec3 normal = getNormal(v_worldPosition.xz * 0.1 + u_time * 0.1);
    
    // Calculate refracted light direction (simplified)
    // eta is the ratio of refractive indices (air to water ~ 1.0 / 1.33)
    float eta = 0.75;
    vec3 refracted = refract(normalize(vec3(0.0, -1.0, 0.0)), normal, eta);

    // Project this refracted vector onto the floor (at y = -1)
    float t = (-1.0 - v_worldPosition.y) / refracted.y;
    vec3 projectedPos = v_worldPosition + refracted * t;

    // Output the projected position as a color to store in the texture
    // We scale and bias to fit into the 0.0-1.0 color range
    gl_FragColor = vec4(projectedPos.xz * 0.1 + 0.5, 0.0, 1.0);
}
