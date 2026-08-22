<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebasePushService
{
    /**
     * Send a push notification using Firebase Cloud Messaging Legacy API.
     */
    public static function send($token, $title, $body, $data = [])
    {
        $serverKey = env('FCM_SERVER_KEY');
        if (!$serverKey) {
            Log::warning('FirebasePushService: FCM_SERVER_KEY is not set in .env');
            return false;
        }

        if (!$token) {
            return false;
        }

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default'
            ],
            'data' => $data,
        ]);

        if ($response->successful()) {
            return true;
        }

        Log::error('FirebasePushService Failed', ['response' => $response->json()]);
        return false;
    }
}
