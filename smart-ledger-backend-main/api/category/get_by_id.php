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

$id = $_GET['id'] ?? 0;

if (!$id) {
    echo json_encode(["status"=>false,"message"=>"ID required"]);
    exit;
}

$result = mysqli_query($conn, "SELECT * FROM categories 
WHERE id='$id' AND is_deleted=0");

$data = mysqli_fetch_assoc($result);

echo json_encode(["status"=>true,"data"=>$data]);
?>