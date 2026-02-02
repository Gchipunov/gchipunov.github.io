#include <iostream>
#include <map>
#include <memory>
#include <mutex>
#include <rtc/rtc.hpp>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// --- INDIVIDUAL PLAYER STATE ---
struct Player {
    std::string id;
    int gold = 200;
    int power = 0;
    int soldiers = 0;
    // Buildings
    int hq_count = 1;
    int barracks_count = 0;
    int power_plant_count = 0;
    int refinery_count = 0;
    
    // The connection to this specific user
    std::shared_ptr<rtc::PeerConnection> pc;
    std::shared_ptr<rtc::DataChannel> dc;
};

// --- GLOBAL GAME SERVER ---
class GameServer {
    std::map<std::string, std::shared_ptr<Player>> players;
    std::mutex server_mutex;

public:
    // Create a new player session
    void addPlayer(std::string id, std::shared_ptr<rtc::PeerConnection> pc) {
        auto player = std::make_shared<Player>();
        player->id = id;
        player->pc = pc;
        
        // Setup Data Channel Handler for this specific player
        pc->onDataChannel([this, player](std::shared_ptr<rtc::DataChannel> dc) {
            player->dc = dc;
            
            // Send initial state
            sendUpdate(player);

            dc->onMessage([this, player](auto data) {
                if (std::holds_alternative<std::string>(data)) {
                    std::string cmd = std::get<std::string>(data);
                    processCommand(player, cmd);
                }
            });
        });

        std::lock_guard<std::mutex> lock(server_mutex);
        players[id] = player;
        std::cout << "Player " << id << " connected.\n";
    }

    void processCommand(std::shared_ptr<Player> p, const std::string& cmd) {
        std::lock_guard<std::mutex> lock(server_mutex);
        
        if (cmd == "build_refinery" && p->gold >= 100) {
            p->gold -= 100;
            p->refinery_count++;
        }
        else if (cmd == "build_barracks" && p->gold >= 150) {
            p->gold -= 150;
            p->barracks_count++;
        }
        
        // Sync state back to THIS player immediately
        sendUpdate(p);
    }

    void sendUpdate(std::shared_ptr<Player> p) {
        if (!p->dc || p->dc->readyState() != rtc::DataChannel::State::Open) return;

        json j;
        j["gold"] = p->gold;
        j["refineries"] = p->refinery_count;
        j["barracks"] = p->barracks_count;
        
        p->dc->send(j.dump());
    }

    // Run this every 1 second
    void tickEconomy() {
        std::lock_guard<std::mutex> lock(server_mutex);
        for (auto& [id, player] : players) {
            if (player->refinery_count > 0) {
                player->gold += (player->refinery_count * 10);
                sendUpdate(player);
            }
        }
    }
};

int main() {
    GameServer game;

    // BACKGROUND THREAD: Economy Ticker
    std::thread([&game]() {
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            game.tickEconomy();
        }
    }).detach();

    // --- SIGNALING & CONNECTION SETUP ---
    // In a real Google Cloud setup, you would have a WebSocket server here 
    // waiting for new connections. When a new user connects via WebSocket:
    
    // PSEUDO CODE for the connection loop:
    /*
    websocketServer.on("connection", [](ws) {
        rtc::Configuration config;
        
        // *** CRITICAL FOR GOOGLE CLOUD ***
        // You must add your Google Cloud Public IP as the STUN server
        config.iceServers.emplace_back("stun:stun.l.google.com:19302");
        
        auto pc = std::make_shared<rtc::PeerConnection>(config);
        
        // Add to our game engine
        std::string newPlayerID = generateUUID();
        game.addPlayer(newPlayerID, pc);
        
        // ... Perform SDP Handshake via WebSocket ...
    });
    */

    // Keep server alive
    while(true) std::this_thread::sleep_for(std::chrono::seconds(1));
}
