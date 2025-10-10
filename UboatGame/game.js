// ====== THREE.js Scene Setup ======
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa); // Light grey background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 15, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// ====== CANNON.js Physics Setup ======
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -9.82, 0); // Gravity pulls things down

// Create a ground plane for things to rest on
const groundBody = new CANNON.Body({ mass: 0 }); // mass 0 makes it static
const groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be flat
physicsWorld.addBody(groundBody);

// Corresponding visual floor for Three.js
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);
