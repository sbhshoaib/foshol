<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherController extends Controller
{
    public function getWeather(Request $request)
    {
        $lat = $request->input('lat');
        $lon = $request->input('lon');

        if (!$lat || !$lon) {
            return response()->json(['error' => 'Latitude and longitude are required.'], 400);
        }

        $apiKey = env('OPENWEATHER_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'OPENWEATHER_API_KEY is not configured.'], 500);
        }

        try {
            // Fetch reverse geocoding
            $geoRes = Http::get("https://api.openweathermap.org/geo/1.0/reverse", [
                'lat' => $lat,
                'lon' => $lon,
                'limit' => 1,
                'appid' => $apiKey
            ]);

            // Fetch current weather
            $weatherRes = Http::get("https://api.openweathermap.org/data/2.5/weather", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $apiKey,
                'units' => 'metric'
            ]);

            // Fetch 5-day / 3-hour forecast
            $forecastRes = Http::get("https://api.openweathermap.org/data/2.5/forecast", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $apiKey,
                'units' => 'metric',
                'cnt' => 8 // next 24 hours
            ]);

            if ($weatherRes->failed() || $forecastRes->failed()) {
                return response()->json(['error' => 'Weather fetch failed'], 500);
            }

            $geoData = $geoRes->json();
            $weatherData = $weatherRes->json();
            $forecastData = $forecastRes->json();

            $location = 'Unknown Location';
            if (!empty($geoData) && isset($geoData[0]['name'])) {
                $location = $geoData[0]['name'];
            }

            $temp = isset($weatherData['main']['temp']) ? round($weatherData['main']['temp']) : null;
            $condition = $weatherData['weather'][0]['description'] ?? 'Unknown';
            $condition = ucwords($condition);

            $rainChance3Hr = 0;
            $rainChanceToday = 0;

            if (isset($forecastData['list']) && count($forecastData['list']) > 0) {
                // First 3-hour window
                if (isset($forecastData['list'][0]['pop'])) {
                    $rainChance3Hr = round($forecastData['list'][0]['pop'] * 100);
                }
                
                // Max pop for the next 24 hours
                $maxPop = 0;
                foreach ($forecastData['list'] as $f) {
                    if (isset($f['pop']) && $f['pop'] > $maxPop) {
                        $maxPop = $f['pop'];
                    }
                }
                $rainChanceToday = round($maxPop * 100);
            }

            return response()->json([
                'temp' => $temp,
                'condition' => $condition,
                'location' => $location,
                'rainChance3Hr' => $rainChance3Hr,
                'rainChanceToday' => $rainChanceToday,
                'raw_weather' => $weatherData
            ]);

        } catch (\Exception $e) {
            Log::error('Weather API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch weather'], 500);
        }
    }
}
