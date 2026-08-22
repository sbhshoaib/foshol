<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$key = env('GEMINI_API_KEY');
echo "Key length: " . strlen($key) . "\n";
echo "Key: " . substr($key, 0, 5) . "...\n";
