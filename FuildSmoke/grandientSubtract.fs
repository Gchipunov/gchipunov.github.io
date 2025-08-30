// gradientSubtract.fs
precision mediump float;
varying vec2 v_texCoord;

uniform sampler2D u_pressureTexture;
uniform sampler2D u_velocityTexture;
uniform vec2 u_texelSize;

void main() {
    // Sample pressure of neighboring pixels
    float pL = texture2D(u_pressureTexture, v_texCoord - vec2(u_texelSize.x, 0.0)).r;
    float pR = texture2D(u_pressureTexture, v_texCoord + vec2(u_texelSize.x, 0.0)).r;
    float pB = texture2D(u_pressureTexture, v_texCoord - vec2(0.0, u_texelSize.y)).r;
    float pT = texture2D(u_pressureTexture, v_texCoord + vec2(0.0, u_texelSize.y)).r;

    vec2 velocity = texture2D(u_velocityTexture, v_texCoord).xy;

    // Calculate the pressure gradient and subtract it from the velocity
    vec2 gradient = 0.5 * vec2(pR - pL, pT - pB);
    vec2 newVelocity = velocity - gradient;

    gl_FragColor = vec4(newVelocity, 0.0, 1.0);
}
