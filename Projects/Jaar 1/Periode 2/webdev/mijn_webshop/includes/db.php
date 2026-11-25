<?php
$pdo = new PDO("mysql:host=mysql_db;dbname=mijn_webshop;charset=utf8mb4", "root", "root");
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
