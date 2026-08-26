<?php
// Script to verify Gemini API keys
$results = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['api_keys'])) {
    $keysInput = $_POST['api_keys'];
    // Split by newlines and trim whitespace
    $keys = array_filter(array_map('trim', explode("\n", $keysInput)));

    foreach ($keys as $key) {
        if (empty($key))
            continue;

        // Simple prompt to test if the key works
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" . urlencode($key);

        $data = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => "hi"]
                    ]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $results[$key] = [
                'status' => 'valid',
                'message' => 'Key is valid and working.'
            ];
        } else {
            $responseData = json_decode($response, true);
            $errorMessage = $responseData['error']['message'] ?? 'Unknown error';
            $results[$key] = [
                'status' => 'invalid',
                'message' => "HTTP $httpCode: $errorMessage"
            ];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini API Key Checker</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            background: #f9fafb;
            color: #111827;
        }

        h1 {
            font-size: 1.5rem;
            margin-bottom: 20px;
        }

        textarea {
            w-full;
            padding: 12px;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-family: monospace;
            resize: vertical;
            margin-bottom: 16px;
        }

        button {
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }

        button:hover {
            background: #059669;
        }

        .result-item {
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            background: white;
            word-break: break-all;
        }

        .valid {
            border-left: 4px solid #10b981;
        }

        .invalid {
            border-left: 4px solid #ef4444;
        }

        .status-badge {
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-right: 8px;
        }

        .valid .status-badge {
            background: #d1fae5;
            color: #065f46;
        }

        .invalid .status-badge {
            background: #fee2e2;
            color: #991b1b;
        }

        .error-msg {
            font-size: 0.9rem;
            color: #6b7280;
            display: block;
            margin-top: 4px;
        }
    </style>
</head>

<body>

    <h1>Gemini API Key Checker</h1>
    <p style="color:#4b5563; margin-bottom: 20px;">Paste your Gemini API keys below, one per line. The script will test
        each key by sending a small prompt ("hi") to the gemini-1.5-flash model.</p>

    <form method="POST">
        <textarea name="api_keys" rows="10"
            placeholder="AIzaSy...&#10;AIzaSy..."><?php echo isset($_POST['api_keys']) ? htmlspecialchars($_POST['api_keys']) : ''; ?></textarea>
        <button type="submit">Check Keys</button>
    </form>

    <?php if (!empty($results)): ?>
        <h2 style="margin-top: 32px; font-size: 1.2rem;">Results</h2>
        <div>
            <?php foreach ($results as $key => $info): ?>
                <div class="result-item <?php echo $info['status']; ?>">
                    <span class="status-badge"><?php echo strtoupper($info['status']); ?></span>
                    <strong><?php echo htmlspecialchars(substr($key, 0, 15) . '...' . substr($key, -5)); ?></strong>
                    <span class="error-msg"><?php echo htmlspecialchars($info['message']); ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</body>

</html>