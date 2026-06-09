<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../../config/db.php";

$company_id = intval($_GET['company_id']);

$res = $conn->query("

SELECT 
    c.*,

    IFNULL(
        SUM(
            CASE
                WHEN i.balance_amount < 0
                THEN ABS(i.balance_amount)
                ELSE 0
            END
        ),
    0) as advance_amount

FROM customers c

LEFT JOIN invoices i
ON i.customer_id = c.id

WHERE c.company_id='$company_id'
AND c.is_deleted=0

GROUP BY c.id

ORDER BY c.id DESC

");

$data = [];

while($row = $res->fetch_assoc()){

    $data[] = $row;
}

echo json_encode([
    "status"=>true,
    "data"=>$data
]);
?>