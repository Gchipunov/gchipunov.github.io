// =================================================================================================
// Volumetric Transparent Cube with OpenGL, GLFW, and GLEW
//
// This program demonstrates how to render a cube that appears to have a
// volumetric, transparent interior. The effect is achieved through a GLSL shader
// that simulates light traveling through a noisy medium.
//
// Dependencies:
// - GLEW (The OpenGL Extension Wrangler Library)
// - GLFW (A multi-platform library for OpenGL, OpenGL ES, Vulkan, window and input)
// - GLM (OpenGL Mathematics)
//
// Compilation (Example using g++ on Linux/macOS):
// g++ main.cpp -o volumetric_cube -lGLEW -lglfw -lGL -I/path/to/glm
//
// On Windows, you'll need to link against the appropriate .lib files.
// =================================================================================================

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <iostream>

// GLM for matrix transformations
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// --- Shader Source Code ---

// Vertex Shader:
// Transforms vertex positions from model space to clip space.
// It also passes the world position of the vertex to the fragment shader.
const char* vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 aPos;

    // Transformation matrices
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;

    // Output vertex position in world space to the fragment shader
    out vec3 FragPos;

    void main()
    {
        // Calculate the world position of the vertex
        FragPos = vec3(model * vec4(aPos, 1.0));
        // Calculate the final clip space position
        gl_Position = projection * view * model * vec4(aPos, 1.0);
    }
)";

// Fragment Shader:
// This is where the volumetric effect is created.
// It uses a technique called ray marching to simulate light passing through the cube's volume.
// A 3D noise function creates the "cloudy" or "gaseous" look inside.
const char* fragmentShaderSource = R"(
    #version 330 core
    out vec4 FragColor;

    // Input from the vertex shader (world position)
    in vec3 FragPos;

    // Uniforms
    uniform vec3 viewPos; // Camera position
    uniform float time;   // Time for animation

    // --- 3D Simplex Noise Function ---
    // A classic noise function to generate procedural textures. This gives us the "volume".
    // This implementation is a common, simplified version for demonstration.
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857; // 1.0/7.0
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    // --- End of Noise Function ---

    void main()
    {
        // --- Ray Marching Setup ---
        // Calculate the direction of the ray from the camera to the current fragment
        vec3 rayDir = normalize(FragPos - viewPos);
        // The starting point of the ray is the fragment's position on the cube's surface
        vec3 rayPos = FragPos;

        // --- Ray Marching Parameters ---
        int maxSteps = 64; // Maximum number of steps to take
        float stepSize = 0.05; // Size of each step
        float densityThreshold = 0.2; // Density value at which we consider it "solid"
        vec4 accumulatedColor = vec4(0.0); // Final color to be accumulated

        // --- The Ray Marching Loop ---
        for(int i = 0; i < maxSteps; i++)
        {
            // Sample the 3D noise at the current position along the ray.
            // We scale the position and add time to animate the noise pattern.
            float density = snoise(rayPos * 5.0 + time * 0.5);

            // If the sampled density is above our threshold, we accumulate color.
            if(density > densityThreshold)
            {
                // The color is based on the density and position, creating variation.
                vec4 sampleColor = vec4(0.1, 0.4, 0.8, 0.05); // A blueish haze
                sampleColor.rgb *= density; // Brighter for denser areas
                sampleColor.rgb += vec3(rayPos.x, rayPos.y, 0.0) * 0.1; // Add some color variation

                // Alpha compositing: new_color = old_color + (1 - old_alpha) * sample_color
                // This blends the new sample color with what we've already accumulated.
                accumulatedColor.rgb += (1.0 - accumulatedColor.a) * sampleColor.rgb * sampleColor.a;
                accumulatedColor.a += (1.0 - accumulatedColor.a) * sampleColor.a;
            }

            // Move the ray position forward
            rayPos += rayDir * stepSize;

            // Optimization: If the color is fully opaque, we can stop early.
            if(accumulatedColor.a > 0.99)
                break;
        }

        FragColor = accumulatedColor;
    }
)";

// Function to compile a shader and check for errors
void compileShader(GLuint shader, const char* source, const std::string& type) {
    glShaderSource(shader, 1, &source, NULL);
    glCompileShader(shader);
    int success;
    char infoLog[512];
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(shader, 512, NULL, infoLog);
        std::cerr << "ERROR::SHADER::" << type << "::COMPILATION_FAILED\n" << infoLog << std::endl;
    }
}

int main()
{
    // --- 1. Initialize GLFW ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // --- 2. Create a Window ---
    GLFWwindow* window = glfwCreateWindow(800, 600, "Volumetric Cube", NULL, NULL);
    if (window == NULL) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    // --- 3. Initialize GLEW ---
    glewExperimental = GL_TRUE;
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    // --- 4. Configure OpenGL State ---
    glEnable(GL_DEPTH_TEST); // Enable depth testing
    glEnable(GL_BLEND);      // Enable blending for transparency
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA); // Standard alpha blending

    // --- 5. Compile and Link Shaders ---
    GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
    compileShader(vertexShader, vertexShaderSource, "VERTEX");

    GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    compileShader(fragmentShader, fragmentShaderSource, "FRAGMENT");

    GLuint shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);

    // Check for linking errors
    int success;
    char infoLog[512];
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        std::cerr << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
    }
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);


    // --- 6. Define Cube Geometry ---
    // A cube has 8 vertices and 36 indices (6 faces * 2 triangles * 3 vertices)
    float vertices[] = {
        // positions
        -0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f
    };

    unsigned int indices[] = {
        0, 1, 2, 2, 3, 0, // back face
        4, 5, 6, 6, 7, 4, // front face
        3, 2, 6, 6, 7, 3, // top face
        0, 1, 5, 5, 4, 0, // bottom face
        0, 3, 7, 7, 4, 0, // left face
        1, 2, 6, 6, 5, 1  // right face
    };

    // --- 7. Create Buffers (VAO, VBO, EBO) ---
    GLuint VBO, VAO, EBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    // Position attribute
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // --- 8. Render Loop ---
    while (!glfwWindowShouldClose(window))
    {
        // --- Input ---
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        // --- Rendering ---
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Use our shader program
        glUseProgram(shaderProgram);

        // --- Set up Transformations ---
        // Projection matrix (perspective)
        glm::mat4 projection = glm::perspective(glm::radians(45.0f), 800.0f / 600.0f, 0.1f, 100.0f);
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, glm::value_ptr(projection));

        // View matrix (camera)
        glm::vec3 cameraPos = glm::vec3(0.0f, 0.0f, 3.0f);
        glm::mat4 view = glm::lookAt(cameraPos, glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(0.0f, 1.0f, 0.0f));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "view"), 1, GL_FALSE, glm::value_ptr(view));
        glUniform3fv(glGetUniformLocation(shaderProgram, "viewPos"), 1, glm::value_ptr(cameraPos));

        // Model matrix (rotation)
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::rotate(model, (float)glfwGetTime() * glm::radians(30.0f), glm::vec3(0.5f, 1.0f, 0.0f));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));

        // Pass time to the shader for animation
        glUniform1f(glGetUniformLocation(shaderProgram, "time"), (float)glfwGetTime());

        // --- Draw the Cube ---
        glBindVertexArray(VAO);
        glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0);

        // --- Swap Buffers and Poll Events ---
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // --- 9. Clean up ---
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}
