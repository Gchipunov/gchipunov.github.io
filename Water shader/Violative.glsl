// water.fs
#version 330 core

// Output color
out vec4 fragColor;

// Input from Vertex Shader
in vec2 v_uv;
in vec3 v_fragPos_world; // Fragment position in world space
in mat3 v_tbn;          // Tangent-to-World space matrix

// Uniforms provided by the application
uniform sampler2D normalMapTexture;
uniform sampler2D noiseTexture;
uniform sampler2D depthTexture; // Scene depth rendered from the camera's perspective

uniform vec3 viewPos_world;   // Camera position in world space
uniform vec3 lightPos_world;  // Light position in world space
uniform vec3 lightColor;

// Water appearance properties
uniform vec3 deepColor;
uniform vec3 shallowColor;
uniform float depthMax; // Depth at which water is fully deepColor

// Distortion and Pixelation
uniform float time;
uniform float noiseStrength;
uniform int quantizationLevel;

// Panning speeds for the three normal map layers
uniform vec2 panSpeed1;
uniform vec2 panSpeed2;
uniform vec2 panSpeed3;

// Specular Highlight Control
uniform float smoothness; // Range 0.0 (diffuse) to 1.0 (concentrated)
uniform float specularStrength;

// Depth/Foam properties
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform vec2 resolution;
uniform float foamDepthThreshold;
uniform vec3 foamColor;

// --- Helper Functions ---

// Function to convert non-linear depth buffer value to linear depth in view space
float linearizeDepth(float depth) {
    float zNear = 0.1; // Must match your camera's near plane
    float zFar = 100.0; // Must match your camera's far plane
    float z_n = 2.0 * depth - 1.0;
    return (2.0 * zNear * zFar) / (zFar + zNear - z_n * (zFar - zNear));
}

// 2D Hash function to create procedural points for Voronoi
vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// Voronoi distance function
float voronoi(vec2 uv) {
    vec2 grid_cell = floor(uv);
    vec2 frac_cell = fract(uv);
    float min_dist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor_cell = vec2(float(x), float(y));
            vec2 point = hash2(grid_cell + neighbor_cell);
            float dist = length(neighbor_cell + point - frac_cell);
            min_dist = min(min_dist, dist);
        }
    }
    return min_dist;
}


void main() {
    // --- 1. UV Distortion with Noise ---
    // Sample a noise texture to get a random offset
    vec2 noiseOffset = (texture(noiseTexture, v_uv * 0.2).rg * 2.0 - 1.0) * noiseStrength;
    vec2 distortedUV = v_uv + noiseOffset;

    // --- 2. Quantization (Pixelation) ---
    float q_level = float(quantizationLevel);
    vec2 quantizedUV = floor(distortedUV * q_level) / q_level;

    // --- 3. Panned & Blended Normal Map ---
    // Calculate three different panned UVs based on time
    vec2 pannedUV1 = quantizedUV + time * panSpeed1;
    vec2 pannedUV2 = quantizedUV + time * panSpeed2;
    vec2 pannedUV3 = quantizedUV + time * panSpeed3;

    // Sample the normal map three times
    vec3 normalSample1 = texture(normalMapTexture, pannedUV1).rgb * 2.0 - 1.0;
    vec3 normalSample2 = texture(normalMapTexture, pannedUV2).rgb * 2.0 - 1.0;
    vec3 normalSample3 = texture(normalMapTexture, pannedUV3).rgb * 2.0 - 1.0;

    // Average the samples and re-normalize to get the final tangent-space normal
    vec3 normal_tangent = normalize(normalSample1 + normalSample2 + normalSample3);

    // Transform normal from tangent space to world space
    vec3 N = normalize(v_tbn * normal_tangent);

    // --- 4. Voronoi Texture for Caustics ---
    // Use the continuously distorted UV for a smoother underlying pattern
    float voronoiValue = voronoi(distortedUV * 10.0); // Scale UVs to get more cells
    voronoiValue = pow(1.0 - voronoiValue, 5.0) * 0.5; // Sharpen the edges for a caustic look

    // --- 5. Depth Calculation & Foam ---
    // Get UVs for sampling the full-screen depth texture
    vec2 screenUV = gl_FragCoord.xy / resolution;
    float sceneDepthSample = texture(depthTexture, screenUV).r;

    // Get the linear depth of the geometry behind the water
    // Note: The conversion to view space isn't strictly necessary if you tune foamDepthThreshold well
    float sceneDepth = linearizeDepth(sceneDepthSample);
    
    // Get the linear depth of the water surface itself
    vec4 fragPos_clip = projectionMatrix * viewMatrix * vec4(v_fragPos_world, 1.0);
    float waterDepth = linearizeDepth(fragPos_clip.z / fragPos_clip.w);
    
    // Calculate the difference and determine foam amount
    float depthDifference = sceneDepth - waterDepth;
    float foamFactor = smoothstep(0.0, foamDepthThreshold, -depthDifference);


    // --- 6. Base Color based on Depth ---
    float waterColorDepthFactor = clamp(depthDifference / depthMax, 0.0, 1.0);
    vec3 waterColor = mix(shallowColor, deepColor, waterColorDepthFactor);
    
    // Add caustic highlights from the Voronoi pattern
    waterColor += voronoiValue * shallowColor;
    
    // Mix water color with foam color
    vec3 baseColor = mix(waterColor, foamColor, foamFactor);


    // --- 7. Lighting (Blinn-Phong) ---
    vec3 lightDir = normalize(lightPos_world - v_fragPos_world);
    vec3 viewDir = normalize(viewPos_world - v_fragPos_world);

    // Diffuse
    float diff = max(dot(N, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // Specular
    vec3 halfwayDir = normalize(lightDir + viewDir);
    // The smoothness uniform (0-1) is mapped to a wide shininess range (e.g., 2 to 512)
    float shininess = mix(2.0, 512.0, smoothness);
    float spec = pow(max(dot(N, halfwayDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;
    
    // --- Final Combination ---
    vec3 finalColor = (diffuse * baseColor) + specular;
    fragColor = vec4(finalColor, 1.0);
}
