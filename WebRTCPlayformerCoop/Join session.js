async function joinGame() {
    const response = await fetch('api.php?action=get_room');
    const data = await response.json();

    console.log("My Connection Key:", data.room_key);

    if (data.role === 'initiator') {
        // Create WebRTC Offer using data.room_key
    } else {
        // Create WebRTC Answer using data.room_key
    }
}
