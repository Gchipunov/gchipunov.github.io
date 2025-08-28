#include <glad/glad.h>
#include <glfw/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <cmath>

// --- Shader Class (to load and compile shaders) ---
class Shader {
public:
    unsigned int ID;

    Shader(const char* vertexPath, const char* fragmentPath) {
        std::string vertexCode;
        std::string fragmentCode;
        std::ifstream vShaderFile;
        std::ifstream fShaderFile;

        vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        try {
            vShaderFile.open(vertexPath);
            fShaderFile.open(fragmentPath);
            std::stringstream vShaderStream, fShaderStream;
            vShaderStream << vShaderFile.rdbuf();
            fShaderStream << fShaderFile.rdbuf();
            vShaderFile.close();
            fShaderFile.close();
            vertexCode = vShaderStream.str();
            fragmentCode = fShaderStream.str();
        } catch (std::ifstream::failure& e) {
            std::cout << "ERROR::SHADER::FILE_NOT_SUCCESSFULLY_READ" << std::endl;
        }
        const char* vShaderCode = vertexCode.c_str();
        const char* fShaderCode = fragmentCode.c_str();

        unsigned int vertex, fragment;
        vertex = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vertex, 1, &vShaderCode, NULL);
        glCompileShader(vertex);
        checkCompileErrors(vertex, "VERTEX");

        fragment = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fragment, 1, &fShaderCode, NULL);
        glCompileShader(fragment);
        checkCompileErrors(fragment, "FRAGMENT");

        ID = glCreateProgram();
        glAttachShader(ID, vertex);
        glAttachShader(ID, fragment);
        glLinkProgram(ID);
        checkCompileErrors(ID, "PROGRAM");

        glDeleteShader(vertex);
        glDeleteShader(fragment);
    }

    void use() {
        glUseProgram(ID);
    }

    void setMat4(const std::string& name, const glm::mat4& mat) const {
        glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    }
     void setVec3(const std::string& name, const glm::vec3& value) const {
        glUniform3fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
    }

private:
    void checkCompileErrors(unsigned int shader, std::string type) {
        int success;
        char infoLog[1024];
        if (type != "PROGRAM") {
            glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
            if (!success) {
                glGetShaderInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
            }
        } else {
            glGetProgramiv(shader, GL_LINK_STATUS, &success);
            if (!success) {
                glGetProgramInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
            }
        }
    }
};

// --- Renderer Class (to handle drawing shapes) ---
class Renderer {
public:
    Renderer(Shader& shader) : shader(shader) {
        this->initRenderData();
    }

    ~Renderer() {
        glDeleteVertexArrays(1, &this->quadVAO);
        glDeleteVertexArrays(1, &this->circleVAO);
    }

    void drawRect(glm::vec2 position, glm::vec2 size, glm::vec3 color) {
        this->shader.use();
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(position, 0.0f));
        model = glm::scale(model, glm::vec3(size, 1.0f));

        this->shader.setMat4("model", model);
        this->shader.setVec3("color", color);

        glBindVertexArray(this->quadVAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glBindVertexArray(0);
    }
    
    void drawCircle(glm::vec2 position, float radius, glm::vec3 color) {
        this->shader.use();
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(position, 0.0f));
        model = glm::scale(model, glm::vec3(radius, radius, 1.0f));
        
        this->shader.setMat4("model", model);
        this->shader.setVec3("color", color);
        
        glBindVertexArray(this->circleVAO);
        glDrawArrays(GL_TRIANGLE_FAN, 0, 32); // 30 segments + center + first
        glBindVertexArray(0);
    }

private:
    Shader& shader;
    unsigned int quadVAO;
    unsigned int circleVAO;

    void initRenderData() {
        // Quad (for rectangles)
        unsigned int VBO;
        float vertices[] = {
            // pos
            0.0f, 1.0f,
            1.0f, 0.0f,
            0.0f, 0.0f,

            0.0f, 1.0f,
            1.0f, 1.0f,
            1.0f, 0.0f
        };

        glGenVertexArrays(1, &this->quadVAO);
        glGenBuffers(1, &VBO);

        glBindBuffer(GL_ARRAY_BUFFER, VBO);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

        glBindVertexArray(this->quadVAO);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
        glBindBuffer(GL_ARRAY_BUFFER, 0);
        glBindVertexArray(0);

        // Circle (approximated with a 30-sided polygon)
        unsigned int circleVBO;
        int segments = 30;
        float circleVertices[ (segments + 2) * 2];
        circleVertices[0] = 0.0f; // Center vertex
        circleVertices[1] = 0.0f;
        for (int i = 0; i <= segments; i++) {
            float angle = 2.0f * 3.1415926f * float(i) / float(segments);
            circleVertices[(i + 1) * 2] = cos(angle);
            circleVertices[(i + 1) * 2 + 1] = sin(angle);
        }

        glGenVertexArrays(1, &this->circleVAO);
        glGenBuffers(1, &circleVBO);
        glBindVertexArray(this->circleVAO);
        glBindBuffer(GL_ARRAY_BUFFER, circleVBO);
        glBufferData(GL_ARRAY_BUFFER, sizeof(circleVertices), circleVertices, GL_STATIC_DRAW);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
        glBindBuffer(GL_ARRAY_BUFFER, 0);
        glBindVertexArray(0);
    }
};

// --- Game Objects ---
struct Player {
    glm::vec2 pos, size, velocity;
    bool onGround;
};

struct Platform {
    glm::vec2 pos, size;
};

struct Ball {
    glm::vec2 pos, velocity;
    float radius;
};


// --- Game Class ---
class Game {
public:
    Player player;
    std::vector<Platform> platforms;
    std::vector<Ball> balls;
    unsigned int width, height;

    Game(unsigned int w, unsigned int h) : width(w), height(h) {}

    void init() {
        // Player
        player.pos = glm::vec2(100.0f, 300.0f);
        player.size = glm::vec2(50.0f, 50.0f);
        player.velocity = glm::vec2(0.0f);
        player.onGround = false;

        // Platforms
        platforms.push_back({glm::vec2(0, 0), glm::vec2(width, 50)}); // Floor
        platforms.push_back({glm::vec2(150, 200), glm::vec2(200, 30)});
        platforms.push_back({glm::vec2(500, 350), glm::vec2(150, 30)});
        
        // Balls
        balls.push_back({glm::vec2(600, 500), glm::vec2(-150.0f, 0.0f), 20.0f});
        balls.push_back({glm::vec2(200, 400), glm::vec2(100.0f, -50.0f), 30.0f});
    }

    void processInput(GLFWwindow* window, float dt) {
        float speed = 250.0f;
        if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) {
            player.pos.x -= speed * dt;
        }
        if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) {
            player.pos.x += speed * dt;
        }
        if (player.onGround && glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS) {
            player.velocity.y = 450.0f; // Jump velocity
            player.onGround = false;
        }
    }

    void update(float dt) {
        // --- Player Physics ---
        float gravity = -980.0f;
        player.velocity.y += gravity * dt;
        player.pos += player.velocity * dt;
        player.onGround = false;

        // Player-Platform Collision
        for (const auto& platform : platforms) {
            if (player.pos.x < platform.pos.x + platform.size.x &&
                player.pos.x + player.size.x > platform.pos.x &&
                player.pos.y < platform.pos.y + platform.size.y &&
                player.pos.y + player.size.y > platform.pos.y) {
                
                // Check if player landed on top
                if (player.velocity.y < 0 && (player.pos.y + player.velocity.y * dt) >= platform.pos.y + platform.size.y - 10) {
                     player.pos.y = platform.pos.y + platform.size.y;
                     player.velocity.y = 0;
                     player.onGround = true;
                }
            }
        }
        
        // --- Ball Physics ---
        for (auto& ball : balls) {
            ball.pos += ball.velocity * dt;
            
            // Ball-Wall Collision
            if (ball.pos.x - ball.radius < 0) { ball.pos.x = ball.radius; ball.velocity.x *= -1; }
            if (ball.pos.x + ball.radius > width) { ball.pos.x = width - ball.radius; ball.velocity.x *= -1; }
            if (ball.pos.y - ball.radius < 0) { ball.pos.y = ball.radius; ball.velocity.y *= -1; }
            if (ball.pos.y + ball.radius > height) { ball.pos.y = height - ball.radius; ball.velocity.y *= -1; }

            // Ball-Platform Collision
            for (const auto& p : platforms) {
                glm::vec2 closestPoint = glm::clamp(ball.pos, p.pos, p.pos + p.size);
                glm::vec2 diff = ball.pos - closestPoint;
                if (glm::length(diff) < ball.radius) {
                    ball.pos += glm::normalize(diff) * (ball.radius - glm::length(diff));
                    glm::vec2 normal = glm::normalize(diff);
                    ball.velocity = glm::reflect(ball.velocity, normal);
                }
            }

            // Ball-Player Collision (Pushes the player)
            glm::vec2 closestPointPlayer = glm::clamp(ball.pos, player.pos, player.pos + player.size);
            glm::vec2 diffPlayer = ball.pos - closestPointPlayer;
            if (glm::length(diffPlayer) < ball.radius) {
                player.pos -= glm::normalize(diffPlayer) * 0.5f; // Push player slightly
                ball.velocity = glm::reflect(ball.velocity, glm::normalize(diffPlayer));
            }
        }

        // Ball-Ball Collision
        for (size_t i = 0; i < balls.size(); ++i) {
            for (size_t j = i + 1; j < balls.size(); ++j) {
                glm::vec2 diff = balls[i].pos - balls[j].pos;
                float dist = glm::length(diff);
                float radiiSum = balls[i].radius + balls[j].radius;
                if (dist < radiiSum) {
                    // Resolve overlap
                    glm::vec2 normal = glm::normalize(diff);
                    float overlap = radiiSum - dist;
                    balls[i].pos += normal * overlap * 0.5f;
                    balls[j].pos -= normal * overlap * 0.5f;

                    // Elastic collision response
                    glm::vec2 v1 = balls[i].velocity;
                    glm::vec2 v2 = balls[j].velocity;
                    glm::vec2 x1 = balls[i].pos;
                    glm::vec2 x2 = balls[j].pos;
                    
                    balls[i].velocity = v1 - (2.0f * (balls[j].radius/balls[i].radius) / (1.0f + (balls[j].radius/balls[i].radius))) * glm::dot(v1-v2, x1-x2) / (glm::length(x1-x2)*glm::length(x1-x2)) * (x1-x2);
                    balls[j].velocity = v2 - (2.0f * (balls[i].radius/balls[j].radius) / (1.0f + (balls[i].radius/balls[j].radius))) * glm::dot(v2-v1, x2-x1) / (glm::length(x2-x1)*glm::length(x2-x1)) * (x2-x1);
                }
            }
        }
    }

    void render(Renderer& renderer) {
        // Draw platforms
        for (const auto& platform : platforms) {
            renderer.drawRect(platform.pos, platform.size, glm::vec3(0.5f, 0.5f, 0.5f));
        }

        // Draw balls
        for (const auto& ball : balls) {
            renderer.drawCircle(ball.pos, ball.radius, glm::vec3(0.9f, 0.2f, 0.2f));
        }
        
        // Draw player
        renderer.drawRect(player.pos, player.size, glm::vec3(0.2f, 0.6f, 1.0f));
    }
};

void framebuffer_size_callback(GLFWwindow* window, int width, int height);

const unsigned int SCREEN_WIDTH = 800;
const unsigned int SCREEN_HEIGHT = 600;

Game Platformer(SCREEN_WIDTH, SCREEN_HEIGHT);

int main() {
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "2D Platformer", NULL, NULL);
    if (window == NULL) {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    glViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    // --- Game Setup ---
    Shader shader("shader.vs", "shader.fs");
    glm::mat4 projection = glm::ortho(0.0f, (float)SCREEN_WIDTH, 0.0f, (float)SCREEN_HEIGHT, -1.0f, 1.0f);
    shader.use();
    shader.setMat4("projection", projection);
    
    Renderer renderer(shader);

    Platformer.init();

    float deltaTime = 0.0f;
    float lastFrame = 0.0f;

    // --- Game Loop ---
    while (!glfwWindowShouldClose(window)) {
        float currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // Input
        Platformer.processInput(window, deltaTime);

        // Update
        Platformer.update(deltaTime);

        // Render
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        Platformer.render(renderer);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glfwTerminate();
    return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
    glViewport(0, 0, width, height);
}
