CREATE TABLE game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_key VARCHAR(64) NOT NULL UNIQUE,
    player_count INT DEFAULT 0,
    status ENUM('WAITING', 'FULL', 'CLOSED') DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index for speed when searching for open rooms
    INDEX (status)
);
