// A simple class to represent our RTS structure with attributes
class RTSStructure {
    constructor(model, health, armor) {
        this.model = model; // The Three.js Object3D for the model
        this.health = health;
        this.armor = armor;
        // You could add more properties here, like upgrade levels, etc.
    }

    upgradeArmor() {
        // Implement upgrade logic here. E.g., increase armor by a certain amount.
        if (this.armor < 100) {
            this.armor += 10;
            console.log('Armor upgraded! New armor:', this.armor);
            // You might also need to update the UI here or in a separate function
            updateUI(this);
        } else {
            console.log('Armor is already at max level.');
        }
    }
}

let scene, camera, renderer, controls;
let structure; // The instance of our RTSStructure class
let raycaster, mouse;

// DOM elements
const infoPanel = document.getElementById('info-panel');
const healthValueSpan = document.getElementById('health-value');
const armorValueSpan = document.getElementById('armor-value');
const upgradeButton = document.getElementById('upgrade-button');

init();
animate();

function init() {
    // 1. Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. Camera controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(2, 2, 5);
    controls.update();

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 4. Raycaster for picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 5. Load the glTF model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'power_plant_structure.glb', // Replace with your model file path
        (gltf) => {
            const model = gltf.scene;
            scene.add(model);
            
            // Create our RTSStructure instance once the model is loaded
            // We can initialize it with some arbitrary values
            structure = new RTSStructure(model, 100, 50);

            // Position the model and the camera nicely
            model.position.set(0, 0, 0);
            camera.lookAt(model.position);

            // Initial UI update
            updateUI(structure);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened', error);
        }
    );

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('click', onCanvasClick, false);
    upgradeButton.addEventListener('click', () => {
        if (structure) {
            structure.upgradeArmor();
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with the loaded model
    if (structure) {
        const intersects = raycaster.intersectObject(structure.model, true);
        
        if (intersects.length > 0) {
            // A part of our structure was clicked
            console.log('Structure clicked!');
            infoPanel.style.display = 'block';
            updateUI(structure); // Update UI to be sure it's showing the correct values
        } else {
            // Nothing was clicked, or something else
            // infoPanel.style.display = 'none'; // Optional: hide panel if nothing is selected
        }
    }
}

function updateUI(struct) {
    if (struct) {
        healthValueSpan.textContent = struct.health;
        armorValueSpan.textContent = struct.armor;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, which is good practice
    renderer.render(scene, camera);
}
