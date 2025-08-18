function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // 1. Handle keyboard input (see below)
    handleInput();

    // 2. Apply gravity
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.x += player.velocityX;
    player.onGround = false;

    // 3. Check for collisions with all platforms
    platforms.forEach(platform => {
        checkCollision(player, platform);
    });

    // Simple boundary checks to prevent falling off screen
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
        player.onGround = true;
    }
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    // You would loop through your objects and draw them here
    // drawObject(player, playerColor);
    // platforms.forEach(p => drawObject(p, p.color));
}
