import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);

// 2. Physics World Setup
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

// A list to keep track of objects to sync between physics and graphics
const objectsToUpdate = [];

// 3. Terrain Creation
const terrainSize = 100;
const terrainSegments = 64;

// Graphics (Three.js)
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6b2d });
const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrainMesh.rotation.x = -Math.PI / 2;
scene.add(terrainMesh);

// Physics (Cannon-es)
const heightfieldData = [];
const vertices = terrainGeometry.attributes.position.array;
for (let i = 0; i < terrainSegments + 1; i++) {
    const row = [];
    for (let j = 0; j < terrainSegments + 1; j++) {
        const z = vertices[(i * (terrainSegments + 1) + j) * 3 + 2];
        row.push(z);
    }
    heightfieldData.push(row);
}
const heightfieldShape = new CANNON.Heightfield(heightfieldData, {
    elementSize: terrainSize / terrainSegments,
});
const terrainBody = new CANNON.Body({ mass: 0 });
terrainBody.addShape(heightfieldShape);
terrainBody.position.set(-terrainSize / 2, 0, terrainSize / 2);
terrainBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicsWorld.addBody(terrainBody);

// 4. Tank Creation
const tankGeometry = new THREE.BoxGeometry(2, 1, 4);
const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
scene.add(tankMesh);

const tankShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const tankBody = new CANNON.Body({ mass: 50 });
tankBody.addShape(tankShape);
tankBody.position.set(0, 5, 0);
physicsWorld.addBody(tankBody);

objectsToUpdate.push({ mesh: tankMesh, body: tankBody });

// 5. Terrain Deformation Logic
function poundTerrain(impactPosition, radius, depth) {
    const localImpact = new THREE.Vector3();
    terrainMesh.worldToLocal(localImpact.copy(impactPosition));
    const vertices = terrainGeometry.attributes.position.array;
    let needsUpdate = false;
    for (let i = 0; i < vertices.length; i += 3) {
        const dx = vertices[i] - localImpact.x;
        const dy = vertices[i + 1] - localImpact.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius) {
            const falloff = 0.5 * (Math.cos(distance / radius * Math.PI) + 1);
            vertices[i + 2] -= depth * falloff;
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        updateHeightfieldData();
    }
}

function updateHeightfieldData() {
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < terrainSegments + 1; i++) {
        for (let j = 0; j < terrainSegments + 1; j++) {
            const z = vertices[(i * (terrainSegments + 1) + j) * 3 + 2];
            heightfieldData[i][j] = z;
        }
    }
    terrainBody.shapes.forEach(shape => {
        if (shape instanceof CANNON.Heightfield) {
            shape.update();
        }
    });
}

// 6. Controls Logic
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

function performPound() {
    const frontVector = new THREE.Vector3(0, 0, -5);
    frontVector.applyQuaternion(tankMesh.quaternion);
    const impactPosition = tankMesh.position.clone().add(frontVector);
    poundTerrain(impactPosition, 5, 2);
}

// Mobile Button Listeners
document.getElementById('forward').addEventListener('touchstart', (e) => { e.preventDefault(); controls.forward = true; }, { passive: false });
document.getElementById('forward').addEventListener('touchend', () => controls.forward = false);
document.getElementById('backward').addEventListener('touchstart', (e) => { e.preventDefault(); controls.backward = true; }, { passive: false });
document.getElementById('backward').addEventListener('touchend', () => controls.backward = false);
document.getElementById('left').addEventListener('touchstart', (e) => { e.preventDefault(); controls.left = true; }, { passive: false });
document.getElementById('left').addEventListener('touchend', () => controls.left = false);
document.getElementById('right').addEventListener('touchstart', (e) => { e.preventDefault(); controls.right = true; }, { passive: false });
document.getElementById('right').addEventListener('touchend', () => controls.right = false);
document.getElementById('pound').addEventListener('touchstart', (e) => { e.preventDefault(); performPound(); }, { passive: false });

// ✨ NEW: Keyboard Listeners for Desktop Testing
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            controls.forward = true;
            break;
        case 'ArrowDown':
        case 's':
            controls.backward = true;
            break;
        case 'ArrowLeft':
        case 'a':
            controls.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            controls.right = true;
            break;
        case ' ': // Spacebar
             performPound();
             break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            controls.forward = false;
            break;
        case 'ArrowDown':
        case 's':
            controls.backward = false;
            break;
        case 'ArrowLeft':
        case 'a':
            controls.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            controls.right = false;
            break;
    }
});

// 7. Game Loop
camera.position.set(0, 20, 25);
camera.lookAt(tankMesh.position);

const clock = new THREE.Clock();
function animate() {
    const deltaTime = clock.getDelta();
    physicsWorld.step(1 / 60, deltaTime, 3);

    // --- ✅ MODIFIED CONTROLS LOGIC ---
    const moveSpeed = 8;
    const rotationSpeed = 1.5;

    // Calculate movement direction in local space
    const moveDirection = new CANNON.Vec3(0, 0, 0);
    if (controls.forward) {
        moveDirection.z = -moveSpeed;
    } else if (controls.backward) {
        moveDirection.z = moveSpeed;
    }
    
    // Convert local direction to world direction
    const worldMoveDirection = tankBody.quaternion.vmult(moveDirection);
    
    // Set velocity (preserving gravity's effect on Y-axis)
    tankBody.velocity.x = worldMoveDirection.x;
    tankBody.velocity.z = worldMoveDirection.z;

    // Handle rotation
    tankBody.angularVelocity.y = 0; // Stop rotation if no button is pressed
    if (controls.left) {
        tankBody.angularVelocity.y = rotationSpeed;
    } else if (controls.right) {
        tankBody.angularVelocity.y = -rotationSpeed;
    }
    // --- ✅ END OF MODIFIED LOGIC ---

    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    const cameraOffset = new THREE.Vector3(0, 10, 15);
    cameraOffset.applyQuaternion(tankMesh.quaternion);
    const cameraPosition = tankMesh.position.clone().add(cameraOffset);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(tankMesh.position);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
