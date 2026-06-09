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

// 🔥 SUPPORT BOTH GET + POST
$company_id = 0;

// GET
if (isset($_GET['company_id'])) {
    $company_id = $_GET['company_id'];
}

// POST
if (isset($_POST['company_id'])) {
    $company_id = $_POST['company_id'];
}

// RAW JSON (for fetch/axios)
$input = json_decode(file_get_contents("php://input"), true);
if (isset($input['company_id'])) {
    $company_id = $input['company_id'];
}

if (!$company_id) {
    echo json_encode(["status"=>false,"message"=>"company_id required"]);
    exit;
}

$result = mysqli_query($conn, "
SELECT p.*, c.name as category_name 
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.company_id='$company_id' AND p.is_deleted=0
");

$data = [];

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode(["status"=>true,"data"=>$data]);
?>