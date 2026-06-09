<?php
// ══════════════════════════════════════════════════════════════════
// PAYMENT TABLE INSERT — add this inside create_invoice.php
// after you've inserted the invoice and have $invoice_id available
// ══════════════════════════════════════════════════════════════════
 
/*
  FRONTEND sends these fields (buildPaymentPayload):
    payment_method  → "cash" | "online" | "upi" | "credit"
    payment_status  → "paid" | "partial" | "pending"
    paid_amount     → actual money received (0 for credit)
    balance_amount  → total - paid   (= total for credit)
    total_amount    → grand total of invoice (subtotal + gst)
*/
 
// -- 1. Read from POST payload (already decoded from JSON body) --
$total_amount   = floatval($data['total_amount']   ?? 0);
$paid_amount    = floatval($data['paid_amount']    ?? 0);
$balance_amount = floatval($data['balance_amount'] ?? 0);
$payment_method = $conn->real_escape_string($data['payment_method'] ?? 'cash');
$payment_status = $conn->real_escape_string($data['payment_status'] ?? 'paid');
 
// -- 2. Sanity-check status (server-side guard) --
if ($payment_method === 'credit') {
    $payment_status = 'pending';
    $paid_amount    = 0;
    $balance_amount = $total_amount;
} else {
    // Re-derive status server-side so frontend can't fake it
    if ($paid_amount >= $total_amount) {
        $payment_status = 'paid';
        $balance_amount = 0;
    } else {
        $payment_status = 'partial';
        $balance_amount = $total_amount - $paid_amount;
    }
}
 
// -- 3. Insert into payments table --
$pay_sql = "
    INSERT INTO payments
        (company_id, invoice_id, invoice_no, customer_id,
         total_amount, paid_amount, balance_amount,
         payment_method, payment_status)
    VALUES
        ('$company_id', '$invoice_id', '$invoice_no', '$customer_id',
         '$total_amount', '$paid_amount', '$balance_amount',
         '$payment_method', '$payment_status')
";
 
if (!$conn->query($pay_sql)) {
    // Optionally roll back invoice insert or just log
    // $conn->query("DELETE FROM invoices WHERE id='$invoice_id'");
    echo json_encode([
        "status"  => false,
        "message" => "Invoice saved but payment record failed: " . $conn->error
    ]);
    exit;
}
 
$payment_id = $conn->insert_id;
 
// -- 4. Return success --
echo json_encode([
    "status"     => true,
    "invoice_no" => $invoice_no,
    "invoice_id" => $invoice_id,
    "payment_id" => $payment_id,
    "payment_status" => $payment_status,
]);
?>