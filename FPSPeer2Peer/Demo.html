<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>P2P WebGL Shooter</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: sans-serif; }
        #ui { position: absolute; top: 20px; left: 20px; color: white; pointer-events: none; }
        #crosshair { position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; 
                     border: 2px solid white; border-radius: 50%; transform: translate(-50%, -50%); }
        #menu { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8); padding: 20px; color: white; text-align: center; }
        button { padding: 10px 20px; cursor: pointer; }
    </style>
</head>
<body>

<div id="ui">
    <div id="status">Connecting to PeerServer...</div>
    <div id="peer-id"></div>
    <div id="players-count">Players: 1</div>
</div>
<div id="crosshair"></div>

<div id="menu">
    <h1>3D P2P SHOOTER</h1>
    <p>Share your ID with a friend to play together</p>
    <input type="text" id="remoteId" placeholder="Friend's Peer ID">
    <button id="connectBtn">Connect to Friend</button>
    <br><br>
    <button id="startBtn">START GAME (Click to Lock Mouse)</button>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js"></script>
<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>

<script>
/** * GAME CONFIG & GLOBALS 
 */
let scene, camera, renderer, clock, peer, myId;
let players = {}; // Stores mesh of other players
let connections = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

// Initialization
init();
setupNetworking();
animate();

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // Human height

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. Lighting
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    // 3. Environment (Floor and basic obstacles)
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Add some random cubes as obstacles
    for(let i=0; i<10; i++) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshPhongMaterial({color: 0xff4444}));
        box.position.set(Math.random()*40-20, 2, Math.random()*40-20);
        scene.add(box);
    }

    // 4. Input Handling
    clock = new THREE.Clock();
    document.getElementById('startBtn').addEventListener('click', () => {
        document.body.requestPointerLock();
        document.getElementById('menu').style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyW') moveForward = true;
        if(e.code === 'KeyS') moveBackward = true;
        if(e.code === 'KeyA') moveLeft = true;
        if(e.code === 'KeyD') moveRight = true;
        if(e.code === 'Space') shoot();
    });
    document.addEventListener('keyup', (e) => {
        if(e.code === 'KeyW') moveForward = false;
        if(e.code === 'KeyS') moveBackward = false;
        if(e.code === 'KeyA') moveLeft = false;
        if(e.code === 'KeyD') moveRight = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });
}

/**
 * NETWORKING LOGIC (PeerJS)
 */
function setupNetworking() {
    peer = new Peer(); // Auto-generates a random ID

    peer.on('open', (id) => {
        myId = id;
        document.getElementById('status').innerText = "Online";
        document.getElementById('peer-id').innerText = "Your ID: " + id;
    });

    // Handle incoming connections
    peer.on('connection', (conn) => {
        setupConnHandlers(conn);
    });

    document.getElementById('connectBtn').addEventListener('click', () => {
        const remoteId = document.getElementById('remoteId').value;
        if(remoteId) {
            const conn = peer.connect(remoteId);
            setupConnHandlers(conn);
        }
    });
}

function setupConnHandlers(conn) {
    conn.on('open', () => {
        connections.push(conn);
        document.getElementById('players-count').innerText = `Players: ${connections.length + 1}`;
        // Create an avatar for the new player
        createPlayerAvatar(conn.peer);
    });

    conn.on('data', (data) => {
        if(data.type === 'move') {
            if(players[conn.peer]) {
                players[conn.peer].position.set(data.pos.x, data.pos.y, data.pos.z);
                players[conn.peer].rotation.y = data.rotY;
            }
        }
        if(data.type === 'shoot') {
            spawnBullet(data.pos, data.dir, 0xffff00);
        }
    });
}

function createPlayerAvatar(id) {
    const geo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const mat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1;
    scene.add(mesh);
    players[id] = mesh;
}

/**
 * GAMEPLAY MECHANICS
 */
function shoot() {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const pos = camera.position.clone();
    
    spawnBullet(pos, dir, 0xff0000);

    // Broadcast shot to peers
    connections.forEach(c => {
        c.send({ type: 'shoot', pos: pos, dir: dir });
    });
}

function spawnBullet(pos, dir, color) {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: color })
    );
    bullet.position.copy(pos);
    scene.add(bullet);

    // Simple bullet move and cleanup
    const startTime = Date.now();
    const interval = setInterval(() => {
        bullet.position.addScaledVector(dir, 0.5);
        if(Date.now() - startTime > 2000) {
            scene.remove(bullet);
            clearInterval(interval);
        }
    }, 16);
}

/**
 * ENGINE LOOP
 */
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (document.pointerLockElement === document.body) {
        // Movement Logic
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        camera.translateX(-velocity.x * delta);
        camera.translateZ(velocity.z * delta);
        camera.position.y = 1.6; // Keep on ground

        // Broadcast position
        if(connections.length > 0) {
            connections.forEach(c => {
                c.send({
                    type: 'move',
                    pos: { x: camera.position.x, y: camera.position.y - 0.6, z: camera.position.z },
                    rotY: camera.rotation.y
                });
            });
        }
    }

    renderer.render(scene, camera);
}

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>
</body>
</html>
