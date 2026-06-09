<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data['id'] ?? 0);

if (!$id) {

    echo json_encode([
        "status"=>false,
        "message"=>"Invalid request"
    ]);

    exit;
}

$res = mysqli_query($conn, "

SELECT *
FROM cashier_requests
WHERE id='$id'

");

$request = mysqli_fetch_assoc($res);

if (!$request) {

    echo json_encode([
        "status"=>false,
        "message"=>"Request not found"
    ]);

    exit;
}


// ✅ INSERT USER

mysqli_query($conn, "

INSERT INTO users
(
    name,
    email,
    password,
    role,
    company_id
)

VALUES
(
    '".$request['name']."',
    '".$request['email']."',
    '".$request['password']."',
    'cashier',
    '".$request['company_id']."'
)

");


// ✅ UPDATE STATUS

mysqli_query($conn, "

UPDATE cashier_requests

SET status='approved'

WHERE id='$id'

");

echo json_encode([
    "status"=>true,
    "message"=>"Cashier approved successfully"
]);
?>