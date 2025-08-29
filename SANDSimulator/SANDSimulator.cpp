#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <vector>
#include <random>

// --- Configuration ---
const int GRID_WIDTH = 120;
const int GRID_HEIGHT = 90;
const int WINDOW_WIDTH = 1200;
const int WINDOW_HEIGHT = 900;
const float CELL_WIDTH = (float)WINDOW_WIDTH / GRID_WIDTH;
const float CELL_HEIGHT = (float)WINDOW_HEIGHT / GRID_HEIGHT;

// --- Particle Types ---
enum ParticleType {
    EMPTY = 0,
    SAND = 1,
    WALL = 2
};

// --- Grid ---
std::vector<std::vector<int>> grid(GRID_HEIGHT, std::vector<int>(GRID_WIDTH, EMPTY));

// --- Function Prototypes ---
void updateSand();
void drawGrid();
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods);
void cursor_position_callback(GLFWwindow* window, double xpos, double ypos);
void addParticle(int x, int y, ParticleType type);

// --- Main Program ---
int main() {
    // --- 1. Initialize GLFW ---
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    // --- 2. Create a Window ---
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "Sand Simulator", NULL, NULL);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    // --- 3. Initialize GLEW ---
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    // --- 4. Configure OpenGL ---
    glViewport(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0.0, WINDOW_WIDTH, WINDOW_HEIGHT, 0.0, -1.0, 1.0); // Set up coordinate system
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    // --- 5. Set Callbacks ---
    glfwSetMouseButtonCallback(window, mouse_button_callback);
    glfwSetCursorPosCallback(window, cursor_position_callback);

    // --- 6. Main Loop ---
    while (!glfwWindowShouldClose(window)) {
        // --- Update ---
        updateSand();

        // --- Render ---
        glClear(GL_COLOR_BUFFER_BIT);
        drawGrid();

        // --- Swap Buffers & Poll Events ---
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // --- Cleanup ---
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}

// --- Add a particle to the grid ---
void addParticle(int x, int y, ParticleType type) {
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        if(grid[y][x] == EMPTY) {
            grid[y][x] = type;
        }
    }
}

// --- Simulation Logic ---
void updateSand() {
    // We iterate from bottom to top to ensure a particle moves only once per frame
    for (int y = GRID_HEIGHT - 2; y >= 0; --y) {
        for (int x = 0; x < GRID_WIDTH; ++x) {
            if (grid[y][x] == SAND) {
                // Rule 1: Fall down
                if (y + 1 < GRID_HEIGHT && grid[y + 1][x] == EMPTY) {
                    grid[y + 1][x] = SAND;
                    grid[y][x] = EMPTY;
                }
                // Rule 2: Fall down-left or down-right
                else {
                    bool canGoLeft = (x > 0 && y + 1 < GRID_HEIGHT && grid[y + 1][x - 1] == EMPTY);
                    bool canGoRight = (x < GRID_WIDTH - 1 && y + 1 < GRID_HEIGHT && grid[y + 1][x + 1] == EMPTY);

                    if (canGoLeft && canGoRight) {
                        // Randomly choose left or right
                        if (rand() % 2 == 0) {
                            grid[y + 1][x - 1] = SAND;
                        } else {
                            grid[y + 1][x + 1] = SAND;
                        }
                        grid[y][x] = EMPTY;
                    } else if (canGoLeft) {
                        grid[y + 1][x - 1] = SAND;
                        grid[y][x] = EMPTY;
                    } else if (canGoRight) {
                        grid[y + 1][x + 1] = SAND;
                        grid[y][x] = EMPTY;
                    }
                }
            }
        }
    }
}

// --- Rendering Logic ---
void drawGrid() {
    glBegin(GL_QUADS);
    for (int y = 0; y < GRID_HEIGHT; ++y) {
        for (int x = 0; x < GRID_WIDTH; ++x) {
            if (grid[y][x] == SAND) {
                // Set sand color (e.g., yellowish)
                glColor3f(0.96f, 0.87f, 0.70f);

                float xPos = x * CELL_WIDTH;
                float yPos = y * CELL_HEIGHT;

                glVertex2f(xPos, yPos);
                glVertex2f(xPos + CELL_WIDTH, yPos);
                glVertex2f(xPos + CELL_WIDTH, yPos + CELL_HEIGHT);
                glVertex2f(xPos, yPos + CELL_HEIGHT);
            }
        }
    }
    glEnd();
}

// --- Input Handling ---
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods) {
    if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS) {
        double xpos, ypos;
        glfwGetCursorPos(window, &xpos, &ypos);
        int gridX = static_cast<int>(xpos / CELL_WIDTH);
        int gridY = static_cast<int>(ypos / CELL_HEIGHT);
        addParticle(gridX, gridY, SAND);
    }
}

void cursor_position_callback(GLFWwindow* window, double xpos, double ypos) {
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_LEFT) == GLFW_PRESS) {
        int gridX = static_cast<int>(xpos / CELL_WIDTH);
        int gridY = static_cast<int>(ypos / CELL_HEIGHT);
        // Add a small cluster of sand for a better feel
        addParticle(gridX, gridY, SAND);
        addParticle(gridX + 1, gridY, SAND);
        addParticle(gridX - 1, gridY, SAND);
        addParticle(gridX, gridY + 1, SAND);
    }
}
