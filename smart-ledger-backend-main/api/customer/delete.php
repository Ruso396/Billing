<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$id = intval($data['id']);

if (!$id) {
    echo json_encode(["status" => false, "message" => "Invalid ID"]);
    exit;
}

/* 🔥 HARD DELETE */
$sql = "DELETE FROM customers WHERE id='$id'";

if ($conn->query($sql)) {
    echo json_encode(["status" => true]);
} else {
    echo json_encode(["status" => false, "message" => $conn->error]);
}
?>