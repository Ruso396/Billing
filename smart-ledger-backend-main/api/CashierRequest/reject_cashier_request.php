<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data['id'] ?? 0);

mysqli_query($conn, "

UPDATE cashier_requests

SET status='rejected'

WHERE id='$id'

");

echo json_encode([
    "status"=>true,
    "message"=>"Request rejected"
]);
?>