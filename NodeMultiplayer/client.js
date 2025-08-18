// client.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State & Logic ---
const gravity = 0.5;
const moveSpeed = 5;
const jumpPower = 12;

let localPlayer = {
    id: null,
    x: 100,
    y: 500,
    width: 40,
    height: 60,
    color: `hsl(${Math.random() * 360}, 100%, 75%)`,
    vx: 0,
    vy: 0,
    isJumping: false
};

const platforms = [
    { x: 0, y: 580, width: canvas.width, height: 20 },
    { x: 200, y: 450, width: 150, height: 20 },
    { x: 450, y: 350, width: 150, height: 20 }
];

const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        localPlayer.vx = -moveSpeed;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        localPlayer.vx = moveSpeed;
    } else {
        localPlayer.vx = 0;
    }

    // Jumping
    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && !localPlayer.isJumping) {
        localPlayer.vy = -jumpPower;
        localPlayer.isJumping = true;
    }

    // Apply physics
    localPlayer.x += localPlayer.vx;
    localPlayer.vy += gravity;
    localPlayer.y += localPlayer.vy;

    // Collision with platforms
    let onPlatform = false;
    platforms.forEach(platform => {
        if (localPlayer.x < platform.x + platform.width &&
            localPlayer.x + localPlayer.width > platform.x &&
            localPlayer.y + localPlayer.height > platform.y &&
            localPlayer.y + localPlayer.height < platform.y + platform.height + localPlayer.vy) {
            localPlayer.y = platform.y - localPlayer.height;
            localPlayer.vy = 0;
            localPlayer.isJumping = false;
            onPlatform = true;
        }
    });

    if (!onPlatform) {
       localPlayer.isJumping = true; // Airbourne
    }

    // World bounds
    if (localPlayer.x < 0) localPlayer.x = 0;
    if (localPlayer.x + localPlayer.width > canvas.width) localPlayer.x = canvas.width - localPlayer.width;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = '#888';
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    // Draw all players (local and remote)
    for (const id in remotePlayers) {
        const p = remotePlayers[id];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }
    ctx.fillStyle = localPlayer.color;
    ctx.fillRect(localPlayer.x, localPlayer.y, localPlayer.width, localPlayer.height);
}

function gameLoop() {
    updatePlayer();
    draw();
    sendPlayerState();
    requestAnimationFrame(gameLoop);
}


// --- WebRTC Networking ---
let remotePlayers = {};
let peerConnections = {};
let dataChannels = {};
let ws;

// Using a public STUN server
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function startNetworking() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'your-id':
                localPlayer.id = message.id;
                console.log(`My ID is: ${localPlayer.id}`);
                gameLoop(); // Start the game loop after getting ID
                break;
            case 'new-peer':
                console.log(`New peer connected: ${message.id}`);
                createPeerConnection(message.id, true);
                break;
            case 'offer':
                await handleOffer(message.from, message.offer);
                break;
            case 'answer':
                await handleAnswer(message.from, message.answer);
                break;
            case 'candidate':
                await handleIceCandidate(message.from, message.candidate);
                break;
            case 'peer-disconnect':
                console.log(`Peer disconnected: ${message.id}`);
                if (peerConnections[message.id]) {
                    peerConnections[message.id].close();
                    delete peerConnections[message.id];
                }
                delete remotePlayers[message.id];
                break;
        }
    };
}

async function createPeerConnection(peerId, isInitiator) {
    peerConnections[peerId] = new RTCPeerConnection(configuration);

    peerConnections[peerId].onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', target: peerId, candidate: event.candidate }));
        }
    };
    
    // For the receiver of the connection
    peerConnections[peerId].ondatachannel = (event) => {
        setupDataChannel(peerId, event.channel);
    };

    if (isInitiator) {
        const channel = peerConnections[peerId].createDataChannel('gameData');
        setupDataChannel(peerId, channel);
        const offer = await peerConnections[peerId].createOffer();
        await peerConnections[peerId].setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'offer', target: peerId, offer }));
    }
}

function setupDataChannel(peerId, channel) {
    dataChannels[peerId] = channel;
    dataChannels[peerId].onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'player-state') {
            remotePlayers[data.id] = data;
        }
    };
    dataChannels[peerId].onopen = () => console.log(`Data channel with ${peerId} is open!`);
    dataChannels[peerId].onclose = () => console.log(`Data channel with ${peerId} is closed.`);
}

async function handleOffer(fromId, offer) {
    console.log(`Received offer from ${fromId}`);
    if (!peerConnections[fromId]) {
        await createPeerConnection(fromId, false);
    }
    const pc = peerConnections[fromId];
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'answer', target: fromId, answer }));
}

async function handleAnswer(fromId, answer) {
    console.log(`Received answer from ${fromId}`);
    const pc = peerConnections[fromId];
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate(fromId, candidate) {
    try {
        const pc = peerConnections[fromId];
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
}

function sendPlayerState() {
    const state = {
        type: 'player-state',
        id: localPlayer.id,
        x: localPlayer.x,
        y: localPlayer.y,
        color: localPlayer.color,
        width: localPlayer.width,
        height: localPlayer.height
    };
    const message = JSON.stringify(state);
    for (const peerId in dataChannels) {
        const channel = dataChannels[peerId];
        if (channel.readyState === 'open') {
            channel.send(message);
        }
    }
}

// Kick off the connection process
startNetworking();
