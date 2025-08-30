// pressure.fs (Jacobi Iteration)
precision mediump float;
varying vec2 v_texCoord;

uniform sampler2D u_pressureTexture;
uniform sampler2D u_divergenceTexture;
uniform vec2 u_texelSize;

void main() {
    // Sample pressure of neighboring pixels from the previous iteration
    float pL = texture2D(u_pressureTexture, v_texCoord - vec2(u_texelSize.x, 0.0)).r;
    float pR = texture2D(u_pressureTexture, v_texCoord + vec2(u_texelSize.x, 0.0)).r;
    float pB = texture2D(u_pressureTexture, v_texCoord - vec2(0.0, u_texelSize.y)).r;
    float pT = texture2D(u_pressureTexture, v_texCoord + vec2(0.0, u_texelSize.y)).r;

    float divergence = texture2D(u_divergenceTexture, v_texCoord).r;

    // Jacobi iteration formula
    float newPressure = (pL + pR + pB + pT - divergence) * 0.25;

    gl_FragColor = vec4(newPressure, 0.0, 0.0, 1.0);
}
