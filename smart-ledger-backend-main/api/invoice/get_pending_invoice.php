<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$company_id = intval($data['company_id'] ?? 0);

if (!$company_id) {

    echo json_encode([
        "status" => false,
        "message" => "company_id required"
    ]);

    exit;
}

// ✅ PENDING + CREDIT LIMIT + PAID AMOUNT

$result = $conn->query("

SELECT 

    i.*,

    IFNULL(c.credit_limit,0) as credit_limit,

    (i.total_amount - i.balance_amount) as paid_amount_total

FROM invoices i

LEFT JOIN customers c
ON c.id = i.customer_id

WHERE i.company_id='$company_id'

AND i.balance_amount > 0

ORDER BY i.id DESC

");

$rows = [];

while($row = $result->fetch_assoc()){

    $row['products'] = json_decode($row['products']);

    $rows[] = $row;
}

echo json_encode([
    "status" => true,
    "data" => $rows
]);
?>

