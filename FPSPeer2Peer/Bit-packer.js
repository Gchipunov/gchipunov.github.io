function broadcast(msg) {
    let buffer;

    if (msg.type === 'move') {
        // 1 byte (type) + 4 bytes (X) + 4 bytes (Y) + 4 bytes (Z) + 4 bytes (Rot) = 17 bytes
        buffer = new ArrayBuffer(17);
        const view = new DataView(buffer);
        view.setUint8(0, 0); // Type 0 = Move
        view.setFloat32(1, msg.pos.x);
        view.setFloat32(5, msg.pos.y);
        view.setFloat32(9, msg.pos.z);
        view.setFloat32(13, msg.rotY);
    } 
    else if (msg.type === 'shoot') {
        // 1 byte (type) + 3 floats (pos) + 3 floats (dir) = 25 bytes
        buffer = new ArrayBuffer(25);
        const view = new DataView(buffer);
        view.setUint8(0, 1); // Type 1 = Shoot
        view.setFloat32(1, msg.pos.x);
        view.setFloat32(5, msg.pos.y);
        view.setFloat32(9, msg.pos.z);
        view.setFloat32(13, msg.dir.x);
        view.setFloat32(17, msg.dir.y);
        view.setFloat32(21, msg.dir.z);
    }

    // Send via P2P (PeerJS supports ArrayBuffer)
    connections.forEach(c => c.send(buffer));

    // Send via WebTransport (Raw UDP)
    if (datagramWriter) {
        datagramWriter.write(buffer);
    }
}
