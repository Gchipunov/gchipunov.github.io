// Add a global object to store target states
let remoteTargets = {};

function updateRemotePlayer(id, data) {
    if (!players[id]) createPlayerAvatar(id);
    
    if (data.type === 'move') {
        // Store the target position/rotation instead of snapping
        remoteTargets[id] = {
            pos: new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z),
            rotY: data.rotY
        };
    } else if (data.type === 'shoot') {
        spawnBullet(data.pos, data.dir, 0xffff00);
    }
}
