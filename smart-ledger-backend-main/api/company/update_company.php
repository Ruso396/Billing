<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// 🔥 PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

// 🔥 GET DATA
$id              = $data['id'] ?? '';
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

// ============================
// 🔥 VALIDATION
// ============================

$emailRegex = "/^[^\s@]+@[^\s@]+\.[^\s@]+$/";
$gstRegex   = "/^[0-9A-Z]{15}$/";
$phoneRegex = "/^[0-9]{10}$/";

if (!$id) {
    echo json_encode(["status"=>false,"message"=>"Company ID missing"]);
    exit();
}

if (!$company_name || !$company_code || !$company_address) {
    echo json_encode(["status"=>false,"message"=>"All company fields required"]);
    exit();
}

// GST validation
if ($gst_type == 'with_gst') {
    if (!$gstin || !preg_match($gstRegex, $gstin)) {
        echo json_encode(["status"=>false,"message"=>"Invalid GSTIN"]);
        exit();
    }
}

// Phone validation
if (!preg_match($phoneRegex, $phone)) {
    echo json_encode(["status"=>false,"message"=>"Phone must be 10 digits"]);
    exit();
}

// Owner validation
if (!$owner_name) {
    echo json_encode(["status"=>false,"message"=>"Owner name required"]);
    exit();
}

if (!preg_match($emailRegex, $owner_email)) {
    echo json_encode(["status"=>false,"message"=>"Invalid email"]);
    exit();
}

// 🔥 EMAIL DUPLICATE CHECK (exclude current company)
$check = mysqli_query($conn, "SELECT id FROM users WHERE email='$owner_email' AND company_id != '$id'");
if (mysqli_num_rows($check) > 0) {
    echo json_encode(["status"=>false,"message"=>"Email already exists"]);
    exit();
}

// 🔥 PASSWORD OPTIONAL
if (!empty($owner_password) && strlen($owner_password) < 6) {
    echo json_encode(["status"=>false,"message"=>"Password must be at least 6 characters"]);
    exit();
}

// ============================
// 🔥 IMAGE UPLOAD
// ============================

$logo_query = "";

if (!empty($logo)) {
    $image = base64_decode($logo);

    if ($image === false) {
        echo json_encode(["status"=>false,"message"=>"Invalid image"]);
        exit();
    }

    $upload_dir = __DIR__ . "/../uploads/";
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_name = time() . ".png";
    $full_path = $upload_dir . $file_name;

    if (file_put_contents($full_path, $image) === false) {
        echo json_encode(["status"=>false,"message"=>"Image upload failed"]);
        exit();
    }

    $db_path = "uploads/" . $file_name;
    $logo_query = ", logo='$db_path'";
}

// ============================
// 🔥 TRANSACTION
// ============================

mysqli_begin_transaction($conn);

try {

    // ✅ UPDATE COMPANY
    $sql = "UPDATE companies SET 
        company_name='$company_name',
        company_address='$company_address',
        company_code='$company_code',
        gstin='$gstin',
        gst_type='$gst_type',
        phone='$phone',
        owner_name='$owner_name',
        owner_email='$owner_email'
        $logo_query
        WHERE id='$id'";

    if (!mysqli_query($conn, $sql)) {
        throw new Exception("Company update failed");
    }

    // ✅ UPDATE ADMIN USER
    $admin_sql = "UPDATE users SET 
        name='$owner_name',
        email='$owner_email'
        WHERE company_id='$id' AND role='admin'";

    if (!mysqli_query($conn, $admin_sql)) {
        throw new Exception("Admin update failed");
    }

    // ✅ UPDATE PASSWORD (OPTIONAL)
    if (!empty($owner_password)) {
        $hashed = password_hash($owner_password, PASSWORD_DEFAULT);

        $pass_sql = "UPDATE users SET password='$hashed' 
        WHERE company_id='$id' AND role='admin'";

        if (!mysqli_query($conn, $pass_sql)) {
            throw new Exception("Password update failed");
        }
    }

    mysqli_commit($conn);

    echo json_encode([
        "status" => true,
        "message" => "Company updated successfully"
    ]);

} catch (Exception $e) {

    mysqli_rollback($conn);

    echo json_encode([
        "status" => false,
        "message" => $e->getMessage()
    ]);
}
?>