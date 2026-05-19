<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Pega o ID do usuário enviado pelo App
$userId = isset($_POST['userId']) ? preg_replace("/[^a-zA-Z0-9]/", "", $_POST['userId']) : "anonimo";

// Pasta organizada por usuário
$targetDir = "../uploads/" . $userId . "/";

// Cria a pasta se não existir
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$response = ["urls" => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['files'])) {
        foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
            $fileName = time() . "_" . basename($_FILES['files']['name'][$key]);
            $fileName = preg_replace("/[^a-zA-Z0-9._-]/", "", $fileName);
            $targetFilePath = $targetDir . $fileName;

            $check = getimagesize($tmpName);
            if ($check !== false) {
                if (move_uploaded_file($tmpName, $targetFilePath)) {
                    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? "https" : "http";
                    $host = $_SERVER['HTTP_HOST'];
                    // Retorna a URL organizada
                    $response["urls"][] = $protocol . "://" . $host . "/uploads/" . $userId . "/" . $fileName;
                }
            }
        }
    }
}

echo json_encode($response);
?>
