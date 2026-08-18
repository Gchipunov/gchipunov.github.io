<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendCode($toEmail, $code) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'YOUR_GMAIL@gmail.com'; 
        $mail->Password   = 'YOUR_GMAIL_APP_PASSWORD'; // Use Google App Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('YOUR_GMAIL@gmail.com', 'Auth System');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = 'Your Registration Code';
        $mail->Body    = "Your verification code is: <b>$code</b>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}
?>
