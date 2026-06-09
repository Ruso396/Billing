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
$name = $conn->real_escape_string($data['name']);
$phone = $conn->real_escape_string($data['phone']);
$address = $conn->real_escape_string($data['address']);
$type = $conn->real_escape_string($data['type']);
$credit_enabled = intval($data['credit_enabled']);
$credit_limit = floatval($data['credit_limit']);
$credit_days = intval($data['credit_days']);

$sql = "
UPDATE customers SET
name='$name',
phone='$phone',
address='$address',
type='$type',
credit_enabled='$credit_enabled',
credit_limit='$credit_limit',
credit_days='$credit_days'
WHERE id='$id'
";

echo json_encode([
    "status"=>$conn->query($sql)
]);