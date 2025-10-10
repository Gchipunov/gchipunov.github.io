const objectsToUpdate = []; // Array to link meshes and bodies

function createBox(width, height, depth, mass, position) {
    // Three.js visual mesh
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: `hsl(${Math.random() * 360}, 80%, 70%)` });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    scene.add(mesh);

    // Cannon.js physics body
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(position);
    physicsWorld.addBody(body);

    // Add to our update list
    objectsToUpdate.push({ mesh, body });
}
