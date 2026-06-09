<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data['id'] ?? 0);
$status = $data['status'] ?? '';

if (!$id || !$status) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid data"
    ]);

    exit;
}

$status = mysqli_real_escape_string($conn, $status);

$update = mysqli_query($conn, "
UPDATE products
SET status='$status'
WHERE id='$id'
");

if ($update) {

    echo json_encode([
        "success" => true,
        "message" => "Status updated"
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => mysqli_error($conn)
    ]);

}
?>