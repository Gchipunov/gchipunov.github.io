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
    gravity: new CANNON.Vec3(0, -9.82, 0), // Standard gravity
});

// A list to keep track of objects to sync between physics and graphics
const objectsToUpdate = [];

// 3. Terrain Creation
const terrainSize = 100;
const terrainSegments = 64;

// Graphics (Three.js)
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6b2d, wireframe: false });
const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrainMesh.rotation.x = -Math.PI / 2; // Lay it flat
scene.add(terrainMesh);

// Physics (Cannon-es)
const heightfieldData = [];
const vertices = terrainGeometry.attributes.position.array;
for (let i = 0; i < terrainSegments + 1; i++) {
    const row = [];
    for (let j = 0; j < terrainSegments + 1; j++) {
        // Get the height (z-value in this case) of each vertex
        const z = vertices[(i * (terrainSegments + 1) + j) * 3 + 2];
        row.push(z);
    }
    heightfieldData.push(row);
}

const heightfieldShape = new CANNON.Heightfield(heightfieldData, {
    elementSize: terrainSize / terrainSegments,
});
const terrainBody = new CANNON.Body({ mass: 0 }); // Mass 0 makes it static
terrainBody.addShape(heightfieldShape);
terrainBody.position.set(-terrainSize / 2, 0, terrainSize / 2);
terrainBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicsWorld.addBody(terrainBody);

// 4. Tank Creation
// Graphics (Three.js)
const tankGeometry = new THREE.BoxGeometry(2, 1, 4);
const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
scene.add(tankMesh);

// Physics (Cannon-es)
const tankShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
const tankBody = new CANNON.Body({ mass: 50 });
tankBody.addShape(tankShape);
tankBody.position.set(0, 5, 0); // Start slightly above ground
physicsWorld.addBody(tankBody);

// Add to our update list
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
            // Use a smooth falloff for a crater effect
            const falloff = 0.5 * (Math.cos(distance / radius * Math.PI) + 1);
            vertices[i + 2] -= depth * falloff; // Lower the z-vertex (height)
            needsUpdate = true;
        }
    }

    // If we changed anything, tell Three.js and Cannon-es
    if (needsUpdate) {
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals(); // Recalculate lighting

        // Update physics heightfield
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
    // This is a bit of a hacky way to update Cannon.js, but it works
    terrainBody.shapes.forEach(shape => {
        if (shape instanceof CANNON.Heightfield) {
            shape.update();
        }
    });
}


// 6. Controls and Game Loop
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

document.getElementById('forward').addEventListener('touchstart', () => controls.forward = true);
document.getElementById('forward').addEventListener('touchend', () => controls.forward = false);
document.getElementById('backward').addEventListener('touchstart', () => controls.backward = true);
document.getElementById('backward').addEventListener('touchend', () => controls.backward = false);
document.getElementById('left').addEventListener('touchstart', () => controls.left = true);
document.getElementById('left').addEventListener('touchend', () => controls.left = false);
document.getElementById('right').addEventListener('touchstart', () => controls.right = true);
document.getElementById('right').addEventListener('touchend', () => controls.right = false);

document.getElementById('pound').addEventListener('touchstart', () => {
    // Pound the ground right in front of the tank
    const frontVector = new THREE.Vector3(0, 0, -5); // 5 units in front
    frontVector.applyQuaternion(tankMesh.quaternion); // Rotate with tank
    const impactPosition = tankMesh.position.clone().add(frontVector);
    poundTerrain(impactPosition, 5, 2); // Radius 5, Depth 2
});


// Set camera position relative to the tank
camera.position.set(0, 20, 25);
camera.lookAt(tankMesh.position);

const clock = new THREE.Clock();
function animate() {
    const deltaTime = clock.getDelta();

    // Update physics world
    physicsWorld.step(1 / 60, deltaTime, 3);

    // Apply forces based on controls
    const speed = 50;
    const rotationSpeed = 1.5;

    // To prevent spinning out, reset angular velocity
    tankBody.angularVelocity.set(0, 0, 0);

    if (controls.forward) {
        const force = new CANNON.Vec3(0, 0, -speed);
        const worldForce = tankBody.quaternion.vmult(force);
        tankBody.applyForce(worldForce, tankBody.position);
    }
    if (controls.backward) {
        const force = new CANNON.Vec3(0, 0, speed);
        const worldForce = tankBody.quaternion.vmult(force);
        tankBody.applyForce(worldForce, tankBody.position);
    }
    if (controls.left) {
        tankBody.angularFactor.y = 1;
        tankBody.angularVelocity.y = rotationSpeed;
    }
    if (controls.right) {
        tankBody.angularFactor.y = 1;
        tankBody.angularVelocity.y = -rotationSpeed;
    }


    // Sync graphics with physics
    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    // Update camera to follow tank
    const cameraOffset = new THREE.Vector3(0, 10, 15);
    cameraOffset.applyQuaternion(tankMesh.quaternion);
    const cameraPosition = tankMesh.position.clone().add(cameraOffset);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(tankMesh.position);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

