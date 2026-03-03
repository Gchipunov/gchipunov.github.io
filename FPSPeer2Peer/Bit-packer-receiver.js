function handleIncomingBinary(id, buffer) {
    const view = new DataView(buffer);
    const type = view.getUint8(0);

    if (type === 0) { // MOVE
        const pos = {
            x: view.getFloat32(1),
            y: view.getFloat32(5),
            z: view.getFloat32(9)
        };
        const rotY = view.getFloat32(13);
        
        // Push to our Interpolation targets
        if (!players[id]) createPlayerAvatar(id);
        remoteTargets[id] = { pos: new THREE.Vector3(pos.x, pos.y, pos.z), rotY: rotY };
    } 
    else if (type === 1) { // SHOOT
        const pos = new THREE.Vector3(view.getFloat32(1), view.getFloat32(5), view.getFloat32(9));
        const dir = new THREE.Vector3(view.getFloat32(13), view.getFloat32(17), view.getFloat32(21));
        spawnBullet(pos, dir, 0xffff00);
    }
}

// Update your listeners
peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        if (data instanceof ArrayBuffer) handleIncomingBinary(conn.peer, data);
    });
});
