<?php
/* =========================================================
   Raw PHP Signaling Server for WebRTC
   Usage: Handles storage of SDP Offers and Answers via JSON
   ========================================================= */

// 1. Basic CORS & Header Setup (Allow connection from your HTML file)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 2. Configuration
$dataFile = 'channels.json'; // Flat file database
$keepAliveSeconds = 60;      // Delete sessions older than 60 seconds

// 3. Helper: Read/Write Data
function getData($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?? [];
}

function saveData($file, $data) {
    // Basic file locking to prevent race conditions
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

// 4. Handle Incoming Request
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Ensure we accept JSON payloads
$input = json_decode(file_get_contents('php://input'), true);

$db = getData($dataFile);
$now = time();

// Clean up old sessions
foreach ($db as $key => $session) {
    if ($now - $session['timestamp'] > $keepAliveSeconds) {
        unset($db[$key]);
    }
}

$response = ["status" => "error", "message" => "Invalid action"];

if ($method === 'POST') {
    // --- CREATE/UPDATE SESSION ---
    // Payload: { "id": "game1", "type": "offer"|"answer", "sdp": "..." }
    
    if (isset($input['id']) && isset($input['type']) && isset($input['sdp'])) {
        $gameId = $input['id'];
        
        if (!isset($db[$gameId])) {
            $db[$gameId] = ['timestamp' => $now];
        }

        // Store Offer or Answer
        $db[$gameId][$input['type']] = $input['sdp'];
        $db[$gameId]['timestamp'] = $now; // Update activity

        saveData($dataFile, $db);
        $response = ["status" => "success", "message" => "Signal saved for $gameId"];
    }
} 
elseif ($method === 'GET') {
    // --- READ SESSION ---
    // Usage: signaling.php?action=read&id=game1
    
    $gameId = $_GET['id'] ?? '';
    
    if ($action === 'read' && isset($db[$gameId])) {
        $response = [
            "status" => "success", 
            "offer"  => $db[$gameId]['offer'] ?? null,
            "answer" => $db[$gameId]['answer'] ?? null
        ];
    } else {
        $response = ["status" => "pending", "message" => "Waiting for signal..."];
    }
}

echo json_encode($response);
?>
