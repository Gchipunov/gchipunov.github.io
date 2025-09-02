// Configuration includes a public STUN server from Google
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

let peerConnection;
let dataChannel;
const signalingSocket = new WebSocket('ws://localhost:8080');

// --- 1. SIGNALING ---
signalingSocket.onmessage = async (event) => {
  const message = JSON.parse(event.data);

  if (message.offer) {
    // If we receive an offer, we are the "callee"
    console.log('Received offer...');
    peerConnection = createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signalingSocket.send(JSON.stringify({ answer: answer }));
    console.log('Answer sent.');

  } else if (message.answer) {
    // If we receive an answer, we are the "caller"
    console.log('Received answer...');
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));

  } else if (message.iceCandidate) {
    // Add the ICE candidate received from the other peer
    console.log('Received ICE candidate...');
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
  }
};

// --- 2. CREATE AND MANAGE PEER CONNECTION ---
function createPeerConnection() {
  const pc = new RTCPeerConnection(configuration);

  // This event fires when the browser finds a network path (an ICE candidate)
  pc.onicecandidate = event => {
    if (event.candidate) {
      console.log('Sending ICE candidate...');
      signalingSocket.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  };

  // This event fires when the connection is established and the data channel opens
  pc.ondatachannel = event => {
    dataChannel = event.channel;
    setupDataChannelEvents();
    console.log('Data channel opened!');
  };

  return pc;
}

function setupDataChannelEvents() {
    dataChannel.onopen = () => console.log('Data Channel is open and ready to use.');
    dataChannel.onclose = () => console.log('Data Channel has been closed.');

    // This is where you receive game data from the other player!
    dataChannel.onmessage = event => {
        const message = JSON.parse(event.data);
        // Call a function to update your WebGL scene
        // For example: updatePlayerPosition(message.position);
        console.log('Received message:', message);
    };
}


// --- 3. START THE CONNECTION (CALLER'S SIDE) ---
async function startCall() {
  console.log('Starting call...');
  peerConnection = createPeerConnection();

  // Create the data channel for sending game state
  dataChannel = peerConnection.createDataChannel('gameData');
  setupDataChannelEvents();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  console.log('Sending offer...');
  signalingSocket.send(JSON.stringify({ offer: offer }));
}

// You can trigger this from a button click in your HTML, e.g., <button onclick="startCall()">Start Game</button>
// The first player to click it becomes the "caller". The second player to open the page will receive the offer.

// Function to send data to the other peer
function sendGameData(data) {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(data));
    }
}
