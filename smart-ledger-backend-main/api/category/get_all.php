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

$company_id = $_GET['company_id'] ?? 0;

if (!$company_id) {
    echo json_encode([
        "status"=>false,
        "message"=>"company_id required"
    ]);
    exit;
}

$result = mysqli_query($conn, "
SELECT * FROM categories 
WHERE company_id='$company_id'
AND is_deleted=0

");

$data = [];

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode([
    "status"=>true,
    "data"=>$data
]);
?>