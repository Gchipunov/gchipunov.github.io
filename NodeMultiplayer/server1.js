
// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('Signaling server started on port 8080');

const clients = new Map();

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substr(2, 9);
    clients.set(id, ws);
    console.log(`Client ${id} connected`);

    // Send this client its new ID
    ws.send(JSON.stringify({ type: 'your-id', id }));

    // Announce the new client to all other clients
    const allClientIds = Array.from(clients.keys());
    clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(JSON.stringify({ type: 'new-peer', id }));
            ws.send(JSON.stringify({ type: 'new-peer', id: clientId })); // Inform the new client about existing peers
        }
    });

    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        const { target, ...rest } = msg;

        const targetClient = clients.get(target);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            // Add the sender's ID to the message before forwarding
            targetClient.send(JSON.stringify({ ...rest, from: id }));
        }
    });

    ws.on('close', () => {
        clients.delete(id);
        console.log(`Client ${id} disconnected`);
        // Announce disconnection to all other clients
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'peer-disconnect', id }));
            }
        });
    });
});
