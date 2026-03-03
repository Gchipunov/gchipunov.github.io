// Example using a generic WebTransport/UDP handler
void onDatagramReceived(Session* sender, const uint8_t* data, size_t length) {
    // The server is now a "Dumb Pipe"
    // It doesn't know what the floats mean; it just moves bits.
    for (auto& session : sessions) {
        if (session != sender) {
            session->sendDatagram(data, length); 
        }
    }
}
