/* =========================================
   3. AUTOMATED WEBRTC NETWORKING (Using PHP)
   ========================================= */
const SIGNALING_URL = "signaling.php"; // Point to your PHP file
const GAME_ID = "room1"; // Simple hardcoded room for demo

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const pc = new RTCPeerConnection(config);
let dataChannel;

// Setup ICE Handling
pc.onicecandidate = e => {
    if (!e.candidate) {
        // Gathering done. In manual mode, we pasted. 
        // Now, we auto-upload to PHP.
        uploadSignal(pc.localDescription);
    }
};

pc.ondatachannel = (e) => { setupChannel(e.channel); };

function setupChannel(channel) {
    dataChannel = channel;
    dataChannel.onopen = () => {
        document.getElementById("status").innerText = "Status: CONNECTED! (P2P Established)";
        document.getElementById("status").style.color = "#00ff00";
    };
    dataChannel.onmessage = handleMessage;
}

// --- AJAX HELPERS ---
async function uploadSignal(desc) {
    const payload = {
        id: GAME_ID,
        type: desc.type, // 'offer' or 'answer'
        sdp: JSON.stringify(desc)
    };
    
    await fetch(SIGNALING_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    });
    
    document.getElementById("status").innerText = `Status: ${desc.type} uploaded. Waiting for peer...`;
    
    // If we are Host, start polling for Answer. If Client, we are done.
    if(desc.type === 'offer') startPolling('answer');
}

async function startPolling(targetType) {
    const interval = setInterval(async () => {
        if(dataChannel && dataChannel.readyState === 'open') {
            clearInterval(interval);
            return;
        }

        const res = await fetch(`${SIGNALING_URL}?action=read&id=${GAME_ID}`);
        const data = await res.json();
        
        if (data.status === 'success' && data[targetType]) {
            // We found what we were looking for!
            clearInterval(interval);
            const remoteDesc = JSON.parse(data[targetType]);
            
            await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));
            
            // If we just downloaded an Offer, we must generate an Answer
            if (remoteDesc.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer); // This triggers onicecandidate -> uploadSignal('answer')
            }
        }
    }, 2000); // Check every 2 seconds
}

// --- BUTTON FUNCTIONS ---

// 1. Host Starts
async function createOffer() {
    dataChannel = pc.createDataChannel("game");
    setupChannel(dataChannel);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer); // Triggers upload automatically via onicecandidate
    document.getElementById("status").innerText = "Status: Generating Offer...";
}

// 2. Client Joins
function acceptOffer() {
    // Client simply starts polling for an 'offer' immediately
    document.getElementById("status").innerText = "Status: Looking for Host Offer...";
    startPolling('offer');
}

// 3. Accept Answer (Deprecated/Automated)
function acceptAnswer() {
    console.log("This step is now automated via polling.");
}
