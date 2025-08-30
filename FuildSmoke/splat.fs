// splat.fs
precision mediump float;
varying vec2 v_texCoord;

uniform sampler2D u_targetTexture;
uniform vec2 u_point;      // The center of the splat (e.g., mouse position)
uniform float u_radius;
uniform vec3 u_color;      // Color/force to add

void main() {
    vec2 coord = v_texCoord * u_resolution;
    vec2 point = u_point * u_resolution;

    // Calculate the splat as a gaussian blob
    float d = distance(coord, point);
    float splat = exp(-d * d / (u_radius * u_radius));

    vec3 base = texture2D(u_targetTexture, v_texCoord).rgb;
    gl_FragColor = vec4(base + u_color * splat, 1.0);
}
