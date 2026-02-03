<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow CORS for local dev

// Enable strict error reporting to match PDO's exception behavior
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Database Configuration
$host = 'localhost';
$db   = 'webrtc_game';
$user = 'root';
$pass = ''; // Set your password

try {
    $mysqli = new mysqli($host, $user, $pass, $db);
    $mysqli->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
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
        findOrCreateRoom($mysqli);
        break;
        
    case 'rotate_key':
        rotateKey($mysqli);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

// --- FUNCTIONS ---

function findOrCreateRoom($mysqli) {
    // Start transaction to prevent race conditions
    $mysqli->begin_transaction();

    try {
        // 1. Try to find a waiting room
        // Note: No parameters to bind here, so we skip bind_param
        $stmt = $mysqli->prepare("SELECT * FROM game_sessions WHERE status = 'WAITING' LIMIT 1 FOR UPDATE");
        $stmt->execute();
        $result = $stmt->get_result();
        $room = $result->fetch_assoc();
        $stmt->close(); // Close statement to free up the connection for next query

        if ($room) {
            // JOIN EXISTING ROOM
            $roomId = $room['id'];
            $key = $room['room_key'];
            
            // Update room to FULL
            $update = $mysqli->prepare("UPDATE game_sessions SET status = 'FULL', player_count = 2 WHERE id = ?");
            // 'i' indicates the parameter is an integer
            $update->bind_param('i', $roomId);
            $update->execute();
            $update->close();
            
            $mysqli->commit();
            
            echo json_encode([
                'role' => 'joiner', // You are Player 2
                'room_key' => $key,
                'message' => 'Joined existing session'
            ]);
        } else {
            // CREATE NEW ROOM
            $newKey = generateKey();
            
            $insert = $mysqli->prepare("INSERT INTO game_sessions (room_key, player_count, status) VALUES (?, 1, 'WAITING')");
            // 's' indicates the parameter is a string
            $insert->bind_param('s', $newKey);
            $insert->execute();
            $insert->close();
            
            $mysqli->commit();
            
            echo json_encode([
                'role' => 'initiator', // You are Player 1 (Caller)
                'room_key' => $newKey,
                'message' => 'Created new session'
            ]);
        }
    } catch (Exception $e) {
        $mysqli->rollback();
        echo json_encode(['error' => 'Transaction failed: ' . $e->getMessage()]);
    }
}

function rotateKey($mysqli) {
    $oldKey = $_POST['old_key'] ?? '';
    
    if (!$oldKey) {
        echo json_encode(['error' => 'No key provided']);
        return;
    }

    $mysqli->begin_transaction();

    try {
        // 1. Close the old room
        $closeStmt = $mysqli->prepare("UPDATE game_sessions SET status = 'CLOSED' WHERE room_key = ?");
        // 's' for string
        $closeStmt->bind_param('s', $oldKey);
        $closeStmt->execute();
        $closeStmt->close();

        // 2. Generate immediate new key for the next level
        $newKey = generateKey();
        $insert = $mysqli->prepare("INSERT INTO game_sessions (room_key, player_count, status) VALUES (?, 2, 'FULL')");
        // 's' for string
        $insert->bind_param('s', $newKey);
        $insert->execute();
        $insert->close();

        $mysqli->commit();

        echo json_encode([
            'status' => 'rotated',
            'old_key' => $oldKey,
            'new_key' => $newKey
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        echo json_encode(['error' => 'Rotation failed: ' . $e->getMessage()]);
    }
}
?>
