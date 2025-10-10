import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);

// 2. Physics World Setup
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // Standard gravity
});

// A list to keep track of objects to sync between physics and graphics
const objectsToUpdate = [];
