<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dark World Finds</title>
    <link rel="icon" href="./assets/images/deltarune/spr_heart_0.png" type="image/png">
    <link rel="stylesheet" href="./assets/css/style.css?v=19">
</head>
<body>
    <div id="container">
        <div class="shop-screen">
            <div class="shop-scene">
                <img class="shop-background" src="./assets/images/deltarune/spr_shopbg1_0.png" alt="">
                <img class="seam" src="./assets/images/deltarune/spr_seam_laugh_0.png" alt="Seam de winkelier">
                <h1>dark world finds</h1>
            </div>

            <div class="shop-panel<?php echo !empty($largePreview) ? " shop-panel-large-preview" : ""; ?><?php echo !empty($orderScreen) ? " shop-panel-order" : ""; ?>">
                <div class="dialogue">
                    <?php foreach ($dialogueLines as $line): ?>
                        <p>* <?php echo htmlspecialchars($line, ENT_QUOTES, "UTF-8"); ?></p>
                    <?php endforeach; ?>

                    <?php if (!empty($previewProduct) && empty($previewInMenu)): ?>
                        <?php
                        $previewSource = "assets/images/deltarune/products/" . rawurlencode($previewProduct["afbeelding"]);
                        ?>
                        <div class="shop-preview<?php echo !empty($largePreview) ? " shop-preview-large" : ""; ?>">
                            <img id="shop-preview-image" src="<?php echo htmlspecialchars($previewSource, ENT_QUOTES, "UTF-8"); ?>" alt="<?php echo htmlspecialchars($previewProduct["naam"], ENT_QUOTES, "UTF-8"); ?>">
                            <p id="shop-preview-name"><?php echo htmlspecialchars($previewProduct["naam"], ENT_QUOTES, "UTF-8"); ?></p>
                        </div>
                    <?php endif; ?>
                </div>
                <main id="content">
