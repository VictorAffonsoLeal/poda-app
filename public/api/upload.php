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

$response = ["urls" => [], "errors" => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['files'])) {
        foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
            $errorCode = $_FILES['files']['error'][$key];
            $originalName = basename($_FILES['files']['name'][$key]);
            
            if ($errorCode !== UPLOAD_ERR_OK) {
                switch ($errorCode) {
                    case UPLOAD_ERR_INI_SIZE:
                        $response["errors"][] = "O arquivo '" . $originalName . "' excede o limite de tamanho permitido pelo servidor PHP (upload_max_filesize no php.ini).";
                        break;
                    case UPLOAD_ERR_FORM_SIZE:
                        $response["errors"][] = "O arquivo '" . $originalName . "' excede o limite definido no formulário HTML.";
                        break;
                    case UPLOAD_ERR_PARTIAL:
                        $response["errors"][] = "O arquivo '" . $originalName . "' foi enviado apenas parcialmente.";
                        break;
                    case UPLOAD_ERR_NO_FILE:
                        $response["errors"][] = "Nenhum arquivo '" . $originalName . "' foi enviado.";
                        break;
                    case UPLOAD_ERR_NO_TMP_DIR:
                        $response["errors"][] = "Servidor PHP com erro: pasta temporária ausente.";
                        break;
                    case UPLOAD_ERR_CANT_WRITE:
                        $response["errors"][] = "Falha de gravação: sem permissão para salvar o arquivo no disco do servidor.";
                        break;
                    default:
                        $response["errors"][] = "Erro desconhecido no upload (código " . $errorCode . ") do arquivo: " . $originalName;
                }
                continue;
            }

            $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            $allowedExtensions = ["jpg", "jpeg", "png", "gif", "pdf"];

            if (in_array($fileExtension, $allowedExtensions)) {
                $fileName = time() . "_" . $originalName;
                $fileName = preg_replace("/[^a-zA-Z0-9._-]/", "", $fileName);
                $targetFilePath = $targetDir . $fileName;

                $isValid = false;
                if ($fileExtension === "pdf") {
                    $isValid = true;
                } else {
                    $check = getimagesize($tmpName);
                    if ($check !== false) {
                        $isValid = true;
                    } else {
                        $response["errors"][] = "getimagesize failed for " . $originalName;
                    }
                }

                if ($isValid) {
                    if (move_uploaded_file($tmpName, $targetFilePath)) {
                        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? "https" : "http";
                        $host = $_SERVER['HTTP_HOST'];
                        // Retorna a URL organizada
                        $response["urls"][] = $protocol . "://" . $host . "/uploads/" . $userId . "/" . $fileName;
                    } else {
                        $response["errors"][] = "move_uploaded_file failed to move to " . $targetFilePath . " for " . $originalName;
                    }
                }
            } else {
                $response["errors"][] = "Extension not allowed: " . $fileExtension . " for " . $originalName;
            }
        }
    } else {
        $response["errors"][] = "No 'files' key in $_FILES";
    }
} else {
    $response["errors"][] = "Not a POST request";
}

echo json_encode($response);
?>
