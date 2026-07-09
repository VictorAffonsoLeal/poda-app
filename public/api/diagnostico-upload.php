<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnóstico do Servidor de Upload</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #334155; padding: 40px; }
        .card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px border #e2e8f0; max-width: 700px; margin: 0 auto; overflow: hidden; }
        .header { background: #059669; color: white; padding: 20px 24px; font-weight: bold; font-size: 18px; }
        .content { padding: 24px; }
        .item { border-bottom: 1px solid #f1f5f9; padding: 12px 0; display: flex; justify-content: space-between; align-items: center; }
        .item:last-child { border-bottom: none; }
        .label { font-weight: 600; font-size: 14px; }
        .value { font-size: 14px; font-family: monospace; }
        .status { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-ok { background: #d1fae5; color: #065f46; }
        .status-error { background: #fee2e2; color: #991b1b; }
        .title { font-size: 15px; font-weight: bold; margin-top: 20px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    </style>
</head>
<body>

<div class="card">
    <div class="header">📋 Diagnóstico de Upload & Permissões</div>
    <div class="content">
        
        <div class="title">Configurações Ativas do PHP</div>
        
        <div class="item">
            <span class="label">upload_max_filesize</span>
            <span class="value"><?php echo ini_get('upload_max_filesize'); ?></span>
        </div>
        <div class="item">
            <span class="label">post_max_size</span>
            <span class="value"><?php echo ini_get('post_max_size'); ?></span>
        </div>
        <div class="item">
            <span class="label">memory_limit</span>
            <span class="value"><?php echo ini_get('memory_limit'); ?></span>
        </div>
        
        <div class="title">Verificação de Pastas e Gravação</div>
        
        <?php
        $targetDir = "../uploads/";
        $dirExists = file_exists($targetDir);
        ?>
        <div class="item">
            <span class="label">Pasta '../uploads/' existe?</span>
            <?php if ($dirExists): ?>
                <span class="status status-ok">Sim</span>
            <?php else: ?>
                <span class="status status-error">Não (Será necessário criar)</span>
            <?php endif; ?>
        </div>

        <?php
        // Tenta criar a pasta se não existir
        if (!$dirExists) {
            $created = @mkdir($targetDir, 0777, true);
            $dirExists = file_exists($targetDir);
        } else {
            $created = true;
        }
        ?>

        <?php if ($dirExists): ?>
            <?php
            $isWritable = is_writable($targetDir);
            ?>
            <div class="item">
                <span class="label">Pasta '../uploads/' tem permissão de escrita (Writable)?</span>
                <?php if ($isWritable): ?>
                    <span class="status status-ok">Sim (OK)</span>
                <?php else: ?>
                    <span class="status status-error">Não (Erro de Permissão)</span>
                <?php endif; ?>
            </div>

            <?php
            // Tenta criar um arquivo teste dentro
            $testFile = $targetDir . "test_write.txt";
            $writeTest = @file_put_contents($testFile, "Teste de escrita realizado com sucesso: " . date("d/m/Y H:i:s"));
            ?>
            <div class="item">
                <span class="label">Teste de gravação de arquivo no diretório:</span>
                <?php if ($writeTest !== false): ?>
                    <span class="status status-ok">Sucesso</span>
                    <?php @unlink($testFile); // limpa o teste ?>
                <?php else: ?>
                    <span class="status status-error">Falha ao gravar arquivo teste</span>
                <?php endif; ?>
            </div>
        <?php else: ?>
            <div class="item">
                <span class="label">Tenta criar a pasta '../uploads/':</span>
                <span class="status status-error">Falhou (Sem permissão de escrita no diretório pai)</span>
            </div>
        <?php endif; ?>

    </div>
</div>

</body>
</html>
