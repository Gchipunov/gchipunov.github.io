// Assume 'physicsWorld' is your initialized Ammo.js world
// Assume 'rigidBodies' is an array to hold physics objects

function createBox(width, height, depth, mass, position, texturePath) {
    // 1. Create the visual mesh (Three.js)
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const texture = new THREE.TextureLoader().load(texturePath);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    scene.add(mesh);

    // 2. Create the physics body (Ammo.js)
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5));
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    
    const localInertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
        shape.calculateLocalInertia(mass, localInertia);
    }

    const motionState = new Ammo.btDefaultMotionState(transform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    
    physicsWorld.addRigidBody(body);

    // Link mesh and body for updates
    mesh.userData.physicsBody = body;
    rigidBodies.push(mesh);
}
