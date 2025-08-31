#include <iostream>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// --- Settings ---
const unsigned int SCREEN_WIDTH = 1000;
const unsigned int SCREEN_HEIGHT = 600;

// --- Mouse and Scrolling State ---
bool isDragging = false;
double lastMouseX = 0.0;
// This holds the panel's horizontal position, updated by mouse drags
float scrollOffsetX = 0.0f;

// --- Callbacks ---
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods);
void cursor_position_callback(GLFWwindow* window, double xpos, double ypos);

// --- Shader Source Code ---
// Simple Vertex Shader to apply transformations
const char* vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 aPos;
    uniform mat4 mvp; // Model-View-Projection Matrix
    void main() {
        gl_Position = mvp * vec4(aPos, 1.0);
    }
)";

// Simple Fragment Shader for a solid color
const char* fragmentShaderSource = R"(
    #version 330 core
    out vec4 FragColor;
    void main() {
        FragColor = vec4(0.8f, 0.2f, 0.2f, 1.0f); // A nice red color
    }
)";


int main() {
    // --- 1. Initialize GLFW and Window ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Scrollable Panel", NULL, NULL);
    if (window == NULL) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    // --- 2. Initialize GLEW ---
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }
    
    // --- 3. Set GLFW Callbacks ---
    glfwSetMouseButtonCallback(window, mouse_button_callback);
    glfwSetCursorPosCallback(window, cursor_position_callback);

    // --- 4. Build and Compile Shaders ---
    // Vertex Shader
    unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);
    // Fragment Shader
    unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);
    // Shader Program
    unsigned int shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    // --- 5. Define Panel Geometry ---
    // A wide panel, wider than the screen, centered initially
    float panelWidth = 2000.0f;
    float panelHeight = 400.0f;
    float panelX = (SCREEN_WIDTH / 2.0f);
    float panelY = (SCREEN_HEIGHT / 2.0f);

    float vertices[] = {
        // positions (as two triangles)
        panelX - panelWidth / 2, panelY - panelHeight / 2, 0.0f, // Bottom Left
        panelX + panelWidth / 2, panelY - panelHeight / 2, 0.0f, // Bottom Right
        panelX + panelWidth / 2, panelY + panelHeight / 2, 0.0f, // Top Right

        panelX + panelWidth / 2, panelY + panelHeight / 2, 0.0f, // Top Right
        panelX - panelWidth / 2, panelY + panelHeight / 2, 0.0f, // Top Left
        panelX - panelWidth / 2, panelY - panelHeight / 2, 0.0f  // Bottom Left
    };

    unsigned int VAO, VBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // --- 6. Main Render Loop ---
    while (!glfwWindowShouldClose(window)) {
        // Clear the screen
        glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // Activate the shader
        glUseProgram(shaderProgram);

        // --- Create Transformations ---
        // Model matrix: applies the horizontal scroll offset
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(scrollOffsetX, 0.0f, 0.0f));

        // View matrix: can be identity for simple 2D
        glm::mat4 view = glm::mat4(1.0f);
        
        // Projection matrix: orthographic projection maps world coordinates to screen pixels
        glm::mat4 projection = glm::ortho(0.0f, (float)SCREEN_WIDTH, 0.0f, (float)SCREEN_HEIGHT, -1.0f, 1.0f);

        // Combine them into a single MVP matrix
        glm::mat4 mvp = projection * view * model;

        // Pass the MVP matrix to the shader
        unsigned int mvpLoc = glGetUniformLocation(shaderProgram, "mvp");
        glUniformMatrix4fv(mvpLoc, 1, GL_FALSE, glm::value_ptr(mvp));

        // Draw the panel
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);

        // Swap buffers and poll events
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // --- 7. Cleanup ---
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);

    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}


// --- Callback Implementations ---

/**
 * @brief Handles mouse button clicks.
 */
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods) {
    if (button == GLFW_MOUSE_BUTTON_LEFT) {
        if (action == GLFW_PRESS) {
            isDragging = true;
            // Record the mouse position when dragging starts
            glfwGetCursorPos(window, &lastMouseX, nullptr);
        } else if (action == GLFW_RELEASE) {
            isDragging = false;
        }
    }
}

/**
 * @brief Handles mouse movement.
 */
void cursor_position_callback(GLFWwindow* window, double xpos, double ypos) {
    if (isDragging) {
        // Calculate the change in mouse position (dx)
        double dx = xpos - lastMouseX;
        
        // Add the change to our total scroll offset
        scrollOffsetX += static_cast<float>(dx);
        
        // Update the last mouse position for the next frame
        lastMouseX = xpos;
    }
}
