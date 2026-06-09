<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../../config/db.php";

/* ===========================
   INPUTS
=========================== */

$company_id = intval($_GET['company_id'] ?? 0);
$phone      = trim($conn->real_escape_string($_GET['phone'] ?? ''));

/* ===========================
   VALIDATION
=========================== */

if (!$company_id || !preg_match('/^[0-9]{10}$/', $phone)) {
    echo json_encode([
        "status" => false,
        "message" => "Invalid input"
    ]);
    exit;
}

/* ===========================
   FETCH CUSTOMER
=========================== */

$sql = "
    SELECT 
        id,
        name,
        phone,
        address,
        type,
        gst_no,
        credit_enabled,
        credit_limit,
        credit_days
    FROM customers
    WHERE company_id = '$company_id'
      AND phone = '$phone'
      AND is_deleted = 0
    LIMIT 1
";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {

    $customer = $result->fetch_assoc();

    echo json_encode([
        "status" => true,
        "data"   => $customer
    ]);

} else {

    echo json_encode([
        "status" => false,
        "message" => "Customer not found"
    ]);
}
?>