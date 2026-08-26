<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DiseaseDetectionController extends Controller
{
    public function detect(Request $request)
    {
        $request->validate([
            'image' => 'required|string',
            'cropType' => 'nullable|string',
        ]);

        $apiKey = env('KINDWISE_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'healthStatus' => 'Good health',
                'isHealthy' => true,
                'details' => 'Mocked response. Please configure KINDWISE_API_KEY in Laravel .env.'
            ]);
        }

        $base64Image = $request->input('image');
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
        }

        $response = Http::withHeaders([
            'Api-Key' => $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post('https://crop.kindwise.com/api/v1/identification', [
            'images' => [$base64Image],
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Failed to assess crop health',
                'message' => $response->body()
            ], 500);
        }

        $data = $response->json();
        
        $suggestions = [];
        if (isset($data['result']['disease']['suggestions'])) {
            $suggestions = $data['result']['disease']['suggestions'];
        } elseif (isset($data['result']['diseases'])) {
            $suggestions = $data['result']['diseases'];
        }

        $healthStatus = 'Good health';
        $isHealthy = true;

        if (!empty($suggestions)) {
            $topDisease = $suggestions[0];
            $probability = $topDisease['probability'] ?? 0;
            if ($probability > 0.4) {
                $nameLower = strtolower($topDisease['name']);
                if (in_array($nameLower, ['healthy', 'good health', 'is_healthy'])) {
                    $healthStatus = 'Good health';
                    $isHealthy = true;
                } else {
                    $healthStatus = $topDisease['name'];
                    $isHealthy = false;
                }
            }
        }

        return response()->json([
            'healthStatus' => $healthStatus,
            'isHealthy' => $isHealthy,
            'raw' => $data
        ]);
    }
}
