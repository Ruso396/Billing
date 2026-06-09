<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? '';

if (!$id) {
    echo json_encode(["status"=>false,"message"=>"ID required"]);
    exit;
}

// 🔥 TRANSACTION START
mysqli_begin_transaction($conn);

try {

    // ✅ 1. DELETE USERS (admin + cashier)
    $user_sql = "DELETE FROM users WHERE company_id='$id'";
    if (!mysqli_query($conn, $user_sql)) {
        throw new Exception("User delete failed");
    }

    // ✅ 2. DELETE COMPANY
    $sql = "DELETE FROM companies WHERE id='$id'";
    if (!mysqli_query($conn, $sql)) {
        throw new Exception("Company delete failed");
    }

    mysqli_commit($conn);

    echo json_encode([
        "status"=>true,
        "message"=>"Deleted Permanently ✅"
    ]);

} catch (Exception $e) {

    mysqli_rollback($conn);

    echo json_encode([
        "status"=>false,
        "message"=>$e->getMessage()
    ]);
}
?>