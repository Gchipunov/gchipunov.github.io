// --- Configuration ---
const SERVER_ADDRESS = '127.0.0.1'; // Your server's IP address
const SERVER_PORT = 12345;          // Your server's port

// --- Player Data ---
let player = {
  id: Math.floor(Math.random() * 1000), // Give player a random ID
  x: 10.5,
  y: -25.0
};

let socketId; // To store our created socket's ID

/**
 * Converts a player object to an ArrayBuffer for sending.
 * Layout: 4-byte Int (ID) | 4-byte Float (X) | 4-byte Float (Y)
 * @param {object} playerObj - The player object {id, x, y}.
 * @returns {ArrayBuffer}
 */
function toArrayBuffer(playerObj) {
  const buffer = new ArrayBuffer(12); // 4 bytes for int32 + 4 bytes for float32 + 4 for float32
  const view = new DataView(buffer);
  view.setInt32(0, playerObj.id, true);      // Offset 0, true for little-endian
  view.setFloat32(4, playerObj.x, true);     // Offset 4
  view.setFloat32(8, playerObj.y, true);     // Offset 8
  return buffer;
}

/**
 * Converts an ArrayBuffer back into a player object.
 * @param {ArrayBuffer} buffer - The incoming data buffer.
 * @returns {object}
 */
function fromArrayBuffer(buffer) {
  const view = new DataView(buffer);
  const playerObj = {
    id: view.getInt32(0, true),
    x: view.getFloat32(4, true),
    y: view.getFloat32(8, true)
  };
  return playerObj;
}


// --- Main Logic ---

// Create a UDP socket
chrome.sockets.udp.create({}, (createInfo) => {
  socketId = createInfo.socketId;
  console.log(`Socket created with ID: ${socketId}`);

  // Bind the socket to listen on any available local port
  chrome.sockets.udp.bind(socketId, '0.0.0.0', 0, (result) => {
    if (result < 0) {
      console.error("Error binding socket:", chrome.runtime.lastError.message);
      return;
    }
    console.log("Socket bound successfully.");

    // Start sending player position periodically
    setInterval(sendPosition, 1000); // Send every 1 second
  });
});

// Add a listener for incoming data
chrome.sockets.udp.onReceive.addListener((info) => {
  if (info.socketId === socketId) {
    const receivedPlayer = fromArrayBuffer(info.data);
    console.log('RECV ◀️:', `Received replicated position for player ${receivedPlayer.id}:`, `x=${receivedPlayer.x.toFixed(2)}, y=${receivedPlayer.y.toFixed(2)}`);
  }
});

// Add a listener for network errors
chrome.sockets.udp.onReceiveError.addListener((info) => {
    console.error(`Receive Error on socket ${info.socketId}:`, info.resultCode);
});


/**
 * Sends the current player position to the server.
 */
function sendPosition() {
  // Simulate player movement
  player.x += 1.2;
  player.y -= 0.7;

  const dataBuffer = toArrayBuffer(player);

  chrome.sockets.udp.send(socketId, dataBuffer, SERVER_ADDRESS, SERVER_PORT, (sendInfo) => {
    if (sendInfo.resultCode < 0) {
      console.error("Error sending data:", chrome.runtime.lastError.message);
    } else {
      console.log('SENT ▶️:', `Sent position for player ${player.id}:`, `x=${player.x.toFixed(2)}, y=${player.y.toFixed(2)}`);
    }
  });
}
