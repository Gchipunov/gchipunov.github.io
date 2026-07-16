// Configure the Data Channel to act like UDP
const dataChannelOptions = {
    ordered: false,         // Do not enforce arrival order
    maxRetransmits: 0       // Disable packet retransmission (unreliable)
};

const peerConnection = new RTCPeerConnection();
const dataChannel = peerConnection.createDataChannel("physicsSync", dataChannelOptions);

// Set binaryType to arraybuffer for high performance
dataChannel.binaryType = "arraybuffer";



// part2 

// Sends state over the WebRTC DataChannel
function sendPhysicsState(channel, state) {
    if (channel.readyState !== "open") return;

    // Allocate exactly 28 bytes
    const buffer = new ArrayBuffer(28);
    const view = new DataView(buffer);

    // Pack variables (using true for Little-Endian)
    view.setUint32(0, state.frameNumber, true); // Offset 0, 4 bytes
    view.setFloat32(4, state.posX, true);        // Offset 4, 4 bytes
    view.setFloat32(8, state.posY, true);        // Offset 8, 4 bytes
    view.setFloat32(12, state.velX, true);       // Offset 12, 4 bytes
    view.setFloat32(16, state.velY, true);       // Offset 16, 4 bytes
    view.setFloat32(20, state.angle, true);      // Offset 20, 4 bytes
    view.setFloat32(24, state.angularVel, true); // Offset 24, 4 bytes

    channel.send(buffer);
}

// part 3

dataChannel.onmessage = (event) => {
    // Ensure data is received as ArrayBuffer
    if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);

        // Unpack the 28-byte payload
        const receivedState = {
            frameNumber: view.getUint32(0, true),
            posX: view.getFloat32(4, true),
            posY: view.getFloat32(8, true),
            velX: view.getFloat32(12, true),
            velY: view.getFloat32(16, true),
            angle: view.getFloat32(20, true),
            angularVel: view.getFloat32(24, true)
        };

        // Inject this directly into your local rollback/replay State Ring Buffer!
        handleNetworkStateSync(receivedState);
    }
};

function handleNetworkStateSync(netState) {
    console.log(`Received state for frame: ${netState.frameNumber}`);
    // Here, compare netState.frameNumber to your current frame.
    // If it differs from your local history, trigger an XPBD Rollback & Replay.
}
