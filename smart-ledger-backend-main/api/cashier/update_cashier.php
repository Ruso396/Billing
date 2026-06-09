<?php
// 🔥 CORS HEADERS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// 🔥 PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];
$name = $data['name'];
$email = $data['email'];
$password = $data['password'];

$password_query = "";

if (!empty($password)) {
  $hashed = password_hash($password, PASSWORD_DEFAULT);
  $password_query = ", password='$hashed'";
}

$sql = "UPDATE users SET 
        name='$name',
        email='$email'
        $password_query
        WHERE id='$id'";

$conn->query($sql);

echo json_encode(["status"=>true]);