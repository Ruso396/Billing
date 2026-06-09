<?php
require_once("../../config/db.php");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$email = $_POST['email'];

// Generate OTP
$otp = rand(100000, 999999);
$expiry = date("Y-m-d H:i:s", strtotime("+5 minutes"));

// Save OTP in DB
$query = "INSERT INTO users (email, otp, otp_expiry) 
          VALUES ('$email', '$otp', '$expiry')
          ON DUPLICATE KEY UPDATE 
          otp='$otp', otp_expiry='$expiry'";

mysqli_query($conn, $query);

// Send Email
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'your_email@gmail.com';
    $mail->Password   = 'your_app_password'; // Gmail App Password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;

    $mail->setFrom('your_email@gmail.com', 'Billing App');
    $mail->addAddress($email);

    $mail->Subject = 'Your OTP Code';
    $mail->Body    = "Your OTP is: $otp";

    $mail->send();

    echo json_encode(["status" => "success", "message" => "OTP sent"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $mail->ErrorInfo]);
}
?>