<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$new_password = $data['password'] ?? '';

if (!$email || !$new_password) {
    echo json_encode([
        "status"=>false,
        "message"=>"Email & password required"
    ]);
    exit;
}

// 🔥 CHECK USER
$user = mysqli_query($conn, "SELECT * FROM users WHERE email='$email'");

if (mysqli_num_rows($user) == 0) {
    echo json_encode([
        "status"=>false,
        "message"=>"Email not found"
    ]);
    exit;
}

$userData = mysqli_fetch_assoc($user);

// 🔥 HASH PASSWORD
$hashed = password_hash($new_password, PASSWORD_DEFAULT);

// 🔥 TRANSACTION
mysqli_begin_transaction($conn);

try {

    // ✅ UPDATE USERS TABLE
    $updateUser = "UPDATE users SET password='$hashed' WHERE email='$email'";
    if (!mysqli_query($conn, $updateUser)) {
        throw new Exception("User update failed");
    }

    // ✅ IF ADMIN → UPDATE COMPANY ALSO
    if ($userData['role'] == 'admin') {
        $company_id = $userData['company_id'];

        $updateCompany = "UPDATE companies SET owner_password='$hashed' WHERE id='$company_id'";
        if (!mysqli_query($conn, $updateCompany)) {
            throw new Exception("Company update failed");
        }
    }

    mysqli_commit($conn);

    echo json_encode([
        "status"=>true,
        "message"=>"Password updated successfully 🔥"
    ]);

} catch (Exception $e) {

    mysqli_rollback($conn);

    echo json_encode([
        "status"=>false,
        "message"=>$e->getMessage()
    ]);
}
?>