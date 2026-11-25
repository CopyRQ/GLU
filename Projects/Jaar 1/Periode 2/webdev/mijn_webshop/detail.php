<?php
include "includes/db.php";
$id = isset($_GET["id"]) && is_string($_GET["id"])
    ? filter_var($_GET["id"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]])
    : false;
$product = false;

if ($id !== false) {
    $statement = $pdo->prepare("SELECT id, naam, prijs, omschrijving, afbeelding FROM producten WHERE id = :id");
    $statement->execute(["id" => $id]);
    $product = $statement->fetch();
}

if (!$product) {
    http_response_code(404);
}

$previewProduct = $product;
$largePreview = (bool) $product;
$dialogueLines = $product
    ? ["A curious little find.", "Have a closer look before you decide."]
    : ["That item is not on the shelf."];
include "includes/header.php";
?>
            <?php if (!$product): ?>
                <h2>Product niet gevonden</h2>
                <p>Dit product bestaat niet (meer).</p>
                <p><a class="pixel-link" href="index.php#producten">terug naar de plushies</a></p>
            <?php else: ?>
                <h2 id="product"><img src="./assets/images/deltarune/spr_sparestar_0.png" alt=""> <?php echo htmlspecialchars($product["naam"], ENT_QUOTES, "UTF-8"); ?> plush</h2>
                <div class="detail-product">
                    <h3><?php echo htmlspecialchars($product["naam"], ENT_QUOTES, "UTF-8"); ?></h3>
                    <p class="prijs">&euro; <?php echo number_format((float) $product["prijs"], 2, ",", "."); ?></p>
                    <p><?php echo nl2br(htmlspecialchars($product["omschrijving"], ENT_QUOTES, "UTF-8")); ?></p>
                    <ul class="game-menu detail-actions" data-game-menu>
                        <li><a class="buy-link selected" href="bestellen.php?id=<?php echo (int) $product["id"]; ?>">buy</a></li>
                        <li><a href="index.php?screen=buy" data-game-back>back to the shelf</a></li>
                    </ul>
                </div>
            <?php endif; ?>
<?php include "includes/footer.php"; ?>
