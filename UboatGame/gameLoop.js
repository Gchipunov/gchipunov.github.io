// --- Create the objects ---
const uboat = createUBoat();
objectsToUpdate.push(uboat);

// Create some boxes to pick up
createBox(2, 2, 2, 5, { x: 5, y: 1, z: 0 });
createBox(1, 3, 2, 6, { x: 5.5, y: 3, z: 1 });
createBox(4, 1, 1, 4, { x: 6, y: 5, z: -1 });


// --- Animation Loop ---
const clock = new THREE.Clock();
let oldElapsedTime = 0;

function animate() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // 1. Step the physics world
    physicsWorld.step(1 / 60, deltaTime, 3);

    // 2. Update all visual meshes
    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }
    
    // 3. Render the scene
    renderer.render(scene, camera);

    // Call the next frame
    requestAnimationFrame(animate);
}

animate();
