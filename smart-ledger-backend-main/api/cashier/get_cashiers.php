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
$company_id = $data['company_id'];

$sql = "SELECT id,name,email,status FROM users 
        WHERE role='cashier' AND company_id='$company_id'";

$res = $conn->query($sql);

$dataArr = [];
while($row = $res->fetch_assoc()){
    $dataArr[] = $row;
}

echo json_encode(["status"=>true,"data"=>$dataArr]);