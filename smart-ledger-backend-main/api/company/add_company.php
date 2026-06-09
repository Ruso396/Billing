<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

// 🔥 GET DATA
$company_name    = trim($data['company_name'] ?? '');
$company_address = trim($data['company_address'] ?? '');
$company_code    = trim($data['company_code'] ?? '');
$gstin           = strtoupper(trim($data['gstin'] ?? ''));
$gst_type        = $data['gst_type'] ?? 'with_gst';
$phone           = trim($data['phone'] ?? '');
$logo            = $data['logo'] ?? '';

$owner_name     = trim($data['owner_name'] ?? '');
$owner_email    = trim($data['owner_email'] ?? '');
$owner_password = $data['owner_password'] ?? '';

// 🔥 VALIDATION
$emailRegex = "/^[^\s@]+@[^\s@]+\.[^\s@]+$/";
$gstRegex   = "/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/";
$phoneRegex = "/^[0-9]{10}$/";

if (!$company_name || !$company_code || !$company_address) {
    echo json_encode(["status"=>false,"message"=>"All company fields required"]);
    exit();
}

if ($gst_type == 'with_gst') {
    if (!$gstin || !preg_match($gstRegex, $gstin)) {
        echo json_encode(["status"=>false,"message"=>"Invalid GSTIN"]);
        exit();
    }
}

if (!preg_match($phoneRegex, $phone)) {
    echo json_encode(["status"=>false,"message"=>"Phone must be 10 digits"]);
    exit();
}

if (!$owner_name) {
    echo json_encode(["status"=>false,"message"=>"Owner name required"]);
    exit();
}

if (!preg_match($emailRegex, $owner_email)) {
    echo json_encode(["status"=>false,"message"=>"Invalid email"]);
    exit();
}

if (strlen($owner_password) < 6) {
    echo json_encode(["status"=>false,"message"=>"Password min 6 chars"]);
    exit();
}

// 🔥 CHECK DUPLICATE EMAIL (users table)
$check = mysqli_query($conn, "SELECT id FROM users WHERE email='$owner_email'");
if (mysqli_num_rows($check) > 0) {
    echo json_encode(["status"=>false,"message"=>"Email already exists"]);
    exit();
}

// 🔥 HASH PASSWORD
$hashed_password = password_hash($owner_password, PASSWORD_DEFAULT);

// 🔥 INSERT INTO COMPANIES (MATCH DB 🔥)
$insertCompany = mysqli_query($conn, "
    INSERT INTO companies 
    (company_name, company_code, company_address, gstin, gst_type, phone, logo, owner_name, owner_email, owner_password)
    VALUES 
    ('$company_name','$company_code','$company_address','$gstin','$gst_type','$phone','$logo','$owner_name','$owner_email','$hashed_password')
");

if (!$insertCompany) {
    echo json_encode([
        "status" => false,
        "message" => "Company insert failed",
        "error" => mysqli_error($conn) // 🔥 debug
    ]);
    exit();
}

$company_id = mysqli_insert_id($conn);

// 🔥 INSERT INTO USERS TABLE ALSO
$insertUser = mysqli_query($conn, "
    INSERT INTO users (name, email, password, role, company_id)
    VALUES ('$owner_name','$owner_email','$hashed_password','admin','$company_id')
");

if (!$insertUser) {
    echo json_encode([
        "status" => false,
        "message" => "User insert failed",
        "error" => mysqli_error($conn)
    ]);
    exit();
}

// ✅ SUCCESS
echo json_encode([
    "status" => true,
    "message" => "Company & Admin created successfully"
]);
exit();