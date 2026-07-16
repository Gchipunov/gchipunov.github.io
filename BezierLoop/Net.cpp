#include <iostream>
#include <vector>
#include <cstring>
#include <cstdint>

// Compact struct optimized for network transport (28 bytes total)
#pragma pack(push, 1) // Prevents compiler from adding padding bytes
struct NetworkPhysicsState {
    uint32_t frameNumber;
    float posX;
    float posY;
    float velX;
    float velY;
    float angle;
    float angularVel;
};
#pragma pack(pop)

// Serializes the state into a raw byte vector
std::vector<uint8_t> serializeState(const NetworkPhysicsState& state) {
    std::vector<uint8_t> buffer(sizeof(NetworkPhysicsState));
    std::memcpy(buffer.data(), &state, sizeof(NetworkPhysicsState));
    return buffer;
}

// Deserializes a raw byte vector back into a C++ struct
NetworkPhysicsState deserializeState(const std::vector<uint8_t>& buffer) {
    NetworkPhysicsState state;
    if (buffer.size() >= sizeof(NetworkPhysicsState)) {
        std::memcpy(&state, buffer.data(), sizeof(NetworkPhysicsState));
    }
    return state;
}

int main() {
    // 1. Create state
    NetworkPhysicsState originalState{ 4200, 0.15f, -0.6f, 2.4f, -4.5f, 0.35f, -0.1f };

    // 2. Serialize to raw bytes (ready to pass to sendto() UDP socket function)
    std::vector<uint8_t> wireData = serializeState(originalState);
    std::cout << "Serialized Packet Size: " << wireData.size() << " bytes.\n";

    // 3. Simulated received packet deserialization
    NetworkPhysicsState receivedState = deserializeState(wireData);
    std::cout << "Deserialized Frame: " << receivedState.frameNumber 
              << " | Position: (" << receivedState.posX << ", " << receivedState.posY << ")\n";

    return 0;
}
