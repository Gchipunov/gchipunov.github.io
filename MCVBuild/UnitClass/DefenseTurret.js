class DefenseTurret extends Unit {
    constructor(pos, team, hp = 300, range = 18, damage = 15) {
        super(pos, team, hp, 0); // Speed set to 0
        this.range = range;
        this.damage = damage;
        this.rateOfFire = 0.5; // Shoots every 0.5s
        this.type = 'turret';
        this.turretMesh = null; // Separate mesh child for 360-degree rotation
    }

    // Override move to explicitly block any pathing or position changes
    move(targetPos) {
        this.path = [];
        return; 
    }

    update(dt) {
        this.attackCooldown -= dt;

        // 1. Target Validation & Retargeting
        if (!this.target || this.target.hp <= 0 || !this.inRange(this.target)) {
            this.target = this.findPrioritizedTarget();
        }

        // 2. Engagement Loop
        if (this.target) {
            // Rotate turret top toward target while base remains static
            if (this.turretMesh) {
                const targetWorldPos = this.target.mesh.position.clone();
                targetWorldPos.y = this.turretMesh.position.y; // Keep rotation on horizontal axis
                this.turretMesh.lookAt(targetWorldPos);
            } else if (this.mesh) {
                this.mesh.lookAt(this.target.mesh.position);
            }

            // Fire when cooldown expires
            if (this.attackCooldown <= 0) {
                this.shoot(this.target);
                this.attackCooldown = this.rateOfFire;
            }
        }
    }

    inRange(entity) {
        if (!entity || !entity.mesh) return false;
        return this.mesh.position.distanceTo(entity.mesh.position) <= this.range;
    }

    findPrioritizedTarget() {
        const potentialTargets = this.team === 'blue'
            ? game.enemies
            : [...game.units, ...game.buildings];

        let bestTarget = null;
        let closestDist = this.range;

        for (let entity of potentialTargets) {
            if (entity.hp <= 0) continue;
            
            const dist = this.mesh.position.distanceTo(entity.mesh.position);
            if (dist <= closestDist) {
                closestDist = dist;
                bestTarget = entity; // Targets nearest threat in range
            }
        }

        return bestTarget;
    }

    shoot(target) {
        // Projectile setup spawning from turret barrel height
        const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        
        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(0.15),
            new THREE.MeshBasicMaterial({ color: 0xffa500 })
        );
        bullet.position.copy(spawnPos);
        game.scene.add(bullet);

        game.projectiles.push({
            mesh: bullet,
            target: target,
            speed: 30,
            damage: this.damage,
            update: function(dt) {
                if (!this.target || this.target.hp <= 0) {
                    this.remove = true;
                    return;
                }
                const dir = new THREE.Vector3().subVectors(this.target.mesh.position, this.mesh.position).normalize();
                this.mesh.position.add(dir.multiplyScalar(this.speed * dt));

                if (this.mesh.position.distanceTo(this.target.mesh.position) < 0.6) {
                    this.target.takeDamage(this.damage);
                    this.remove = true;
                }
            }
        });
    }
}
