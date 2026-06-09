<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include "../../config/db.php";

$data        = json_decode(file_get_contents("php://input"), true);
$company_id  = intval($data['company_id'] ?? 0);
$name        = trim($conn->real_escape_string($data['name'] ?? ''));
$phone       = trim($conn->real_escape_string($data['phone'] ?? ''));
$address     = trim($conn->real_escape_string($data['address'] ?? ''));
$type        = trim($conn->real_escape_string($data['type'] ?? 'retail'));

/* ── Validation ── */
if (!$company_id || !$name || !preg_match('/^[0-9]{10}$/', $phone)) {
    echo json_encode(["status" => false, "message" => "Invalid customer data"]);
    exit;
}

/* ── Check if customer already exists (same phone + company) ── */
$check = $conn->query("
    SELECT id FROM customers
    WHERE phone = '$phone' AND company_id = '$company_id' AND is_deleted = 0
    LIMIT 1
");

if ($check && $check->num_rows > 0) {
    /* Update existing customer info */
    $row = $check->fetch_assoc();
    $customer_id = $row['id'];

    $conn->query("
        UPDATE customers SET
            name    = '$name',
            address = '$address',
            type    = '$type',
        WHERE id = '$customer_id'
    ");

    echo json_encode([
        "status"      => true,
        "customer_id" => $customer_id,
        "is_new"      => false
    ]);
} else {
    /* Insert new customer */
    $sql = "
       INSERT INTO customers (
company_id,
name,
phone,
address,
type,
credit_enabled,
credit_limit,
credit_days,
created_at
)
       VALUES (
'$company_id',
'$name',
'$phone',
'$address',
'$type',
0,
0,
0,
NOW()
)
    ";

    if ($conn->query($sql)) {
        echo json_encode([
            "status"      => true,
            "customer_id" => $conn->insert_id,
            "is_new"      => true
        ]);
    } else {
        echo json_encode(["status" => false, "message" => $conn->error]);
    }
}
?>