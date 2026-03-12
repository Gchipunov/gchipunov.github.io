import * as THREE from 'three';

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.speed = 1.5;
    }

    spawn(startPos, endPos, team) {
        // Create a simple laser/tracer mesh
        const geometry = new THREE.CapsuleGeometry(0.1, 1, 4, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: team === 'player' ? 0x00ffff : 0xffaa00 
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.copy(startPos);
        mesh.lookAt(endPos);
        mesh.rotateX(Math.PI / 2); // Align capsule length with direction

        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        
        this.scene.add(mesh);
        this.projectiles.push({ mesh, direction, life: 60 });
    }

    update() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.addScaledVector(p.direction, this.speed);
            p.life--;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
}
