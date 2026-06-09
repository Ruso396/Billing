<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

include __DIR__ . '/../../config/db.php';

$invoice_no = $_GET['id'];

// 🔥 JOIN COMPANY TABLE
$result = $conn->query("
SELECT i.*, 
       c.company_name,
       c.company_address,
       c.phone,
       c.gstin,
       c.logo,
        c.gst_type 
FROM invoices i
LEFT JOIN companies c ON i.company_id = c.id
WHERE i.invoice_no='$invoice_no'
");

if($result->num_rows > 0){
    $row = $result->fetch_assoc();

    $row['products'] = json_decode($row['products']);
    

    echo json_encode([
        "status"=>true,
        "data"=>$row
    ]);
}else{
    echo json_encode([
        "status"=>false,
        "message"=>"Invoice not found"
    ]);
}
?>