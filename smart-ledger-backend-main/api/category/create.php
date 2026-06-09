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

$name = trim($data['name'] ?? '');
$company_id = intval($data['company_id'] ?? 0);

if (!$name || !$company_id) {
    echo json_encode(["status"=>false,"message"=>"Name & Company required"]);
    exit;
}

// Duplicate check
$dup = mysqli_query($conn, "SELECT id FROM categories 
WHERE name='$name' AND company_id='$company_id' AND is_deleted=0");

if (mysqli_num_rows($dup) > 0) {
    echo json_encode(["status"=>false,"message"=>"Category already exists"]);
    exit;
}

$sql = "INSERT INTO categories (name, company_id)
VALUES ('$name','$company_id')";

if ($conn->query($sql)) {
    echo json_encode(["status"=>true,"message"=>"Category added"]);
} else {
    echo json_encode(["status"=>false,"message"=>$conn->error]);
}
?>