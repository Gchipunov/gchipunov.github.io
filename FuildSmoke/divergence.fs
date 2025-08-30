// divergence.fs
precision mediump float;
varying vec2 v_texCoord;

uniform sampler2D u_velocityTexture;
uniform vec2 u_texelSize; // 1.0 / resolution

void main() {
    // Sample velocities of neighboring pixels
    float vL = texture2D(u_velocityTexture, v_texCoord - vec2(u_texelSize.x, 0.0)).x;
    float vR = texture2D(u_velocityTexture, v_texCoord + vec2(u_texelSize.x, 0.0)).x;
    float vB = texture2D(u_velocityTexture, v_texCoord - vec2(0.0, u_texelSize.y)).y;
    float vT = texture2D(u_velocityTexture, v_texCoord + vec2(0.0, u_texelSize.y)).y;

    // Calculate divergence
    float divergence = 0.5 * ((vR - vL) + (vT - vB));

    gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}
