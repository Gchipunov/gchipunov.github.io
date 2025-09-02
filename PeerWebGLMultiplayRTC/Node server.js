import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('Signaling server started on ws://localhost:8080');

wss.on('connection', ws => {
  console.log('Client connected.');

  ws.on('message', message => {
    // The message is binary, so we need to convert it to a string.
    const messageStr = message.toString();
    console.log('Received message => ', messageStr);

    // Broadcast the message to all other clients.
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
