// game.js

// Configuration for the game
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 }, // Gravity pulls things down
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Create a new Phaser game instance
const game = new Phaser.Game(config);

let player;
let platforms;
let cursors;
let store;
let winText;

// 1. Preload assets
function preload() {
    // In a real game, you'd load image files here.
    // For this example, we'll create simple graphics dynamically.
    // this.load.image('car', 'assets/car.png');
    // this.load.image('road', 'assets/road.png');
    // this.load.image('store', 'assets/store.png');
}

// 2. Create game objects
function create() {
    // --- Create Background ---
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // --- Create Platforms (the road) ---
    platforms = this.physics.add.staticGroup();

    // Create a ground texture (a simple green rectangle)
    let groundTexture = this.add.graphics();
    groundTexture.fillStyle(0x228B22, 1); // Forest green
    groundTexture.fillRect(0, 0, 800, 64);
    groundTexture.generateTexture('ground', 800, 64);
    groundTexture.destroy();

    // Create the ground platform
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    // Create some floating platforms
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // --- Create the Liquor Store (the goal) ---
    let storeTexture = this.add.graphics();
    storeTexture.fillStyle(0x8B4513, 1); // Brown color for the store
    storeTexture.fillRect(0, 0, 100, 150);
    storeTexture.generateTexture('store', 100, 150);
    storeTexture.destroy();

    store = this.physics.add.staticSprite(750, 145, 'store');

    // --- Create the Player (the car) ---
    let carTexture = this.add.graphics();
    carTexture.fillStyle(0xFF0000, 1); // Red color for the car
    carTexture.fillRect(0, 0, 80, 40);
    carTexture.generateTexture('car', 80, 40);
    carTexture.destroy();

    player = this.physics.add.sprite(100, 450, 'car');
    player.setBounce(0.2); // Give it a little bounce
    player.setCollideWorldBounds(true); // Don't let it fall off the screen

    // --- Create Controls ---
    cursors = this.input.keyboard.createCursorKeys();

    // --- Setup Collisions ---
    this.physics.add.collider(player, platforms); // Car collides with the road
    this.physics.add.overlap(player, store, reachTheStore, null, this); // Check if car reaches store

    // --- Add Text ---
    winText = this.add.text(400, 300, 'You made it!', { fontSize: '48px', fill: '#000' });
    winText.setOrigin(0.5);
    winText.setVisible(false);
}

// 3. Game Loop (runs continuously)
function update() {
    // If the game is won, do nothing
    if (winText.visible) {
        player.setVelocityX(0);
        return;
    }

    // --- Player Movement ---
    if (cursors.left.isDown) {
        player.setVelocityX(-200); // Move left
    } else if (cursors.right.isDown) {
        player.setVelocityX(200); // Move right
    } else {
        player.setVelocityX(0); // Stand still
    }

    // --- Player "Jump" (cars can jump in platformers!) ---
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-350); // Jump up
    }
}

// Function to call when player reaches the store
function reachTheStore(player, store) {
    winText.setVisible(true); // Show the "You made it!" text
    this.physics.pause(); // Stop the physics engine
}
