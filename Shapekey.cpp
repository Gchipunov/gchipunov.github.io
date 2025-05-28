// (Includes, window setup, OpenGL context creation - standard boilerplate)

#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <vector>
#include <iostream>

// (Basic shader loading function - omitted for brevity)

// Struct to hold vertex data (position, normal, texture coord)
struct Vertex {
    glm::vec3 position;
    glm::vec3 normal;
    glm::vec2 texCoords;
};

// Global variables for animation control
float blendFactor = 0.0f;
float animationSpeed = 0.1f; // Units per second
bool animating = false;

// Function to load your 3D models (e.g., from OBJ files)
// This is a complex function itself, you'd typically use a library like Assimp
std::vector<Vertex> loadModel(const char* path) {
    // Implement model loading (e.g., parse OBJ)
    // For simplicity, imagine this returns a vector of Vertex structs
    // IMPORTANT: Ensure garage and truck models have the same number of vertices
    // and that their corresponding vertices are 'logically' related for morphing.
    std::cout << "Loading model: " << path << std::endl;
    // ... actual loading code ...
    return {}; // Placeholder
}

int main() {
    // ... GLFW initialization, window creation ...

    // Load your models
    std::vector<Vertex> garageVertices = loadModel("path/to/garage.obj");
    std::vector<Vertex> truckVertices = loadModel("path/to/truck.obj");

    // Ensure they have the same number of vertices for simple blending
    if (garageVertices.size() != truckVertices.size()) {
        std::cerr << "Error: Vertex counts mismatch for morphing!" << std::endl;
        return -1;
    }

    // Prepare VBOs and VAOs
    GLuint VAO, VBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);

    // Allocate buffer space for both sets of positions + other attributes
    // A more advanced approach might use two VBOs for positions and one for shared attributes
    glBufferData(GL_ARRAY_BUFFER, garageVertices.size() * sizeof(Vertex) * 2, NULL, GL_DYNAMIC_DRAW); // Enough space for both models

    // Upload initial garage data (or blend of both if starting mid-animation)
    glBufferSubData(GL_ARRAY_BUFFER, 0, garageVertices.size() * sizeof(Vertex), garageVertices.data());
    // You might also upload the truck data into a separate offset in the same VBO
    // or use a second VBO just for the truck positions.

    // Define vertex attribute pointers
    // Position 1 (Garage) - attribute 0
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
    glEnableVertexAttribArray(0);

    // Normal 1 (Garage) - attribute 1
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(offsetof(Vertex, normal)));
    glEnableVertexAttribArray(1);

    // TexCoords 1 (Garage) - attribute 2
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(offsetof(Vertex, texCoords)));
    glEnableVertexAttribArray(2);

    // Position 2 (Truck) - attribute 3
    // Assuming truck data is stored right after garage data in the same VBO
    // Or you can bind a second VBO for truck positions
    glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(garageVertices.size() * sizeof(Vertex) + 0));
    glEnableVertexAttribArray(3);

    // Normal 2 (Truck) - attribute 4
    glVertexAttribPointer(4, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(garageVertices.size() * sizeof(Vertex) + offsetof(Vertex, normal)));
    glEnableVertexAttribArray(4);

    // Compile and link shaders
    GLuint shaderProgram = createShaderProgram("vertex.glsl", "fragment.glsl");
    glUseProgram(shaderProgram);

    // Get uniform locations
    GLint modelLoc = glGetUniformLocation(shaderProgram, "model");
    GLint viewLoc = glGetUniformLocation(shaderProgram, "view");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "projection");
    GLint blendFactorLoc = glGetUniformLocation(shaderProgram, "blendFactor");

    // (Camera setup, projection matrix)
    glm::mat4 projection = glm::perspective(glm::radians(45.0f), (float)800 / (float)600, 0.1f, 100.0f);
    glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));

    double lastTime = glfwGetTime();

    // Render loop
    while (!glfwWindowShouldClose(window)) {
        double currentTime = glfwGetTime();
        double deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Animation logic
        if (animating) {
            blendFactor += animationSpeed * deltaTime;
            if (blendFactor > 1.0f) {
                blendFactor = 1.0f;
                animating = false; // Stop animation when complete
            }
        }
        // You could also animate back to 0.0f or use keyboard input

        // Clear buffers
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Update uniforms
        glUniform1f(blendFactorLoc, blendFactor);

        // (Calculate model and view matrices - e.g., camera movement)
        glm::mat4 model = glm::mat4(1.0f);
        glm::mat4 view = glm::lookAt(glm::vec3(0.0f, 0.0f, 5.0f), glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(0.0f, 1.0f, 0.0f));

        glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
        glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

        // Draw
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, garageVertices.size()); // Assuming garage and truck have same vertex count

        // Swap buffers and poll events
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // Cleanup
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}

// Function to handle keyboard input (to start/stop animation)
void processInput(GLFWwindow *window) {
    if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS) {
        animating = !animating; // Toggle animation
        if (!animating) {
            blendFactor = 0.0f; // Reset if stopped
        }
    }
}
