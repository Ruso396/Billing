<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "../../config/db.php";

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$email    = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(["status"=>false,"message"=>"Email & Password required"]);
    exit;
}

//
// 🔥 1. USERS TABLE (superadmin / cashier)
//
$user_q = mysqli_query($conn, "SELECT * FROM users WHERE email='$email'");
$user = mysqli_fetch_assoc($user_q);

if ($user && password_verify($password, $user['password'])) {

    echo json_encode([
        "status"=>true,
        "role"=>$user['role'],
        "data"=>[
            "id"=>$user['id'],
            "name"=>$user['name'],
            "email"=>$user['email'],
            "company_id"=>$user['company_id'] // cashier ku irukum
        ]
    ]);
    exit;
}

//
// 🔥 2. COMPANIES TABLE (ADMIN)
//
$comp_q = mysqli_query($conn, "SELECT * FROM companies WHERE owner_email='$email'");
$company = mysqli_fetch_assoc($comp_q);

if ($company && password_verify($password, $company['owner_password'])) {

    echo json_encode([
        "status"=>true,
        "role"=>"admin",
        "data"=>[
            "id"=>$company['id'],
            "name"=>$company['company_name'],
            "email"=>$company['owner_email'],
            "company_id"=>$company['id'] // 🔥 MUST
        ]
    ]);
    exit;
}

//
// ❌ INVALID
//
echo json_encode([
    "status"=>false,
    "message"=>"Invalid credentials"
]);
?>