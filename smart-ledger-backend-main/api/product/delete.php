<?php
// 🔥 CORS HEADERS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// 🔥 PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode([
        "status" => false,
        "message" => "ID required"
    ]);
    exit;
}

// 🔥 HARD DELETE
$sql = "DELETE FROM products WHERE id='$id'";

if ($conn->query($sql)) {
    echo json_encode([
        "status" => true,
        "message" => "Product permanently deleted"
    ]);
} else {
    echo json_encode([
        "status" => false,
        "message" => $conn->error
    ]);
}
?>