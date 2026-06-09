<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include __DIR__ . '/../../config/db.php';

// 🔥 GET company_id
$company_id = $_GET['company_id'] ?? 0;

if (!$company_id) {
    echo json_encode([
        "status" => false,
        "message" => "company_id required"
    ]);
    exit;
}

// 💰 TOTAL SALES
$salesQuery = $conn->query("
    SELECT COALESCE(SUM(total_amount),0) as total_sales 
    FROM invoices 
    WHERE company_id = '$company_id'
");
$sales = $salesQuery->fetch_assoc()['total_sales'];

// 📦 TOTAL PRODUCTS
$productQuery = $conn->query("
    SELECT COUNT(*) as total_products 
    FROM products 
    WHERE is_deleted = 0 AND company_id = '$company_id'
");
$totalProducts = $productQuery->fetch_assoc()['total_products'];

// ⚠️ LOW STOCK
$lowStockQuery = $conn->query("
    SELECT COUNT(*) as low_stock 
    FROM products 
    WHERE stock < 5 AND is_deleted = 0 AND company_id = '$company_id'
");
$lowStock = $lowStockQuery->fetch_assoc()['low_stock'];

// 🔥 RESPONSE
echo json_encode([
    "status" => true,
    "data" => [
        "total_sales" => (float)$sales,
        "total_products" => (int)$totalProducts,
        "low_stock" => (int)$lowStock
    ]
]);