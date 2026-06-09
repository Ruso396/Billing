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

$company_id = intval($data['company_id']);
$name = $conn->real_escape_string($data['name']);
$phone = $conn->real_escape_string($data['phone']);
$address = $conn->real_escape_string($data['address']);
$type = $conn->real_escape_string($data['type']);
$credit_enabled = intval($data['credit_enabled']);
$credit_limit = floatval($data['credit_limit']);
$credit_days = intval($data['credit_days']);

if (!$name || !preg_match('/^[0-9]{10}$/', $phone)) {
    echo json_encode(["status"=>false,"message"=>"Invalid data"]);
    exit;
}

$sql = "INSERT INTO customers 
(company_id,name,phone,address,type,credit_enabled,credit_limit,credit_days,created_at)
VALUES ('$company_id','$name','$phone','$address','$type','$credit_enabled','$credit_limit','$credit_days',NOW())";

echo json_encode([
    "status"=>$conn->query($sql)
]);


