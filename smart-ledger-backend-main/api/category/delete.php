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
$id = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode(["status"=>false,"message"=>"ID required"]);
    exit;
}

mysqli_begin_transaction($conn);

try {

    // 🔥 1. DELETE PRODUCTS
    $res1 = mysqli_query($conn, "DELETE FROM products WHERE category_id = $id");

    if (!$res1) {
        throw new Exception("Product delete failed: " . mysqli_error($conn));
    }

    // 🔥 2. DELETE CATEGORY
    $res2 = mysqli_query($conn, "DELETE FROM categories WHERE id = $id");

    if (!$res2) {
        throw new Exception("Category delete failed: " . mysqli_error($conn));
    }

    mysqli_commit($conn);

    echo json_encode([
        "status" => true,
        "message" => "Category + related products deleted"
    ]);

} catch (Exception $e) {

    mysqli_rollback($conn);

    echo json_encode([
        "status" => false,
        "message" => $e->getMessage()
    ]);
}