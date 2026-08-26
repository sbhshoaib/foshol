<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

use App\Http\Controllers\Api\CropController;
use App\Http\Controllers\Api\LandController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\WeatherController;
use App\Http\Controllers\Api\DiseaseDetectionController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ai/chatbot', [AiController::class, 'chatbot']);
    Route::post('/ai/fertilizer/questions', [AiController::class, 'fertilizerQuestions']);
    Route::post('/ai/fertilizer/recommendation', [AiController::class, 'fertilizerRecommendation']);
    Route::post('/ai/crop-phases', [AiController::class, 'cropPhases']);
    Route::post('/ai/price-prediction', [AiController::class, 'pricePrediction']);
    Route::post('/ai/weather/summary', [AiController::class, 'weatherSummary']);
    Route::post('/ai/disease-solution', [AiController::class, 'diseaseSolution']);
    Route::post('/disease-detection', [DiseaseDetectionController::class, 'detect']);
    Route::get('/weather', [WeatherController::class, 'getWeather']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user', function (Request $request) {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'push_enabled' => 'nullable|boolean',
        ]);
        
        $user = $request->user();
        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['location'])) $user->location = $validated['location'];
        if (isset($validated['phone'])) $user->phone = $validated['phone'];
        if (isset($validated['push_enabled'])) $user->push_enabled = $validated['push_enabled'];
        $user->save();
        
        return $user;
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::put('/user/device', function (Request $request) {
        $request->validate([
            'device_token' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lon' => 'nullable|numeric',
        ]);
        
        $user = $request->user();
        $user->update($request->only(['device_token', 'lat', 'lon']));
        
        return response()->json(['message' => 'Device info updated']);
    });

    Route::get('/notifications', function (Request $request) {
        $notifications = \App\Models\Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        return response()->json($notifications);
    });

    Route::put('/notifications/mark-read', function (Request $request) {
        \App\Models\Notification::where('user_id', $request->user()->id)->update(['seen' => true]);
        return response()->json(['message' => 'Marked as read']);
    });

    Route::post('/process-notifications', function () {
        \Illuminate\Support\Facades\Artisan::call('app:process-notifications');
        return response()->json(['message' => 'Notifications processed successfully']);
    });

    // Crops
    Route::get('/crops', [CropController::class, 'index']);
    Route::post('/crops', [CropController::class, 'store']);
    Route::delete('/crops/{id}', [CropController::class, 'destroy']);

    // Lands
    Route::get('/lands', [LandController::class, 'index']);
    Route::post('/lands', [LandController::class, 'store']);
    Route::put('/lands/{id}', [LandController::class, 'update']);
    Route::delete('/lands/{id}', [LandController::class, 'destroy']);
});
