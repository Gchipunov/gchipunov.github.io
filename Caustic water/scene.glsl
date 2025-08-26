// In a file or script tag, e.g., id="scene-vs"
attribute vec4 a_position;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying vec3 v_position;

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
  v_position = a_position.xyz;
}
