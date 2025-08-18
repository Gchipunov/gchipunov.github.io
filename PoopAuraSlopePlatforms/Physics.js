function checkCollision(player, platform) {
    // This is a simplified check. A full implementation would use a
    // more robust method like the Separating Axis Theorem (SAT).

    const platformAngle = platform.angle || 0; // Angle is 0 for flat platforms

    // For simplicity, we'll just check the bottom-center point of the player
    const playerFootX = player.x + player.width / 2;
    const playerFootY = player.y;

    // Find the starting point of the platform's top surface
    let surfaceStartX, surfaceStartY;
    if (platformAngle >= 0) { // Slopes up to the right
        surfaceStartX = platform.vertices[0].x;
        surfaceStartY = platform.vertices[0].y;
    } else { // Slopes down to the right
        surfaceStartX = platform.vertices[3].x;
        surfaceStartY = platform.vertices[3].y;
    }

    // Is the player horizontally within the bounds of this platform?
    const platformLeft = Math.min(...platform.vertices.map(v => v.x));
    const platformRight = Math.max(...platform.vertices.map(v => v.x));

    if (playerFootX > platformLeft && playerFootX < platformRight) {
        // Calculate the expected height (y) of the slope at the player's x position
        const slopeHeightAtPlayer = surfaceStartY + (playerFootX - surfaceStartX) * Math.tan(platformAngle);

        // Collision detected if player's foot is below the slope's surface
        if (playerFootY < slopeHeightAtPlayer && player.y - player.velocityY >= slopeHeightAtPlayer) {
            player.y = slopeHeightAtPlayer; // Snap player to the surface
            player.velocityY = 0;
            player.onGround = true;

            // ---- SLIPPERY MOVEMENT LOGIC ----
            // Gravity's force component parallel to the slope causes sliding
            // F_parallel = g * sin(theta)
            const slipForce = -gravity * Math.sin(platformAngle);

            // Apply this force to the player's horizontal velocity
            player.velocityX += slipForce;
        }
    }
}
