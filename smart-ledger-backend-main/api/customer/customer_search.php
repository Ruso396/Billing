<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include "../../config/db.php";

$company_id = intval($_GET['company_id'] ?? 0);
$q          = trim($conn->real_escape_string($_GET['q'] ?? ''));

if (!$company_id || strlen($q) < 2) {
    echo json_encode(["status" => false, "message" => "Invalid params"]);
    exit;
}

$result = $conn->query("
    SELECT id, name, phone, address, type, credit_enabled, credit_limit, credit_days, loyalty_points
    FROM customers
    WHERE company_id = '$company_id'
      AND is_deleted = 0
      AND (name LIKE '%$q%' OR phone LIKE '%$q%')
    ORDER BY name ASC
    LIMIT 10
");

$customers = [];
while ($row = $result->fetch_assoc()) {
    $customers[] = $row;
}

echo json_encode([
    "status" => true,
    "data"   => $customers
]);
?>