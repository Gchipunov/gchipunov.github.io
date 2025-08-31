#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <chrono>

#include <GL/glew.h>
#include <GLFW/glfw3.h>

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

// --- Shader Loading Utility ---
// A simple utility function to read shader files
std::string readShaderFile(const std::string& filePath) {
    std::ifstream shaderFile(filePath);
    if (!shaderFile.is_open()) {
        std::cerr << "Could not open shader file: " << filePath << std::endl;
        return "";
    }
    std::stringstream buffer;
    buffer << shaderFile.rdbuf();
    return buffer.str();
}

// A simple utility to compile shaders and link them into a program
GLuint createShaderProgram(const std::string& vertexPath, const std::string& fragmentPath) {
    std::string vertexCode = readShaderFile(vertexPath);
    std::string fragmentCode = readShaderFile(fragmentPath);

    const char* vShaderCode = vertexCode.c_str();
    const char* fShaderCode = fragmentCode.c_str();

    GLuint vertex, fragment;
    int success;
    char infoLog[512];

    // Vertex Shader
    vertex = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertex, 1, &vShaderCode, NULL);
    glCompileShader(vertex);
    glGetShaderiv(vertex, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertex, 512, NULL, infoLog);
        std::cerr << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
    }

    // Fragment Shader
    fragment = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragment, 1, &fShaderCode, NULL);
    glCompileShader(fragment);
    glGetShaderiv(fragment, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragment, 512, NULL, infoLog);
        std::cerr << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
    }

    // Shader Program
    GLuint program = glCreateProgram();
    glAttachShader(program, vertex);
    glAttachShader(program, fragment);
    glLinkProgram(program);
    glGetProgramiv(program, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(program, 512, NULL, infoLog);
        std::cerr << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
    }

    glDeleteShader(vertex);
    glDeleteShader(fragment);

    return program;
}

// --- Notification State ---
enum class NotificationState {
    HIDDEN,
    ANIMATING_IN,
    VISIBLE,
    ANIMATING_OUT
};

NotificationState currentState = NotificationState::HIDDEN;
std::chrono::steady_clock::time_point visibleStartTime;

void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods) {
    // Press 'N' to trigger the notification
    if (key == GLFW_KEY_N && action == GLFW_PRESS) {
        if (currentState == NotificationState::HIDDEN) {
            currentState = NotificationState::ANIMATING_IN;
        }
    }
}


int main() {
    // --- GLFW/GLEW Initialization ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    const unsigned int SCR_WIDTH = 1280;
    const unsigned int SCR_HEIGHT = 720;
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "OpenGL Notification", NULL, NULL);
    if (window == NULL) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetKeyCallback(window, key_callback);

    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    // Enable blending for transparency
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    
    // --- Shader Program ---
    GLuint shaderProgram = createShaderProgram("vertexShader.glsl", "fragmentShader.glsl");

    // --- Quad Geometry ---
    float quadWidth = 400.0f;
    float quadHeight = 100.0f;

    float vertices[] = {
        // positions
        0.0f,      quadHeight, // Top-left
        0.0f,      0.0f,       // Bottom-left
        quadWidth, 0.0f,       // Bottom-right
        quadWidth, quadHeight  // Top-right
    };

    unsigned int indices[] = {
        0, 1, 2, // first triangle
        0, 2, 3  // second triangle
    };

    GLuint VAO, VBO, EBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // --- Animation & Rendering Variables ---
    float yPosHidden = SCR_HEIGHT + quadHeight; // Start above the screen
    float yPosVisible = SCR_HEIGHT - quadHeight - 20.0f; // 20px padding from top
    float currentY = yPosHidden;
    float animationSpeed = 1000.0f; // pixels per second

    float lastFrameTime = 0.0f;

    // --- Main Loop ---
    while (!glfwWindowShouldClose(window)) {
        // --- Timing ---
        float currentFrameTime = glfwGetTime();
        float deltaTime = currentFrameTime - lastFrameTime;
        lastFrameTime = currentFrameTime;

        // --- State Machine Logic ---
        switch (currentState) {
            case NotificationState::ANIMATING_IN:
                currentY -= animationSpeed * deltaTime;
                if (currentY <= yPosVisible) {
                    currentY = yPosVisible;
                    currentState = NotificationState::VISIBLE;
                    visibleStartTime = std::chrono::steady_clock::now();
                }
                break;

            case NotificationState::VISIBLE:
                {
                    auto now = std::chrono::steady_clock::now();
                    float duration = std::chrono::duration_cast<std::chrono::seconds>(now - visibleStartTime).count();
                    if (duration >= 3) {
                        currentState = NotificationState::ANIMATING_OUT;
                    }
                }
                break;

            case NotificationState::ANIMATING_OUT:
                currentY += animationSpeed * deltaTime;
                if (currentY >= yPosHidden) {
                    currentY = yPosHidden;
                    currentState = NotificationState::HIDDEN;
                }
                break;
            
            case NotificationState::HIDDEN:
                // Do nothing
                break;
        }

        // --- Rendering ---
        glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // Don't draw if it's completely hidden
        if (currentState != NotificationState::HIDDEN || currentY < yPosHidden) {
            glUseProgram(shaderProgram);

            // Projection matrix for 2D UI
            glm::mat4 projection = glm::ortho(0.0f, (float)SCR_WIDTH, 0.0f, (float)SCR_HEIGHT);
            glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, &projection[0][0]);
            
            // Model matrix for position
            glm::mat4 model = glm::mat4(1.0f);
            float xPos = (SCR_WIDTH - quadWidth) / 2.0f; // Center horizontally
            model = glm::translate(model, glm::vec3(xPos, currentY, 0.0f));
            glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, &model[0][0]);

            // Set uniforms for the fragment shader
            glUniform4f(glGetUniformLocation(shaderProgram, "u_Color"), 0.2f, 0.6f, 1.0f, 0.9f); // A nice blue
            glUniform2f(glGetUniformLocation(shaderProgram, "u_Size"), quadWidth, quadHeight);
            glUniform1f(glGetUniformLocation(shaderProgram, "u_Radius"), 20.0f); // 20px corner radius

            glBindVertexArray(VAO);
            glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
        }

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}
