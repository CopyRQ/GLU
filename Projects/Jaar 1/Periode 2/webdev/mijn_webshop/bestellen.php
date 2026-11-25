<?php
include "includes/db.php";
$gekozenId = isset($_GET["id"]) && is_string($_GET["id"])
    ? filter_var($_GET["id"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]])
    : false;
$gekozenProduct = false;
if ($gekozenId !== false) {
    $statement = $pdo->prepare("SELECT id, naam, prijs, afbeelding FROM producten WHERE id = :id");
    $statement->execute(["id" => $gekozenId]);
    $gekozenProduct = $statement->fetch();
}
$bevestigen = isset($_GET["confirm"]) && $_GET["confirm"] === "yes";
if (!$gekozenProduct) {
    http_response_code(404);
}
$previewProduct = $gekozenProduct;
$orderScreen = $bevestigen && (bool) $gekozenProduct;
$largePreview = (bool) $gekozenProduct;
$dialogueLines = $gekozenProduct
    ? ($bevestigen
        ? ["All right, then. Fill out the little form when you're ready."]
        : ["Caught your eye, has it?", "Have a think before you commit."])
    : ["That item is not on the shelf."];
include "includes/header.php";
?>
            <?php if (!$gekozenProduct): ?>
                <section class="game-message">
                    <h2>Item not found</h2>
                    <p>That item is not on the shelf.</p>
                    <p><a class="pixel-link" href="index.php?screen=buy" data-game-back>back to the shelf</a></p>
                </section>
            <?php elseif (!$bevestigen): ?>
                <section class="game-message purchase-confirmation">
                    <h2>Buy <?php echo htmlspecialchars($gekozenProduct["naam"], ENT_QUOTES, "UTF-8"); ?>?</h2>
                    <p>Price: &euro; <?php echo number_format((float) $gekozenProduct["prijs"], 2, ",", "."); ?></p>
                    <ul class="game-menu" data-game-menu>
                        <li><a class="buy-link selected" href="bestellen.php?id=<?php echo (int) $gekozenProduct["id"]; ?>&amp;confirm=yes">yes</a></li>
                        <li><a href="detail.php?id=<?php echo (int) $gekozenProduct["id"]; ?>" data-game-back>no</a></li>
                    </ul>
                </section>
            <?php else: ?>
                <h2>Place your order</h2>
                <p class="order-product"><?php echo htmlspecialchars($gekozenProduct["naam"], ENT_QUOTES, "UTF-8"); ?> &mdash; &euro; <?php echo number_format((float) $gekozenProduct["prijs"], 2, ",", "."); ?></p>
                <form class="formulier" action="bestellen.php?id=<?php echo (int) $gekozenProduct["id"]; ?>&amp;confirm=yes" method="post">
                <input type="hidden" name="product_id" value="<?php echo (int) $gekozenProduct["id"]; ?>">
                <div class="veld">
                    <label for="voornaam">Voornaam</label>
                    <input type="text" id="voornaam" name="voornaam" placeholder="Bijvoorbeeld: Sanne" required>
                </div>

                <div class="veld">
                    <label for="achternaam">Achternaam</label>
                    <input type="text" id="achternaam" name="achternaam" required>
                </div>

                <div class="veld">
                    <label for="email">E-mailadres</label>
                    <input type="email" id="email" name="email" required>
                </div>

                <div class="veld">
                    <label for="aantal">Aantal</label>
                    <input type="number" id="aantal" name="aantal" min="1" value="1" required>
                </div>

                <input type="submit" value="Bestelling plaatsen" class="knop">
            </form>
                <p class="order-back"><a class="pixel-link" href="detail.php?id=<?php echo (int) $gekozenProduct["id"]; ?>" data-game-back>back</a></p>
            <?php endif; ?>
<?php include "includes/footer.php"; ?>
