import * as THREE from 'three';

export class FogOfWar {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = 512;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.revealRequests = []; 
    }

    update(playerUnits) {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, 512, 512);
        this.ctx.globalCompositeOperation = 'screen';

        const drawCircle = (pos, radius, opacity) => {
            const x = ((pos.x + 100) / 200) * 512;
            const z = ((pos.z + 100) / 200) * 512;
            const grad = this.ctx.createRadialGradient(x, z, 0, x, z, radius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath(); this.ctx.arc(x, z, radius, 0, Math.PI * 2); this.ctx.fill();
        };

        playerUnits.forEach(u => drawCircle(u.mesh.position, 50, 1));
        this.revealRequests = this.revealRequests.filter(r => {
            drawCircle(r.pos, 30, r.life / 10);
            return --r.life > 0;
        });

        this.ctx.globalCompositeOperation = 'source-over';
        this.texture.needsUpdate = true;
    }

    isVisible(worldPos) {
        const x = Math.floor(((worldPos.x + 100) / 200) * 512);
        const z = Math.floor(((worldPos.z + 100) / 200) * 512);
        const pixel = this.ctx.getImageData(x, z, 1, 1).data;
        return pixel[0] > 50;
    }
}
