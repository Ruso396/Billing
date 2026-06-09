<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$id = intval($data['id']);

$res = $conn->query("
SELECT * FROM customers WHERE id='$id' LIMIT 1
");

echo json_encode([
    "status"=>true,
    "data"=>$res->fetch_assoc()
]);