<?php
require_once("../../config/db.php");

$email = $_POST['email'];
$otp   = $_POST['otp'];

$query = "SELECT * FROM users 
          WHERE email='$email' 
          AND otp='$otp' 
          AND otp_expiry > NOW()";

$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
    
    // OTP correct → Login success
    echo json_encode([
        "status" => "success",
        "message" => "Login successful"
    ]);

} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid or expired OTP"
    ]);
}
?>