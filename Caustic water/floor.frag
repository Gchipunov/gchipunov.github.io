// In a file or script tag, e.g., id="floor-fs"
precision mediump float;
uniform sampler2D u_causticsTexture;
uniform mat4 u_lightProjectionMatrix;
uniform mat4 u_lightViewMatrix;

varying vec3 v_position;

void main() {
    // Project current fragment position into light space
    vec4 lightSpacePos = u_lightProjectionMatrix * u_lightViewMatrix * vec4(v_position, 1.0);
    vec3 lightSpaceNDC = lightSpacePos.xyz / lightSpacePos.w;
    vec2 lightSpaceUV = lightSpaceNDC.xy * 0.5 + 0.5;

    // Sample the caustics texture
    float caustic = texture2D(u_causticsTexture, lightSpaceUV).a;
    
    // A simple blue floor color, brightened by the caustic value
    vec3 floorColor = vec3(0.1, 0.3, 0.7);
    gl_FragColor = vec4(floorColor + caustic * 0.8, 1.0);
}
