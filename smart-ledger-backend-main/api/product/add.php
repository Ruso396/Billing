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

// Fields
$name = trim($data['product_name'] ?? '');
$product_code = trim($data['product_code'] ?? '');
$category_id = intval($data['category_id'] ?? 0);
$price = floatval($data['price'] ?? 0);
$stock = intval($data['stock'] ?? 0);
$barcode = $data['barcode'] ?? '';
$unit = $data['unit'] ?? 'piece';
$gst = floatval($data['gst_percentage'] ?? 0);
$company_id = intval($data['company_id'] ?? 0);

// Validation
if (!$name || !$category_id || !$company_id) {
    echo json_encode(["status"=>false,"message"=>"Required fields missing"]);
    exit;
}

// 🔥 CHECK CATEGORY EXISTS + MATCH COMPANY
$check = mysqli_query($conn, "SELECT id FROM categories 
WHERE id='$category_id' AND company_id='$company_id' AND is_deleted=0 AND status='active'");

if (mysqli_num_rows($check) == 0) {
    echo json_encode([
        "status"=>false,
        "message"=>"Invalid category_id or company_id"
    ]);
    exit;
}

// Insert
$sql = "INSERT INTO products 
(product_name, product_code, category_id, price, stock, barcode, unit, gst_percentage, company_id)
VALUES 
('$name', '$product_code','$category_id','$price','$stock','$barcode','$unit','$gst','$company_id')";

if ($conn->query($sql)) {
    echo json_encode(["status"=>true,"message"=>"Product added"]);
} else {
    echo json_encode(["status"=>false,"message"=>$conn->error]);
}
?>