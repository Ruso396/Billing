<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }

include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$company_id = intval($data['company_id'] ?? 0);
$days       = intval($data['default_credit_days'] ?? 30);

if (!$company_id || $days <= 0) {
    echo json_encode(["status"=>false,"message"=>"Invalid data"]);
    exit;
}

/* Check exists */
$check = $conn->query("
    SELECT id FROM credit_settings WHERE company_id='$company_id'
");

if ($check->num_rows > 0) {

    $conn->query("
        UPDATE credit_settings 
        SET default_credit_days='$days'
        WHERE company_id='$company_id'
    ");

} else {

    $conn->query("
        INSERT INTO credit_settings (company_id, default_credit_days)
        VALUES ('$company_id','$days')
    ");
}

echo json_encode(["status"=>true]);