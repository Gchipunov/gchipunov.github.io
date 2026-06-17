#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

in vec2 v_texCoord;
out vec4 fragColor;

// Pseudo-random function
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = v_texCoord;

    // 1. Scanline Effect
    float scanline = sin(uv.y * 800.0 + u_time * 2.0) * 0.05;
    uv.x += scanline;

    // 2. Glitch Effect (Horizontal Jitter)
    float glitchIntensity = smoothstep(0.95, 1.0, rand(vec2(u_time * 0.1, 0.0)));
    if (rand(vec2(floor(uv.y * 20.0), u_time)) < 0.05 * glitchIntensity) {
        uv.x += (rand(vec2(u_time, 0.0)) - 0.5) * 0.1;
    }

    // 3. Chromatic Aberration
    float r = texture(u_texture, uv + vec2(0.002, 0.0)).r;
    float g = texture(u_texture, uv).g;
    float b = texture(u_texture, uv - vec2(0.002, 0.0)).b;

    fragColor = vec4(r, g, b, 1.0);
}
