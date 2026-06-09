<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$company_id = intval($data['company_id'] ?? 0);

// ❌ validation
if (!$company_id) {
    echo json_encode([
        "status"=>false,
        "message"=>"company_id required"
    ]);
    exit;
}

// ✅ FILTER BY COMPANY
$result = $conn->query("
SELECT 
    i.*,
    u.name as cashier_name
FROM invoices i
LEFT JOIN users u 
ON i.cashier_id = u.id
WHERE i.company_id='$company_id'
ORDER BY i.id DESC
");

$rows = [];

while($row = $result->fetch_assoc()){
    $row['products'] = json_decode($row['products']);
    $rows[] = $row;
}

echo json_encode([
    "status"=>true,
    "data"=>$rows
]);
?>