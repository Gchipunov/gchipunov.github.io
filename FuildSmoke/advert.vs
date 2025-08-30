// advect.fs
precision mediump float;
varying vec2 v_texCoord;

uniform sampler2D u_velocityTexture; // Current velocity field
uniform sampler2D u_sourceTexture;   // Quantity to advect (e.g., density or velocity)
uniform vec2 u_resolution;
uniform float u_timestep;
uniform float u_dissipation;

void main() {
    // Get the velocity at the current pixel
    vec2 velocity = texture2D(u_velocityTexture, v_texCoord).xy;

    // Go back in time to find the source position
    vec2 prevPos = v_texCoord - u_timestep * velocity / u_resolution;

    // Sample the source texture at the previous position
    vec4 advectedValue = texture2D(u_sourceTexture, prevPos);

    // Apply a little dissipation (fading) over time
    gl_FragColor = u_dissipation * advectedValue;
}
