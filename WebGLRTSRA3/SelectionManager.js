import * as THREE from 'three';

export class SelectionManager {
    constructor(camera, scene, playerUnits, ground) {
        this.camera = camera;
        this.scene = scene;
        this.playerUnits = playerUnits;
        this.ground = ground;
        this.selectedUnits = new Set();
        this.isDragging = false;
        this.dragStart = new THREE.Vector2();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.boxEl = document.getElementById('selection-box');

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this.isDragging = true;
                this.dragStart.set(e.clientX, e.clientY);
                this.boxEl.style.display = 'block';
            }
        });

        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (!this.isDragging) return;
            
            const w = e.clientX - this.dragStart.x;
            const h = e.clientY - this.dragStart.y;
            this.boxEl.style.width = Math.abs(w) + 'px';
            this.boxEl.style.height = Math.abs(h) + 'px';
            this.boxEl.style.left = (w > 0 ? this.dragStart.x : e.clientX) + 'px';
            this.boxEl.style.top = (h > 0 ? this.dragStart.y : e.clientY) + 'px';
        });

        window.addEventListener('mouseup', () => this.handleSelectionEnd());
    }

    handleSelectionEnd() {
        this.isDragging = false;
        const rect = this.boxEl.getBoundingClientRect();
        this.boxEl.style.display = 'none';

        this.selectedUnits.forEach(u => u.mesh.material.emissive.set(0x000000));
        this.selectedUnits.clear();

        if (rect.width < 10 && rect.height < 10) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObjects(this.playerUnits.map(u => u.mesh));
            if (hits.length > 0) {
                const unit = this.playerUnits.find(u => u.mesh === hits[0].object);
                this.selectUnit(unit);
            }
        } else {
            this.playerUnits.forEach(u => {
                const v = u.mesh.position.clone().project(this.camera);
                const x = (v.x + 1) * window.innerWidth / 2;
                const y = (-v.y + 1) * window.innerHeight / 2;
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    this.selectUnit(u);
                }
            });
        }
    }

    selectUnit(unit) {
        this.selectedUnits.add(unit);
        unit.mesh.material.emissive.set(0x003300);
    }
}
