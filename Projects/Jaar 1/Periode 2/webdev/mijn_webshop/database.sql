CREATE DATABASE IF NOT EXISTS mijn_webshop CHARACTER SET utf8mb4;
USE mijn_webshop;

CREATE TABLE IF NOT EXISTS producten (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naam VARCHAR(100) NOT NULL,
  prijs DECIMAL(6,2) NOT NULL,
  omschrijving TEXT,
  afbeelding VARCHAR(100)
);

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Aqua', 18.50, 'Een vrolijke Aqua plush voor je verzameling.', 'aqua.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Aqua');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Jevil', 16.00, 'Een chaotische Jevil plush voor fans van de Dark World.', 'jevil.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Jevil');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Ralsei', 18.50, 'Een zachte Ralsei plush voor op je bed of bureau.', 'ralsei.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Ralsei');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Seth', 15.00, 'Een Seth plush voor je verzameling.', 'seth.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Seth');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Spamton', 17.50, 'Een Spamton plush met een flinke dosis karakter.', 'spamton.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Spamton');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Susie', 19.00, 'Een stoere Susie plush voor je verzameling.', 'susie.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Susie');

INSERT INTO producten (naam, prijs, omschrijving, afbeelding)
SELECT 'Tenna', 16.50, 'Een Tenna plush voor fans van the Dark World.', 'tenna.png'
WHERE NOT EXISTS (SELECT 1 FROM producten WHERE naam = 'Tenna');

UPDATE producten SET afbeelding = 'aqua.png' WHERE naam = 'Aqua';
UPDATE producten SET afbeelding = 'jevil.png' WHERE naam = 'Jevil';
UPDATE producten SET afbeelding = 'ralsei.png' WHERE naam = 'Ralsei';
UPDATE producten SET afbeelding = 'seth.png' WHERE naam = 'Seth';
UPDATE producten SET afbeelding = 'spamton.png' WHERE naam = 'Spamton';
UPDATE producten SET afbeelding = 'susie.png' WHERE naam = 'Susie';
UPDATE producten SET afbeelding = 'tenna.png' WHERE naam = 'Tenna';
