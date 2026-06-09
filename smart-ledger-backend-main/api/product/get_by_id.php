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

// 🔥 GET PARAM
$id = intval($_GET['id'] ?? 0);

if (!$id) {
    echo json_encode([
        "status"=>false,
        "message"=>"Product ID required"
    ]);
    exit;
}

// 🔥 FETCH PRODUCT
$result = mysqli_query($conn, "
SELECT p.*, c.name as category_name 
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.id='$id' AND p.is_deleted=0
");

$product = mysqli_fetch_assoc($result);

if (!$product) {
    echo json_encode([
        "status"=>false,
        "message"=>"Product not found"
    ]);
    exit;
}

echo json_encode([
    "status"=>true,
    "data"=>$product
]);
?>