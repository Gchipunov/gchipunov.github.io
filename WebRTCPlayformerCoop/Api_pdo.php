<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow CORS for local dev

// Database Configuration
$host = 'localhost';
$db   = 'webrtc_game';
$user = 'root';
$pass = ''; // Set your password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Helper: Generate a cryptographically secure random key
function generateKey() {
    return bin2hex(random_bytes(16)); // Creates a 32-char hex string
}

// ROUTING LOGIC
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_room':
        findOrCreateRoom($pdo);
        break;
        
    case 'rotate_key':
        rotateKey($pdo);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

// --- FUNCTIONS ---

function findOrCreateRoom($pdo) {
    // 1. Try to find a waiting room
    $stmt = $pdo->prepare("SELECT * FROM game_sessions WHERE status = 'WAITING' LIMIT 1 FOR UPDATE");
    
    // Start transaction to prevent race conditions (two players grabbing same room)
    $pdo->beginTransaction();
    $stmt->execute();
    $room = $stmt->fetch();

    if ($room) {
        // JOIN EXISTING ROOM
        $roomId = $room['id'];
        $key = $room['room_key'];
        
        // Update room to FULL
        $update = $pdo->prepare("UPDATE game_sessions SET status = 'FULL', player_count = 2 WHERE id = ?");
        $update->execute([$roomId]);
        
        $pdo->commit();
        
        echo json_encode([
            'role' => 'joiner', // You are Player 2
            'room_key' => $key,
            'message' => 'Joined existing session'
        ]);
    } else {
        // CREATE NEW ROOM
        $newKey = generateKey();
        
        $insert = $pdo->prepare("INSERT INTO game_sessions (room_key, player_count, status) VALUES (?, 1, 'WAITING')");
        $insert->execute([$newKey]);
        
        $pdo->commit();
        
        echo json_encode([
            'role' => 'initiator', // You are Player 1 (Caller)
            'room_key' => $newKey,
            'message' => 'Created new session'
        ]);
    }
}

function rotateKey($pdo) {
    // This is called when a game ends and players want a "rematch" or new level
    // It invalidates the old key and generates a new one.
    
    $oldKey = $_POST['old_key'] ?? '';
    
    if (!$oldKey) {
        echo json_encode(['error' => 'No key provided']);
        return;
    }

    $pdo->beginTransaction();

    // 1. Close the old room
    $closeStmt = $pdo->prepare("UPDATE game_sessions SET status = 'CLOSED' WHERE room_key = ?");
    $closeStmt->execute([$oldKey]);

    // 2. Generate immediate new key for the next level
    $newKey = generateKey();
    $insert = $pdo->prepare("INSERT INTO game_sessions (room_key, player_count, status) VALUES (?, 2, 'FULL')"); // Assuming keeping same pair
    $insert->execute([$newKey]);

    $pdo->commit();

    echo json_encode([
        'status' => 'rotated',
        'old_key' => $oldKey,
        'new_key' => $newKey
    ]);
}
?>
