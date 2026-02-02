#include <iostream>
#include <thread>
#include <chrono>
#include <string>
#include <mutex>
#include <vector>
#include <variant>

// Libraries: libdatachannel and nlohmann/json
#include <rtc/rtc.hpp> 
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using namespace std::chrono_literals;

// --- GAME STATE ---
// The server holds the only valid copy of the game state.
struct GameState {
    int gold = 200;      // Starting gold
    int power = 0;       // Current power capacity
    int soldiers = 0;
    
    int hq_count = 1;
    int barracks_count = 0;
    int power_plant_count = 0;
    int refinery_count = 0;
};

GameState state;
std::mutex state_mutex; // Prevents data races between game loop and network thread

// --- SERIALIZATION ---
// Convert C++ struct to JSON to send to the browser
std::string serializeState() {
    std::lock_guard<std::mutex> lock(state_mutex);
    json j;
    j["resources"] = { {"gold", state.gold}, {"power", state.power}, {"soldiers", state.soldiers} };
    j["buildings"] = { 
        {"hq", state.hq_count}, 
        {"barracks", state.barracks_count}, 
        {"power_plant", state.power_plant_count}, 
        {"refinery", state.refinery_count} 
    };
    return j.dump();
}

// --- GAME LOGIC ---
// Process specific building commands securely
void handleCommand(const std::string& cmd) {
    std::lock_guard<std::mutex> lock(state_mutex);
    
    if (cmd == "build_power") {
        if (state.gold >= 50) {
            state.gold -= 50;
            state.power_plant_count++;
            state.power += 50; // Power plant adds 50 power
            std::cout << "Built: Power Plant. Power is now: " << state.power << "\n";
        }
    }
    else if (cmd == "build_refinery") {
        // Needs 100 Gold and 10 Power
        if (state.gold >= 100 && state.power >= 10) {
            state.gold -= 100;
            state.power -= 10; // Consumes power capacity
            state.refinery_count++;
            std::cout << "Built: Refinery.\n";
        }
    }
    else if (cmd == "build_barracks") {
        // Needs 150 Gold and 20 Power
        if (state.gold >= 150 && state.power >= 20) {
            state.gold -= 150;
            state.power -= 20;
            state.barracks_count++;
            std::cout << "Built: Barracks.\n";
        }
    }
    else if (cmd == "train_soldier") {
        // Needs Barracks, 20 Gold, 5 Power
        if (state.barracks_count > 0 && state.gold >= 20 && state.power >= 5) {
            state.gold -= 20;
            state.power -= 5;
            state.soldiers++;
            std::cout << "Trained: Soldier.\n";
        }
    }
}

int main() {
    rtc::Configuration config;
    rtc::PeerConnection pc(config);

    // 1. Data Channel Setup
    pc.onDataChannel([](std::shared_ptr<rtc::DataChannel> dc) {
        std::cout << "[New Client Connected]\n";

        // Send initial state immediately
        dc->send(serializeState());

        // Handle messages (e.g., "build_barracks")
        dc->onMessage([dc](auto data) {
            if (std::holds_alternative<std::string>(data)) {
                std::string msg = std::get<std::string>(data);
                handleCommand(msg);
                dc->send(serializeState()); // Send updated state back to client
            }
        });

        // 2. Game Loop Thread (The "Heartbeat")
        // This simulates the economy over time
        std::thread([dc]() {
            while (true) {
                std::this_thread::sleep_for(2s); // Every 2 seconds
                {
                    std::lock_guard<std::mutex> lock(state_mutex);
                    if (state.refinery_count > 0) {
                        // Refineries generate 10 gold per tick
                        state.gold += (state.refinery_count * 10);
                        
                        // Notify client of the passive gold increase
                        // (Use try/catch in case client disconnects)
                        try { dc->send(serializeState()); } catch(...) { break; }
                    }
                }
            }
        }).detach();
    });

    // NOTE: In a real app, you need a Signaling Server here to exchange the SDP Offer/Answer.
    // This allows the C++ server and Browser to find each other.
    std::cout << "Server Initialized. Waiting for Signaling..." << std::endl;

    while(true) std::this_thread::sleep_for(1s);
    return 0;
}
