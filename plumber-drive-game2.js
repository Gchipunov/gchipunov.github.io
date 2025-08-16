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

// --- NEW: Variables for mobile controls ---
let moveLeft = false;
let moveRight = false;
let jump = false;

// 1. Preload assets
function preload() {
    // No changes needed here
}

// 2. Create game objects
function create() {
    // --- Create Background ---
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // --- Create Platforms (the road) ---
    platforms = this.physics.add.staticGroup();
    let groundTexture = this.add.graphics();
    groundTexture.fillStyle(0x228B22, 1);
    groundTexture.fillRect(0, 0, 800, 64);
    groundTexture.generateTexture('ground', 800, 64);
    groundTexture.destroy();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // --- Create the Liquor Store (the goal) ---
    let storeTexture = this.add.graphics();
    storeTexture.fillStyle(0x8B4513, 1);
    storeTexture.fillRect(0, 0, 100, 150);
    storeTexture.generateTexture('store', 100, 150);
    storeTexture.destroy();
    store = this.physics.add.staticSprite(750, 145, 'store');

    // --- Create the Player (the car) ---
    let carTexture = this.add.graphics();
    carTexture.fillStyle(0xFF0000, 1);
    carTexture.fillRect(0, 0, 80, 40);
    carTexture.generateTexture('car', 80, 40);
    carTexture.destroy();
    player = this.physics.add.sprite(100, 450, 'car');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // --- Create Keyboard Controls ---
    cursors = this.input.keyboard.createCursorKeys();

    // --- Setup Collisions ---
    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, store, reachTheStore, null, this);

    // --- Add Text ---
    winText = this.add.text(400, 300, 'You made it!', { fontSize: '48px', fill: '#000' });
    winText.setOrigin(0.5);
    winText.setVisible(false);

    // --- NEW: Create Mobile Controls ---
    // Only add buttons if it's not a desktop computer
    if (!this.sys.game.device.os.desktop) {
        createMobileControls.call(this);
    }
}

// --- NEW: Function to create on-screen buttons ---
function createMobileControls() {
    // Create a graphics object for drawing buttons
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0x000000, 0.5); // Black, 50% transparent

    // --- Left Button ---
    const leftButton = buttonGraphics.fillCircle(100, 500, 50).setInteractive(new Phaser.Geom.Circle(100, 500, 50), Phaser.Geom.Circle.Contains);
    leftButton.setScrollFactor(0); // Fix button to camera
    leftButton.on('pointerdown', () => { moveLeft = true; });
    leftButton.on('pointerup', () => { moveLeft = false; });
    leftButton.on('pointerout', () => { moveLeft = false; }); // In case finger slides off

    // --- Right Button ---
    const rightButton = buttonGraphics.fillCircle(250, 500, 50).setInteractive(new Phaser.Geom.Circle(250, 500, 50), Phaser.Geom.Circle.Contains);
    rightButton.setScrollFactor(0);
    rightButton.on('pointerdown', () => { moveRight = true; });
    rightButton.on('pointerup', () => { moveRight = false; });
    rightButton.on('pointerout', () => { moveRight = false; });

    // --- Jump Button ---
    const jumpButton = buttonGraphics.fillCircle(700, 500, 50).setInteractive(new Phaser.Geom.Circle(700, 500, 50), Phaser.Geom.Circle.Contains);
    jumpButton.setScrollFactor(0);
    jumpButton.on('pointerdown', () => { jump = true; });
    jumpButton.on('pointerup', () => { jump = false; });
    jumpButton.on('pointerout', () => { jump = false; });
}


// 3. Game Loop (runs continuously)
function update() {
    // If the game is won, do nothing
    if (winText.visible) {
        player.setVelocityX(0);
        return;
    }

    // --- UPDATED: Player Movement ---
    // Now checks for both keyboard and mobile button presses
    if (cursors.left.isDown || moveLeft) {
        player.setVelocityX(-200); // Move left
    } else if (cursors.right.isDown || moveRight) {
        player.setVelocityX(200); // Move right
    } else {
        player.setVelocityX(0); // Stand still
    }

    // --- UPDATED: Player "Jump" ---
    if ((cursors.up.isDown || jump) && player.body.touching.down) {
        player.setVelocityY(-350); // Jump up
    }
}

// Function to call when player reaches the store
function reachTheStore(player, store) {
    winText.setVisible(true);
    this.physics.pause();
}
