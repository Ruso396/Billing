<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$invoice_no = $data['invoice_no'] ?? '';

$pay_amount = floatval($data['pay_amount'] ?? 0);

if (!$invoice_no || $pay_amount <= 0) {

    echo json_encode([
        "status" => false,
        "message" => "Invalid data"
    ]);

    exit;
}

// ✅ CHECK INVOICE

$check = $conn->query("
SELECT * FROM invoices
WHERE invoice_no='$invoice_no'
LIMIT 1
");

if ($check->num_rows == 0) {

    echo json_encode([
        "status" => false,
        "message" => "Invoice not found"
    ]);

    exit;
}

$row = $check->fetch_assoc();

$current_paid = floatval($row['paid_amount']);

$current_balance = floatval($row['balance_amount']);

$total_amount = floatval($row['total_amount']);

$new_paid = $current_paid + $pay_amount;

$return_amount = 0;

// ✅ EXTRA PAYMENT RETURN

if ($new_paid > $total_amount) {

    $return_amount = $new_paid - $total_amount;

    $new_paid = $total_amount;
}

$new_balance = $total_amount - $new_paid;

// ✅ STATUS

if ($new_balance <= 0) {

    $payment_status = "paid";

} else {

    $payment_status = "partial";
}

// ✅ UPDATE INVOICE

$conn->query("

UPDATE invoices

SET

    paid_amount='$new_paid',

    balance_amount='$new_balance',

    payment_status='$payment_status'

WHERE invoice_no='$invoice_no'

");

// ✅ UPDATE PAYMENTS TABLE

$conn->query("

UPDATE payments

SET

    paid_amount='$new_paid',

    balance_amount='$new_balance',

    payment_status='$payment_status'

WHERE invoice_no='$invoice_no'

");

// ✅ RESPONSE

$message = "Payment Updated Successfully";

if ($return_amount > 0) {

    $message .= " | Return Amount: ₹" . number_format($return_amount);
}

echo json_encode([

    "status" => true,

    "message" => $message,

    "return_amount" => $return_amount,

    "paid_amount" => $new_paid,

    "balance_amount" => $new_balance

]);
?>

