<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../../config/db.php";

$company_id = intval($_GET['company_id'] ?? 0);

if (!$company_id) {
    echo json_encode(["status"=>false,"message"=>"Company ID required"]);
    exit;
}

/* ─────────────────────────────────────────
   1. TOTAL CREDIT SALES
───────────────────────────────────────── */
$credit = 0;
$res = $conn->query("
    SELECT SUM(total_amount) as total
    FROM invoices
    WHERE company_id='$company_id'
    AND payment_type='credit'
");
if ($row = $res->fetch_assoc()) {
    $credit = floatval($row['total']);
}

/* ─────────────────────────────────────────
   2. TOTAL OUTSTANDING
───────────────────────────────────────── */
$outstanding = 0;
$res = $conn->query("
    SELECT SUM(balance_amount) as total
    FROM payments
    WHERE company_id='$company_id'
    AND balance_amount > 0
");
if ($row = $res->fetch_assoc()) {
    $outstanding = floatval($row['total']);
}

/* ─────────────────────────────────────────
   3. OVERDUE AMOUNT
───────────────────────────────────────── */
$overdue = 0;
$res = $conn->query("
    SELECT SUM(p.balance_amount) as total
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE p.company_id='$company_id'
    AND p.balance_amount > 0
    AND i.due_date IS NOT NULL
    AND i.due_date < CURDATE()
");
if ($row = $res->fetch_assoc()) {
    $overdue = floatval($row['total']);
}

/* ─────────────────────────────────────────
   4. TODAY COLLECTION
───────────────────────────────────────── */
$today = 0;
$res = $conn->query("
    SELECT SUM(paid_amount) as total
    FROM payments
    WHERE company_id='$company_id'
    AND DATE(created_at) = CURDATE()
");
if ($row = $res->fetch_assoc()) {
    $today = floatval($row['total']);
}

/* ─────────────────────────────────────────
   5. TABLE DATA
───────────────────────────────────────── */
$list = [];

$res = $conn->query("
    SELECT 
        i.customer_name,
        p.balance_amount,
        i.due_date,

        CASE 
            WHEN p.balance_amount <= 0 THEN 'Paid'
            WHEN i.due_date IS NOT NULL AND i.due_date < CURDATE() THEN 'Overdue'
            ELSE 'Pending'
        END AS status

    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id

    WHERE p.company_id='$company_id'
    AND p.balance_amount > 0

    ORDER BY i.due_date ASC
");

while ($row = $res->fetch_assoc()) {
    $list[] = [
        "customer"    => $row['customer_name'],
        "outstanding" => floatval($row['balance_amount']),
        "due_date"    => $row['due_date'],
        "status"      => $row['status']
    ];
}

/* ─────────────────────────────────────────
   FINAL RESPONSE
───────────────────────────────────────── */
echo json_encode([
    "status" => true,
    "cards" => [
        "total_credit_sales" => $credit,
        "total_outstanding"  => $outstanding,
        "overdue_amount"     => $overdue,
        "today_collection"   => $today
    ],
    "list" => $list
]);