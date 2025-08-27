#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <vector>

// GLM for mathematics
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// --- Shader Source Code (or load from files) ---
const char* vertexShaderSource = "#version 330 core\n"
    "layout (location = 0) in vec2 aPos;\n"
    "uniform mat4 model;\n"
    "uniform mat4 projection;\n"
    "void main()\n"
    "{\n"
    "   gl_Position = projection * model * vec4(aPos.x, aPos.y, 0.0, 1.0);\n"
    "}\0";

const char* fragmentShaderSource = "#version 330 core\n"
    "out vec4 FragColor;\n"
    "uniform vec3 objectColor;\n"
    "void main()\n"
    "{\n"
    "   FragColor = vec4(objectColor, 1.0f);\n"
    "}\n\0";

// --- Global Variables ---
// Window dimensions
const int SCREEN_WIDTH = 800;
const int SCREEN_HEIGHT = 600;

// Player properties
glm::vec2 playerPos(100.0f, 300.0f);
glm::vec2 playerSize(30.0f, 50.0f);
glm::vec2 playerVelocity(0.0f, 0.0f);
bool isGrounded = false;

// Physics constants
const float GRAVITY = -0.05f;
const float JUMP_FORCE = 1.5f;
const float MOVE_SPEED = 0.5f;

// Struct to hold platform data
struct Platform {
    glm::vec2 position;
    glm::vec2 size;
};

// --- Helper Functions ---
// Function to compile shaders and link them into a program
unsigned int compileShaders();
// Function to process keyboard input
void processInput(GLFWwindow *window);


int main() {
    // --- 1. Initialize GLFW and GLEW ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "2D Platformer", NULL, NULL);
    if (window == NULL) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    glViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // --- 2. Compile Shaders ---
    unsigned int shaderProgram = compileShaders();
    glUseProgram(shaderProgram);

    // --- 3. Set up Vertex Data for a Quad ---
    float vertices[] = {
        // positions
        0.5f,  0.5f, // top right
        0.5f, -0.5f, // bottom right
       -0.5f, -0.5f, // bottom left
       -0.5f,  0.5f  // top left 
    };
    unsigned int indices[] = {
        0, 1, 3, // first triangle
        1, 2, 3  // second triangle
    };

    unsigned int VBO, VAO, EBO;
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

    // --- 4. Define Platforms ---
    std::vector<Platform> platforms;
    platforms.push_back({glm::vec2(400.0f, 50.0f), glm::vec2(800.0f, 50.0f)});  // Floor
    platforms.push_back({glm::vec2(150.0f, 200.0f), glm::vec2(200.0f, 20.0f)});
    platforms.push_back({glm::vec2(500.0f, 350.0f), glm::vec2(250.0f, 20.0f)});
    platforms.push_back({glm::vec2(250.0f, 450.0f), glm::vec2(150.0f, 20.0f)});


    // --- 5. Set up Projection Matrix ---
    glm::mat4 projection = glm::ortho(0.0f, (float)SCREEN_WIDTH, 0.0f, (float)SCREEN_HEIGHT, -1.0f, 1.0f);
    glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, glm::value_ptr(projection));


    // --- 6. Main Game Loop ---
    while (!glfwWindowShouldClose(window)) {
        // --- Input ---
        processInput(window);

        // --- Update (Physics & Logic) ---
        // Apply gravity
        playerVelocity.y += GRAVITY;

        // Store player's previous Y position for collision resolution
        float prevPlayerY = playerPos.y;

        // Update position based on velocity
        playerPos += playerVelocity;

        // Naive friction/drag
        playerVelocity.x *= 0.85f;

        // Collision detection and resolution
        isGrounded = false;
        for (const auto& platform : platforms) {
            // AABB Collision Check
            bool collisionX = playerPos.x + playerSize.x / 2 > platform.position.x - platform.size.x / 2 &&
                              platform.position.x + platform.size.x / 2 > playerPos.x - playerSize.x / 2;
            bool collisionY = playerPos.y + playerSize.y / 2 > platform.position.y - platform.size.y / 2 &&
                              platform.position.y + platform.size.y / 2 > playerPos.y - playerSize.y / 2;

            if (collisionX && collisionY) {
                // Check if the player was above the platform in the previous frame
                // And is currently colliding or below it
                bool wasAbove = prevPlayerY - playerSize.y / 2 >= platform.position.y + platform.size.y / 2;
                
                if (playerVelocity.y <= 0 && wasAbove) {
                    playerPos.y = platform.position.y + platform.size.y / 2 + playerSize.y / 2;
                    playerVelocity.y = 0;
                    isGrounded = true;
                }
            }
        }
        
        // --- Render ---
        glClearColor(0.1f, 0.2f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glUseProgram(shaderProgram);
        glBindVertexArray(VAO);

        // Draw Player (Blue)
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(playerPos, 0.0f));
        model = glm::scale(model, glm::vec3(playerSize, 1.0f));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));
        glUniform3f(glGetUniformLocation(shaderProgram, "objectColor"), 0.2f, 0.4f, 1.0f);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

        // Draw Platforms (Green)
        for (const auto& platform : platforms) {
            model = glm::mat4(1.0f);
            model = glm::translate(model, glm::vec3(platform.position, 0.0f));
            model = glm::scale(model, glm::vec3(platform.size, 1.0f));
            glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));
            glUniform3f(glGetUniformLocation(shaderProgram, "objectColor"), 0.2f, 0.8f, 0.3f);
            glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
        }

        // --- Swap Buffers and Poll Events ---
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // --- 7. Cleanup ---
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}

void processInput(GLFWwindow *window) {
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
        
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS || glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS)
        playerVelocity.x = -MOVE_SPEED;
        
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS || glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS)
        playerVelocity.x = MOVE_SPEED;

    // Jump only if the player is on the ground
    if ((glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS || glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS) && isGrounded) {
        playerVelocity.y = JUMP_FORCE;
        isGrounded = false; // Prevent double-jumping in the same frame
    }
}

unsigned int compileShaders() {
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
    // Delete the shaders as they're linked into our program now and no longer necessary
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
    return shaderProgram;
}
