// Assume you have scene, renderer, camera and your player's cube (`playerCube`) already set up.
// Let's also create a cube for the opponent.
const opponentCube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(opponentCube);

// --- Receiving Data ---
// In client.js, inside the `dataChannel.onmessage` handler, you'd do this:
dataChannel.onmessage = event => {
    const gameState = JSON.parse(event.data);

    // Update the opponent's cube position based on the received data
    if (gameState.position) {
        opponentCube.position.set(gameState.position.x, gameState.position.y, gameState.position.z);
    }
};


// --- Sending Data ---
// In your WebGL animation loop, you check if your player has moved.
function animate() {
    requestAnimationFrame(animate);

    // ... your game logic to move playerCube based on keyboard input ...
    // Let's say you update `playerCube.position`

    // After updating, send your new position to the other peer.
    // To avoid flooding the connection, you might only send this data a few times per second.
    const myPosition = playerCube.position;
    sendGameData({
        position: { x: myPosition.x, y: myPosition.y, z: myPosition.z }
    });

    renderer.render(scene, camera);
}

// Start the animation loop
animate();
