<?php
session_start();
require 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_SESSION['verify_email'];
    $code = $_POST['code'];

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND verification_code = ?");
    $stmt->bind_param("ss", $email, $code);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $update = $conn->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?");
        $update->bind_param("s", $email);
        $update->execute();
        
        unset($_SESSION['verify_email']);
        echo "Account verified! <a href='login.php'>Click here to Login</a>";
        exit;
    } else {
        echo "Invalid verification code.";
    }
}
?>

<!DOCTYPE html>
<html>
<head><title>Verify Account</title></head>
<body>
    <h2>Enter Verification Code</h2>
    <form method="POST">
        <input type="text" name="code" placeholder="6-digit code" required><br><br>
        <button type="submit">Verify</button>
    </form>
</body>
</html>
