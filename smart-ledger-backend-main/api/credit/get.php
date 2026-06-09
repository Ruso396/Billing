<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "../../config/db.php";

$company_id = intval($_GET['company_id'] ?? 0);

if (!$company_id) {
    echo json_encode(["status"=>false,"message"=>"Company ID required"]);
    exit;
}

$res = $conn->query("
    SELECT default_credit_days 
    FROM credit_settings 
    WHERE company_id='$company_id'
    LIMIT 1
");

if ($res && $res->num_rows > 0) {
    $row = $res->fetch_assoc();
    echo json_encode([
        "status"=>true,
        "data"=>$row
    ]);
} else {
    echo json_encode([
        "status"=>true,
        "data"=>["default_credit_days"=>30]
    ]);
}