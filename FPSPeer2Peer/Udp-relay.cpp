// Inside your Quic/WebTransport Loop
void handleIncomingDatagram(const uint8_t* buffer, size_t size, Session* sender) {
    // We don't even need to parse the JSON. 
    // Just blast the raw binary to everyone else.
    for(auto& client : all_connected_sessions) {
        if(client != sender) {
            client->sendDatagram(buffer, size);
        }
    }
}
