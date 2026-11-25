<?php
include "includes/db.php";
$producten = $pdo->query("SELECT id, naam, prijs, omschrijving, afbeelding FROM producten ORDER BY id")->fetchAll();
$screens = ["menu", "buy", "talk"];
$screen = isset($_GET["screen"]) && is_string($_GET["screen"]) && in_array($_GET["screen"], $screens, true)
    ? $_GET["screen"]
    : "menu";
$topics = [
    "shop" => "This was once part of the old Card Kingdom. A strange Knight upset its balance, and the Spade King took control.",
    "wares" => "These keepsakes have drifted in from all over the kingdom. Some may still prove useful.",
    "keeper" => "I used to serve as the court magician. Jevil was the jester, and my old companion in games.",
];
$topic = isset($_GET["topic"]) && is_string($_GET["topic"]) && isset($topics[$_GET["topic"]])
    ? $_GET["topic"]
    : null;
$dialogueLines = match ($screen) {
    "buy" => ["A collection of old finds, gathered over the years.", "See if anything catches your eye."],
    "talk" => $topic ? [$topics[$topic]] : ["What would you like to talk about?"],
    default => ["Well now, a visitor.", "Browse if you like. Nothing here is in a hurry."],
};
$previewProduct = $screen === "buy" && count($producten) > 0 ? $producten[0] : null;
$previewInMenu = $screen === "buy";
include "includes/header.php";
?>
            <?php if ($screen === "menu"): ?>
                <h2>What would you like to do?</h2>
                <ul class="game-menu" data-game-menu>
                    <li><a class="selected" href="index.php?screen=buy">buy</a></li>
                    <li><a href="index.php?screen=talk">talk</a></li>
                    <li><a href="index.php" data-game-exit>exit</a></li>
                </ul>
            <?php elseif ($screen === "buy"): ?>
                <h2>Buy</h2>
                <?php if (count($producten) === 0): ?>
                    <p>There is nothing on the shelf right now.</p>
                <?php else: ?>
                    <ul class="game-menu product-menu" data-game-menu>
                        <?php foreach ($producten as $index => $product): ?>
                            <?php
                            $previewSource = "assets/images/deltarune/products/" . rawurlencode($product["afbeelding"]);
                            ?>
                            <li>
                                <a class="product-option<?php echo $index === 0 ? " selected" : ""; ?>"
                                   href="detail.php?id=<?php echo (int) $product["id"]; ?>"
                                   data-preview="<?php echo htmlspecialchars($previewSource, ENT_QUOTES, "UTF-8"); ?>"
                                   data-preview-name="<?php echo htmlspecialchars($product["naam"], ENT_QUOTES, "UTF-8"); ?>">
                                    <?php echo htmlspecialchars($product["naam"], ENT_QUOTES, "UTF-8"); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                        <li><a href="index.php" data-game-back>back</a></li>
                    </ul>
                    <?php
                    $previewSource = "assets/images/deltarune/products/" . rawurlencode($previewProduct["afbeelding"]);
                    ?>
                    <div class="shop-preview product-menu-preview">
                        <img id="shop-preview-image" src="<?php echo htmlspecialchars($previewSource, ENT_QUOTES, "UTF-8"); ?>" alt="<?php echo htmlspecialchars($previewProduct["naam"], ENT_QUOTES, "UTF-8"); ?>">
                        <p id="shop-preview-name"><?php echo htmlspecialchars($previewProduct["naam"], ENT_QUOTES, "UTF-8"); ?></p>
                    </div>
                <?php endif; ?>
            <?php elseif (!$topic): ?>
                <h2>Talk</h2>
                <ul class="game-menu" data-game-menu>
                    <li><a class="selected" href="index.php?screen=talk&amp;topic=shop">the shop</a></li>
                    <li><a href="index.php?screen=talk&amp;topic=wares">the plushies</a></li>
                    <li><a href="index.php?screen=talk&amp;topic=keeper">the shopkeeper</a></li>
                    <li><a href="index.php" data-game-back>back</a></li>
                </ul>
            <?php else: ?>
                <h2>Talk</h2>
                <ul class="game-menu" data-game-menu>
                    <li><a class="<?php echo $topic === "shop" ? "selected" : ""; ?>" href="index.php?screen=talk&amp;topic=shop">the shop</a></li>
                    <li><a class="<?php echo $topic === "wares" ? "selected" : ""; ?>" href="index.php?screen=talk&amp;topic=wares">the plushies</a></li>
                    <li><a class="<?php echo $topic === "keeper" ? "selected" : ""; ?>" href="index.php?screen=talk&amp;topic=keeper">the shopkeeper</a></li>
                    <li><a href="index.php" data-game-back>back</a></li>
                </ul>
            <?php endif; ?>
<?php include "includes/footer.php"; ?>
