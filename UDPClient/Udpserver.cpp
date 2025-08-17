#include <iostream>
#include <vector>
#include <string>
#include <cstring> // For memset

#ifdef _WIN32
    // Windows-specific headers and setup
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib") // Link with the Winsock library
#else
    // POSIX (Linux, macOS) specific headers
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h> // For close()
    // Define SOCKET and other Windows types for cross-compatibility
    using SOCKET = int;
    const int INVALID_SOCKET = -1;
    const int SOCKET_ERROR = -1;
    #define closesocket close
#endif

const int PORT = 12345;
const int BUFFER_SIZE = 12; // 12 bytes for our player struct

// This struct MUST match the byte layout of the JavaScript client
#pragma pack(push, 1) // Ensures compiler doesn't add padding bytes
struct PlayerPosition {
    int32_t id;
    float x;
    float y;
};
#pragma pack(pop)


int main() {
    #ifdef _WIN32
        // Initialize Winsock
        WSADATA wsaData;
        int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
        if (result != 0) {
            std::cerr << "WSAStartup failed: " << result << std::endl;
            return 1;
        }
    #endif

    SOCKET serverSocket;
    sockaddr_in serverAddr, clientAddr;
    char buffer[BUFFER_SIZE];

    // 1. Create a UDP socket
    serverSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "Failed to create socket." << std::endl;
        #ifdef _WIN32
            WSACleanup();
        #endif
        return 1;
    }

    // 2. Prepare the server address structure
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(PORT);
    serverAddr.sin_addr.s_addr = INADDR_ANY; // Listen on all available interfaces

    // 3. Bind the socket to the server address
    if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed." << std::endl;
        closesocket(serverSocket);
        #ifdef _WIN32
            WSACleanup();
        #endif
        return 1;
    }

    std::cout << "UDP server listening on port " << PORT << "..." << std::endl;

    // 4. Main server loop to receive and replicate data
    while (true) {
        socklen_t clientAddrSize = sizeof(clientAddr);
        memset(buffer, 0, BUFFER_SIZE);

        // Receive data from a client
        int bytesReceived = recvfrom(serverSocket, buffer, BUFFER_SIZE, 0, (struct sockaddr*)&clientAddr, &clientAddrSize);

        if (bytesReceived == SOCKET_ERROR) {
            std::cerr << "recvfrom failed." << std::endl;
            continue;
        }

        if (bytesReceived == BUFFER_SIZE) {
            // Cast the buffer to our struct to interpret the data
            PlayerPosition* pos = reinterpret_cast<PlayerPosition*>(buffer);

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, INET_ADDRSTRLEN);

            std::cout << "RECV ◀️: Player " << pos->id
                      << " at (" << pos->x << ", " << pos->y << ") "
                      << "from " << clientIp << ":" << ntohs(clientAddr.sin_port)
                      << std::endl;

            // Replicate: Send the exact same data back to the client
            sendto(serverSocket, buffer, bytesReceived, 0, (struct sockaddr*)&clientAddr, clientAddrSize);
            std::cout << "SENT ▶️: Replicated position back to client." << std::endl;

        } else {
             std::cerr << "Warning: Received packet of incorrect size: " << bytesReceived << " bytes." << std::endl;
        }
    }

    // Cleanup
    closesocket(serverSocket);
    #ifdef _WIN32
        WSACleanup();
    #endif

    return 0;
}
