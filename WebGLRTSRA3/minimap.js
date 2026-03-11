import * as THREE from 'three';

export class MiniMap {
    constructor(scene, worldSize) {
        this.worldSize = worldSize;
        
        // 1. Create a top-down Orthographic Camera
        const aspect = 1; // Square mini-map
        this.camera = new THREE.OrthographicCamera(
            -worldSize/2, worldSize/2, worldSize/2, -worldSize/2, 1, 1000
        );
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, -1); // Align 'up' with world North

        // 2. Setup the secondary renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(150, 150); // Mini-map size in pixels
        this.domElement = this.renderer.domElement;
        
        // Style the mini-map element
        this.domElement.style.position = 'fixed';
        this.domElement.style.bottom = '10px';
        this.domElement.style.right = '10px';
        this.domElement.style.border = '2px solid #555';
        this.domElement.style.background = 'rgba(0,0,0,0.8)';
        this.domElement.style.borderRadius = '5px';
        this.domElement.style.zIndex = '100';
        document.body.appendChild(this.domElement);
    }

    render(scene) {
        this.renderer.render(scene, this.camera);
    }
}
