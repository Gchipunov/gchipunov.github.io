const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function handleInput() {
    // Reset horizontal velocity unless a key is pressed to create a "stopping" effect
    // For a more "icy" feel, you would use friction to slow down instead.
    player.velocityX = 0;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velocityX = -moveSpeed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocityX = moveSpeed;
    }
    if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
        player.velocityY = jumpStrength;
        player.onGround = false;
    }
}
