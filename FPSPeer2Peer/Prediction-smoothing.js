function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // 1. Client-Side Prediction (Local Movement)
    // We move the camera IMMEDIATELY based on input
    if (document.pointerLockElement === document.body) {
        updateLocalMovement(delta);
        
        // Broadcast local position (throttled is better, but this works for now)
        broadcast({ 
            type: 'move', 
            pos: camera.position, 
            rotY: camera.rotation.y 
        });
    }

    // 2. Entity Interpolation (Remote Players)
    for (let id in remoteTargets) {
        const target = remoteTargets[id];
        const mesh = players[id];
        
        if (mesh && target) {
            // LERP: Current Pos -> Target Pos by a factor of 0.2 (20% per frame)
            // This removes the "jitter" and makes movement look fluid
            mesh.position.lerp(target.pos, 0.2);
            
            // Smoothly rotate
            mesh.rotation.y += (target.rotY - mesh.rotation.y) * 0.2;
        }
    }

    renderer.render(scene, camera);
}

function updateLocalMovement(delta) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(velocity.z * delta);
    camera.position.y = 1.6;
}
