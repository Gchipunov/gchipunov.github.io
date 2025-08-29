#include <iostream>
#include <vector>
#include <limits>
#include <cmath>

// A simple 2D vector struct
struct vec2 {
    float x, y;
};

// A simple Polygon struct
struct Polygon {
    std::vector<vec2> vertices;
    vec2 position; // Center position of the polygon
};

// Helper function for vector operations
float dot(vec2 a, vec2 b) {
    return a.x * b.x + a.y * b.y;
}

vec2 subtract(vec2 a, vec2 b) {
    return {a.x - b.x, a.y - b.y};
}

// Struct to hold the min/max projection on an axis
struct Projection {
    float min;
    float max;
};

// Projects a polygon onto a given axis and returns the min/max values
Projection projectPolygon(const vec2& axis, const Polygon& polygon) {
    float min = std::numeric_limits<float>::max();
    float max = std::numeric_limits<float>::lowest();

    for (const auto& vertex : polygon.vertices) {
        // Get the vertex position in world space
        vec2 world_vertex = {vertex.x + polygon.position.x, vertex.y + polygon.position.y};
        
        // Project the vertex onto the axis using the dot product
        float projection = dot(world_vertex, axis);
        
        if (projection < min) {
            min = projection;
        }
        if (projection > max) {
            max = projection;
        }
    }
    return {min, max};
}

// The main function to check for collision using SAT
bool checkCollision(const Polygon& polyA, const Polygon& polyB) {
    std::vector<vec2> axes;

    // 1. Get all the axes from Polygon A
    for (size_t i = 0; i < polyA.vertices.size(); ++i) {
        vec2 p1 = polyA.vertices[i];
        vec2 p2 = polyA.vertices[i + 1 == polyA.vertices.size() ? 0 : i + 1];
        
        vec2 edge = subtract(p2, p1);
        vec2 axis = {-edge.y, edge.x}; // Perpendicular axis (normal)
        
        // Normalize the axis
        float len = std::sqrt(axis.x * axis.x + axis.y * axis.y);
        axis.x /= len;
        axis.y /= len;

        axes.push_back(axis);
    }

    // 2. Get all the axes from Polygon B
    for (size_t i = 0; i < polyB.vertices.size(); ++i) {
        vec2 p1 = polyB.vertices[i];
        vec2 p2 = polyB.vertices[i + 1 == polyB.vertices.size() ? 0 : i + 1];

        vec2 edge = subtract(p2, p1);
        vec2 axis = {-edge.y, edge.x}; // Perpendicular axis (normal)

        // Normalize the axis
        float len = std::sqrt(axis.x * axis.x + axis.y * axis.y);
        axis.x /= len;
        axis.y /= len;
        
        axes.push_back(axis);
    }

    // 3. Loop through all axes and check for overlap
    for (const auto& axis : axes) {
        Projection pA = projectPolygon(axis, polyA);
        Projection pB = projectPolygon(axis, polyB);

        // 4. Check for separation (a gap between the projections)
        if (pA.max < pB.min || pB.max < pA.min) {
            // Found a separating axis, so no collision
            return false;
        }
    }

    // 5. If no separating axis was found, the polygons are colliding
    return true;
}


int main() {
    // Define a square polygon (vertices relative to its center)
    Polygon square;
    square.vertices = { {-50, -50}, {50, -50}, {50, 50}, {-50, 50} };

    // Create two instances of the square
    Polygon shape1 = square;
    shape1.position = {100, 100}; // Position of the first square

    Polygon shape2 = square;
    shape2.position = {140, 120}; // Position of the second square (colliding)

    Polygon shape3 = square;
    shape3.position = {210, 210}; // Position of the third square (not colliding)

    if (checkCollision(shape1, shape2)) {
        std::cout << "Shape 1 and Shape 2 are colliding. ✅" << std::endl;
    } else {
        std::cout << "Shape 1 and Shape 2 are NOT colliding." << std::endl;
    }

    if (checkCollision(shape1, shape3)) {
        std::cout << "Shape 1 and Shape 3 are colliding." << std::endl;
    } else {
        std::cout << "Shape 1 and Shape 3 are NOT colliding. ❌" << std::endl;
    }

    return 0;
}
