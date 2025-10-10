function createUBoat() {
    const uboatGroup = new THREE.Group(); // A group to hold all visual parts
    const uboatBody = new CANNON.Body({ mass: 50 }); // Give it some weight

    // 1. Create the base
    const baseGeo = new THREE.BoxGeometry(8, 0.2, 4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.castShadow = true;
    uboatGroup.add(baseMesh);

    const baseShape = new CANNON.Box(new CANNON.Vec3(4, 0.1, 2));
    uboatBody.addShape(baseShape, new CANNON.Vec3(0, 0, 0)); // Add shape at the center

    // 2. Create vertical poles
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const poleShape = new CANNON.Box(new CANNON.Vec3(0.15, 3, 0.15));

    // Define pole positions
    const polePositions = [
        { x: 3.8, z: 1.8 }, { x: -3.8, z: 1.8 },
        { x: 3.8, z: -1.8 }, { x: -3.8, z: -1.8 }
    ];

    polePositions.forEach(pos => {
        const poleMesh = new THREE.Mesh(poleGeo, poleMat);
        poleMesh.position.set(pos.x, 3.1, pos.z);
        poleMesh.castShadow = true;
        uboatGroup.add(poleMesh);
        // Add physics shape for the pole at the correct offset from the body's center
        uboatBody.addShape(poleShape, new CANNON.Vec3(pos.x, 3.1, pos.z));
    });
    
    // Position the entire U-boat
    uboatGroup.position.y = 0.5;
    scene.add(uboatGroup);
    
    uboatBody.position.set(0, 0.5, 0);
    physicsWorld.addBody(uboatBody);

    // Link them for the game loop
    return { mesh: uboatGroup, body: uboatBody };
}



