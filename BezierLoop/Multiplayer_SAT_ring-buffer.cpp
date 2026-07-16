#include <iostream>
#include <vector>
#include <cmath>
#include <array>
#include <optional>

// 2D Vector mathematics helper
struct Vec2 {
    double x = 0.0;
    double y = 0.0;

    Vec2 operator+(const Vec2& o) const { return {x + o.x, y + o.y}; }
    Vec2 operator-(const Vec2& o) const { return {x - o.x, y - o.y}; }
    Vec2 operator*(double s) const { return {x * s, y * s}; }
    double dot(const Vec2& o) const { return x * o.x + y * o.y; }
    double cross(const Vec2& o) const { return x * o.y - y * o.x; }
    double length() const { return std::sqrt(x * x + y * y); }
    Vec2 normalized() const {
        double len = length();
        return len > 1e-5 ? Vec2{x / len, y / len} : Vec2{0, 0};
    }
};

// Represents a complete physical state at a specific frame (for sync & replay)
struct PhysicsState {
    uint32_t frameNumber = 0;
    Vec2 pos{0.0, 0.0};
    Vec2 vel{0.0, 0.0};
    double angle = 0.0;
    double angularVel = 0.0;
};

// --- PHYSICS STATE RING BUFFER (For Rollback and Sync) ---
template <size_t Size>
class StateRingBuffer {
private:
    std::array<PhysicsState, Size> buffer;
    size_t head = 0; // Points to the newest written state

public:
    void push(const PhysicsState& state) {
        head = (head + 1) % Size;
        buffer[head] = state;
    }

    // Retrieve state by absolute frame number
    std::optional<PhysicsState> getState(uint32_t frame) const {
        for (const auto& state : buffer) {
            if (state.frameNumber == frame) {
                return state;
            }
        }
        return std::nullopt; // State was rolled off the buffer
    }

    const PhysicsState& getLatest() const {
        return buffer[head];
    }

    // Rollback to a specific frame and prepare to overwrite history
    void rollbackToFrame(uint32_t frame) {
        for (size_t i = 0; i < Size; ++i) {
            if (buffer[i].frameNumber == frame) {
                head = i;
                return;
            }
        }
    }
};

// Helper: Line-Segment intersection to detect continuous swept collision
struct CollisionIntersection {
    Vec2 point;
    double t; // Value between [0, 1] indicating when during the frame step it hits
};

std::optional<CollisionIntersection> checkSegmentIntersection(Vec2 A, Vec2 B, Vec2 C, Vec2 D) {
    Vec2 r = B - A;
    Vec2 s = D - C;
    double rxs = r.cross(s);

    if (std::abs(rxs) < 1e-8) return std::nullopt; // Parallel

    double t = (C - A).cross(s) / rxs;
    double u = (C - A).cross(r) / rxs;

    if (t >= 0.0 && t <= 1.0 && u >= 0.0 && u <= 1.0) {
        return CollisionIntersection{A + r * t, t};
    }
    return std::nullopt;
}

// --- CURVE REPRESENTATION (Power Basis) ---
struct PowerBasisCurve {
    std::vector<Vec2> C; // Coefficients C0, C1, C2, C3...
    std::vector<Vec2> discretePoints;

    void generateDiscretePoints(int segments) {
        discretePoints.clear();
        for (int i = 0; i <= segments; ++i) {
            double t = static_cast<double>(i) / segments;
            // Horner's evaluation for B(t) = C0 + t*(C1 + t*(C2 + t*C3))
            Vec2 pt = C[0] + C[1] * t + C[2] * (t * t) + C[3] * (t * t * t);
            discretePoints.push_back(pt);
        }
    }
};

// --- PREDICTIVE CCD PHYSICS ENGINE ---
class PredictivePhysicsEngine {
private:
    PowerBasisCurve curve;
    Vec2 gravity{0.0, -9.81};
    double dt = 1.0 / 60.0;

public:
    PredictivePhysicsEngine(PowerBasisCurve c) : curve(c) {
        curve.generateDiscretePoints(50);
    }

    // Predicts future states and determines if/where a collision will happen
    void predictFutureCollisions(const PhysicsState& startState, int lookAheadFrames) {
        PhysicsState virtualState = startState;
        
        std::cout << "\n--- Running Forward Prediction (Extrapolating " << lookAheadFrames << " frames) ---" << std::endl;
        
        for (int f = 1; f <= lookAheadFrames; ++f) {
            Vec2 prevPos = virtualState.pos;

            // Semi-implicit Euler step into the future
            virtualState.vel = virtualState.vel + gravity * dt;
            virtualState.pos = virtualState.pos + virtualState.vel * dt;
            virtualState.frameNumber++;

            // Swept continuous collision check for this predicted future frame
            for (size_t i = 0; i < curve.discretePoints.size() - 1; ++i) {
                Vec2 segA = curve.discretePoints[i];
                Vec2 segB = curve.discretePoints[i + 1];

                // Check if the predicted center trajectory cuts through the loop-de-loop segment
                auto collision = checkSegmentIntersection(prevPos, virtualState.pos, segA, segB);
                if (collision.has_value()) {
                    std::cout << " [CRITICAL WARNING] Future Collision Predicted!" << std::endl;
                    std::cout << "  ↳ Will occur in " << f << " frames (Frame: " << virtualState.frameNumber << ")" << std::endl;
                    std::cout << "  ↳ Swept Time of Impact (TOI): t = " << collision->t << " during that frame." << std::endl;
                    std::cout << "  ↳ Coordinates: (" << collision->point.x << ", " << collision->point.y << ")" << std::endl;
                    return; // Return early; scheduling collision response
                }
            }
        }
        std::cout << " [Status] Path clear. No future collisions detected within the lookahead window." << std::endl;
    }
};

int main() {
    // 1. Setup our loop-de-loop Power Basis curve coefficients (C0, C1, C2, C3)
    PowerBasisCurve curve;
    curve.C = {
        {-0.6, -0.6}, // C0
        {2.4, 4.2},   // C1
        {-3.0, -1.2}, // C2
        {1.8, -3.0}   // C3
    };

    PredictivePhysicsEngine engine(curve);

    // 2. Instantiate our network-ready State Ring Buffer (remembers last 128 frames)
    StateRingBuffer<128> stateHistory;

    // Create a present physical state (high speed box falling down-right)
    PhysicsState presentState;
    presentState.frameNumber = 1000;
    presentState.pos = {0.0, 0.5};
    presentState.vel = {2.5, -4.5}; // High kinetic speed
    presentState.angle = 0.0;
    presentState.angularVel = 0.0;

    stateHistory.push(presentState);

    // 3. Extrapolate the future to see where the continuous swept path intersects the curve!
    engine.predictFutureCollisions(presentState, 15);

    return 0;
}
