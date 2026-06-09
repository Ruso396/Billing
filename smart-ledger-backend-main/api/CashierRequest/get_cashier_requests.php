<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "../../config/db.php";

$sql = "

SELECT

    cr.*,

    c.company_name as company_name,

    u.name as requested_user

FROM cashier_requests cr

LEFT JOIN companies c
ON c.id = cr.company_id

LEFT JOIN users u
ON u.id = cr.requested_by

WHERE cr.status='pending'

ORDER BY cr.id DESC

";

$res = mysqli_query($conn, $sql);


// ✅ SQL ERROR CHECK

if (!$res) {

    echo json_encode([
        "status"=>false,
        "message"=>mysqli_error($conn)
    ]);

    exit;
}

$data = [];

while($row = mysqli_fetch_assoc($res)) {

    $data[] = $row;
}

echo json_encode([
    "status"=>true,
    "data"=>$data
]);
?>