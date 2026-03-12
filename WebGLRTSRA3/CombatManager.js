import * as THREE from 'three';
import { ProjectileManager } from './ProjectileManager.js';

export class CombatManager {
    constructor(scene, fow) {
        this.scene = scene;
        this.fow = fow; // Reference to Fog of War to trigger reveals
        this.projectiles = new ProjectileManager(scene);
        this.attackRange = 30;
        this.fireRate = 1000; // Milliseconds between shots
    }

    update(playerUnits, enemies, delta) {
        // 1. Player units look for enemies
        playerUnits.forEach(unit => {
            const target = this.findClosestTarget(unit, enemies);
            if (target && unit.mesh.position.distanceTo(target.mesh.position) < this.attackRange) {
                this.attemptFire(unit, target);
            }
        });

        // 2. Enemies look for player units
        enemies.forEach(enemy => {
            const target = this.findClosestTarget(enemy, playerUnits);
            if (target && enemy.mesh.position.distanceTo(target.mesh.position) < this.attackRange) {
                this.attemptFire(enemy, target);
                // Reveal enemy in Fog of War when they shoot
                this.fow.revealRequests.push({ pos: enemy.mesh.position.clone(), life: 40 });
            }
        });

        this.projectiles.update(delta);
    }

    findClosestTarget(unit, potentialTargets) {
        let closest = null;
        let minDist = Infinity;
        potentialTargets.forEach(target => {
            if (!target.mesh.visible) return; // Can't target what you can't see
            const dist = unit.mesh.position.distanceTo(target.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                closest = target;
            }
        });
        return closest;
    }

    attemptFire(attacker, target) {
        const now = Date.now();
        if (!attacker.lastFireTime || now - attacker.lastFireTime > this.fireRate) {
            attacker.lastFireTime = now;
            this.projectiles.spawn(attacker.mesh.position, target.mesh.position, attacker.team);
            
            // Basic recoil animation or lookAt
            attacker.mesh.lookAt(target.mesh.position);
        }
    }
}
