#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>

// --- Configuration (same as before) ---
const int WINDOW_WIDTH = 800;
const int WINDOW_HEIGHT = 600;
const int CELL_SIZE = 4;

const int GRID_WIDTH = WINDOW_WIDTH / CELL_SIZE;
const int GRID_HEIGHT = WINDOW_HEIGHT / CELL_SIZE;

// Particle type (0 for empty, 1 for sand/water)
using Grid = std::vector<std::vector<int>>;

// --- Simulation Logic (unchanged from SFML version) ---
void updateSimulation(Grid& grid) {
    // Iterate from bottom to top to avoid updating a particle twice in one frame
    for (int y = GRID_HEIGHT - 2; y >= 0; --y) {
        for (int x = 0; x < GRID_WIDTH; ++x) {
            if (grid[y][x] == 1) {
                // 1. Check below
                if (y + 1 < GRID_HEIGHT && grid[y + 1][x] == 0) {
                    grid[y][x] = 0;
                    grid[y + 1][x] = 1;
                    continue;
                }

                // 2. Check diagonals
                bool goLeft = (std::rand() % 2 == 0);
                if (goLeft) {
                    if (x > 0 && y + 1 < GRID_HEIGHT && grid[y + 1][x - 1] == 0) {
                        grid[y][x] = 0;
                        grid[y + 1][x - 1] = 1;
                        continue;
                    }
                    if (x < GRID_WIDTH - 1 && y + 1 < GRID_HEIGHT && grid[y + 1][x + 1] == 0) {
                        grid[y][x] = 0;
                        grid[y + 1][x + 1] = 1;
                        continue;
                    }
                } else {
                    if (x < GRID_WIDTH - 1 && y + 1 < GRID_HEIGHT && grid[y + 1][x + 1] == 0) {
                        grid[y][x] = 0;
                        grid[y + 1][x + 1] = 1;
                        continue;
                    }
                    if (x > 0 && y + 1 < GRID_HEIGHT && grid[y + 1][x - 1] == 0) {
                        grid[y][x] = 0;
                        grid[y + 1][x - 1] = 1;
                        continue;
                    }
                }

                // 3. Spread sideways
                if (goLeft) {
                    if (x > 0 && grid[y][x - 1] == 0) {
                        grid[y][x] = 0;
                        grid[y][x - 1] = 1;
                        continue;
                    }
                    if (x < GRID_WIDTH - 1 && grid[y][x + 1] == 0) {
                        grid[y][x] = 0;
                        grid[y][x + 1] = 1;
                        continue;
                    }
                } else {
                    if (x < GRID_WIDTH - 1 && grid[y][x + 1] == 0) {
                        grid[y][x] = 0;
                        grid[y][x + 1] = 1;
                        continue;
                    }
                    if (x > 0 && grid[y][x - 1] == 0) {
                        grid[y][x] = 0;
                        grid[y][x - 1] = 1;
                        continue;
                    }
                }
            }
        }
    }
}


// --- OpenGL Shader Code ---

// Vertex Shader: Positions each particle instance
const char* vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec2 aPos;
    layout (location = 1) in vec2 aOffset;

    uniform mat4 projection;

    void main()
    {
        // The final position is the base vertex position offset by the instance's specific position
        gl_Position = projection * vec4(aPos + aOffset, 0.0, 1.0);
    }
)";

// Fragment Shader: Colors each particle
const char* fragmentShaderSource = R"(
    #version 330 core
    out vec4 FragColor;

    void main()
    {
        // Set the particle color (a nice light blue)
        FragColor = vec4(0.47, 0.86, 1.0, 1.0);
    }
)";


// --- Main Application ---
int main() {
    // --- 1. Initialize GLFW and GLEW ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    // Set OpenGL version to 3.3 Core Profile
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // Create a window
    GLFWwindow* window = glfwCreateWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "OpenGL Water/Sand Simulation", NULL, NULL);
    if (window == NULL) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    // Initialize GLEW
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    glViewport(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

    // --- 2. Compile Shaders ---
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

    // --- 3. Set up Vertex Data and Buffers for Instancing ---
    // A single quad (particle) defined by 4 vertices
    float quadVertices[] = {
        0.0f, (float)CELL_SIZE,
        (float)CELL_SIZE, (float)CELL_SIZE,
        0.0f, 0.0f,
        (float)CELL_SIZE, 0.0f
    };

    unsigned int VAO, VBO, instanceVBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &instanceVBO);

    glBindVertexArray(VAO);

    // VBO for the quad's vertices
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), quadVertices, GL_STATIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);

    // VBO for the instance positions (offsets)
    glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
    // We'll upload data later, so we just reserve space for now.
    // The maximum number of particles is the grid size.
    glBufferData(GL_ARRAY_BUFFER, sizeof(glm::vec2) * GRID_WIDTH * GRID_HEIGHT, NULL, GL_DYNAMIC_DRAW);
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
    
    // This is the key for instancing:
    // It tells OpenGL to only advance this attribute once per instance
    glVertexAttribDivisor(1, 1);

    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // --- 4. Initialize Simulation Grid ---
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    Grid grid(GRID_HEIGHT, std::vector<int>(GRID_WIDTH, 0));
    std::vector<glm::vec2> particlePositions;
    particlePositions.reserve(GRID_WIDTH * GRID_HEIGHT);

    // --- 5. Main Loop ---
    while (!glfwWindowShouldClose(window)) {
        // --- Input ---
        if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_LEFT) == GLFW_PRESS) {
            double xpos, ypos;
            glfwGetCursorPos(window, &xpos, &ypos);
            int gridX = static_cast<int>(xpos / CELL_SIZE);
            int gridY = static_cast<int>(ypos / CELL_SIZE);

            // Add a cluster of particles
            for (int i = -4; i <= 4; ++i) {
                for (int j = -4; j <= 4; ++j) {
                    if (std::rand() % 2 == 0) {
                        int nx = gridX + i;
                        int ny = gridY + j;
                        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                            grid[ny][nx] = 1;
                        }
                    }
                }
            }
        }

        // --- Update Simulation ---
        updateSimulation(grid);

        // --- Prepare data for rendering ---
        particlePositions.clear();
        for (int y = 0; y < GRID_HEIGHT; ++y) {
            for (int x = 0; x < GRID_WIDTH; ++x) {
                if (grid[y][x] == 1) {
                    // We need to flip the y-coordinate because grid's origin (0,0) is top-left,
                    // while OpenGL's screen coordinate origin is bottom-left.
                    particlePositions.emplace_back(x * CELL_SIZE, WINDOW_HEIGHT - (y * CELL_SIZE) - CELL_SIZE);
                }
            }
        }

        // --- Render ---
        glClearColor(0.08f, 0.08f, 0.16f, 1.0f); // Dark blue background
        glClear(GL_COLOR_BUFFER_BIT);

        if (!particlePositions.empty()) {
            // Update the instance VBO with the new particle positions
            glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
            glBufferSubData(GL_ARRAY_BUFFER, 0, particlePositions.size() * sizeof(glm::vec2), particlePositions.data());
            glBindBuffer(GL_ARRAY_BUFFER, 0);

            // Use the shader program
            glUseProgram(shaderProgram);

            // Set up the projection matrix (orthographic)
            glm::mat4 projection = glm::ortho(0.0f, (float)WINDOW_WIDTH, 0.0f, (float)WINDOW_HEIGHT);
            glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, &projection[0][0]);

            // Draw all the particles in one go
            glBindVertexArray(VAO);
            glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 4, particlePositions.size());
            glBindVertexArray(0);
        }

        // --- Swap Buffers and Poll Events ---
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // --- Cleanup ---
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &instanceVBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}
