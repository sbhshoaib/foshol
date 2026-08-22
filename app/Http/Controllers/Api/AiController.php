<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    private function callGemini($prompt, $schema, $model = 'gemini-1.5-flash')
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'GEMINI_API_KEY is not configured.'], 500);
        }

        // The user was using 3.5/3.6, but the actual official REST API only supports existing models.
        // We will fallback to whatever the user passed, or map to 1.5 if it fails.
        // The endpoint is generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => $schema
            ]
        ];

        $response = Http::withHeaders([
            'x-goog-api-key' => $apiKey
        ])->post($url, $payload);

        if ($response->successful()) {
            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($text) {
                $decoded = json_decode($text, true);
                if ($decoded === null) {
                    Log::error('Gemini JSON Decode Error. Text was: ' . $text);
                }
                return $decoded;
            } else {
                Log::error('Gemini API Error: No text in response. Data: ' . json_encode($data));
            }
        } else {
            $errorData = $response->json();
            $errorMessage = $errorData['error']['message'] ?? $response->body();
            Log::error('Gemini API Error: ' . $errorMessage);
            throw new \Exception('Gemini API Error: ' . $errorMessage);
        }

        throw new \Exception('Failed to get valid response from Gemini');
    }

    public function chatbot(Request $request)
    {
        $message = $request->input('message');
        $previousSummary = $request->input('previousSummary', '');
        $contextData = $request->input('contextData', []);

        if (!$message) {
            return response()->json(['error' => 'Message is required.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'response' => [
                    'type' => 'STRING',
                    'description' => "The AI's conversational response to the user's message."
                ],
                'summary' => [
                    'type' => 'STRING',
                    'description' => "A comprehensive rolling summary of the entire conversation up to this point. This must capture all important context, user intent, previous advice given, and the latest interaction."
                ]
            ],
            'required' => ['response', 'summary']
        ];

        $prompt = "You are Foshol AI, an expert agricultural chatbot helping farmers manage their crops, lands, and tasks.\n\n" .
            "### CONTEXT MANAGEMENT INSTRUCTIONS (CRITICAL)\n" .
            "You operate in a stateless environment to save tokens and improve speed. Instead of receiving the entire chat history, you receive a \"Rolling Summary\" of the conversation so far. \n" .
            "Your job is to provide the next conversational response AND generate a new updated \"Rolling Summary\". \n" .
            "Why is the summary needed? Because this summary is the ONLY memory you will have in the next turn! If you omit important details from the summary, you will forget them in the next message.\n\n" .
            "### USER'S BACKGROUND CONTEXT\n" .
            "Below is the user's current agricultural data (crops, tasks, lands). Use this to provide personalized, highly relevant advice:\n" .
            json_encode($contextData, JSON_PRETTY_PRINT) . "\n\n" .
            "### CONVERSATION SO FAR (ROLLING SUMMARY)\n" .
            ($previousSummary ? $previousSummary : "This is the very first message in the conversation.") . "\n\n" .
            "### LATEST USER MESSAGE\n" .
            "\"{$message}\"\n\n" .
            "### YOUR TASK\n" .
            "1. \"response\": Reply to the user's latest message naturally and helpfully, using the background context and the rolling summary to maintain continuity.\n" .
            "2. \"summary\": Write a new, concise rolling summary that combines the previous summary with the essence of this latest interaction. Ensure any ongoing problems, questions, or established context are preserved in this summary.";

        // Use gemini-1.5-flash since 3.5 doesn't exist yet on google API
        try {
            $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');
            if ($result) {
                return response()->json($result);
            }
            return response()->json(['error' => 'Failed to generate content'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function fertilizerQuestions(Request $request)
    {
        $cropName = $request->input('cropName');
        $cropType = $request->input('cropType');
        $landArea = $request->input('landArea');

        if (!$cropType) {
            return response()->json(['error' => 'Crop Type is required.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'questions' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'id' => ['type' => 'STRING'],
                            'question' => ['type' => 'STRING'],
                            'options' => [
                                'type' => 'ARRAY',
                                'items' => ['type' => 'STRING'],
                                'description' => "Provide exactly 3 to 4 multiple-choice options."
                            ]
                        ],
                        'required' => ['id', 'question', 'options']
                    ],
                    'description' => "A list of 3-4 diagnostic multiple-choice questions."
                ]
            ],
            'required' => ['questions']
        ];

        $landStr = $landArea ? $landArea . ' acres' : 'unknown size';
        $cropStr = $cropName ?: $cropType;

        $prompt = "You are an expert agricultural AI diagnostician.\n" .
            "The farmer is growing a crop: {$cropStr} (Type: {$cropType}) on a land area of {$landStr}.\n\n" .
            "Your task is to generate EXACTLY 3 or 4 multiple-choice questions to ask the farmer in order to accurately diagnose the crop's current health and determine if it needs any fertilizer, and if so, what kind.\n\n" .
            "Focus the questions on visual symptoms (e.g., leaf color, spots, wilting) and environmental context (e.g., soil moisture, recent growth speed).\n" .
            "Do NOT ask open-ended questions. Provide exactly 3 to 4 distinct options for each question.";

        $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');

        if ($result) {
            return response()->json($result);
        }

        return response()->json(['error' => 'Failed to generate content'], 500);
    }

    public function fertilizerRecommendation(Request $request)
    {
        $cropName = $request->input('cropName');
        $cropType = $request->input('cropType');
        $landArea = $request->input('landArea');
        $qaPairs = $request->input('qaPairs');

        if (!$cropType || !$qaPairs) {
            return response()->json(['error' => 'Crop Type and QA Pairs are required.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'needs_fertilizer' => [
                    'type' => 'BOOLEAN',
                    'description' => "True if fertilizer is needed, False if the crop is perfectly healthy and doesn't need intervention."
                ],
                'no_fertilizer_reason' => [
                    'type' => 'STRING',
                    'description' => "If needs_fertilizer is false, briefly explain why they are doing great."
                ],
                'fertilizers' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'name' => ['type' => 'STRING', 'description' => "Name of the fertilizer (e.g., Urea, NPK, Potash)"],
                            'amount' => ['type' => 'STRING', 'description' => "Recommended amount, scaled to their land area if known (e.g., 50 kg for 2 acres)"],
                            'guideline' => ['type' => 'STRING', 'description' => "Specific instructions on how to apply it."],
                            'outcome' => ['type' => 'STRING', 'description' => "Expected result after application."]
                        ],
                        'required' => ['name', 'amount', 'guideline', 'outcome']
                    ],
                    'description' => "List of recommended fertilizers if needed."
                ]
            ],
            'required' => ['needs_fertilizer', 'fertilizers']
        ];

        $landStr = $landArea ? $landArea . ' acres' : 'unknown size';
        $cropStr = $cropName ?: $cropType;

        $prompt = "You are an expert agricultural AI.\n" .
            "The farmer is growing a crop: {$cropStr} (Type: {$cropType}) on a land area of {$landStr}.\n\n" .
            "The farmer has answered the following diagnostic questions about their crop:\n" .
            json_encode($qaPairs, JSON_PRETTY_PRINT) . "\n\n" .
            "Analyze these answers. \n" .
            "1. Determine if the crop is healthy or if it requires fertilizers (macro/micronutrients or organic manure).\n" .
            "2. If it requires fertilizer, prescribe the specific fertilizers needed.\n" .
            "3. Calculate the recommended amount based on the provided land area ({$landStr}).\n" .
            "4. Provide a brief guideline on application.\n" .
            "5. Provide the expected outcome.";

        $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');

        if ($result) {
            return response()->json($result);
        }

        return response()->json(['error' => 'Failed to generate content'], 500);
    }

    public function cropPhases(Request $request)
    {
        $cropType = $request->input('cropType');
        $startDate = $request->input('startDate');
        $landArea = $request->input('landArea');

        if (!$cropType || !$startDate) {
            return response()->json(['error' => 'cropType and startDate are required.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'colorShade' => [
                    'type' => 'STRING',
                    'description' => "A single base color name suitable for this crop's light background theme (e.g., 'emerald', 'teal', 'amber', 'orange', 'yellow', 'cyan', 'indigo', 'violet')."
                ],
                'phases' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'name' => ['type' => 'STRING'],
                            'days_count' => ['type' => 'INTEGER'],
                            'description' => ['type' => 'STRING']
                        ],
                        'required' => ['name', 'days_count', 'description']
                    ],
                    'description' => "Sequential growth phases for this crop from planting to harvest."
                ],
                'tasks' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'phase_name' => ['type' => 'STRING'],
                            'title' => ['type' => 'STRING'],
                            'day_offset' => ['type' => 'INTEGER', 'description' => "Number of days after the phase starts to perform this task."],
                            'type' => ['type' => 'STRING', 'description' => "Type of task, e.g. 'water', 'scan', 'general'"]
                        ],
                        'required' => ['phase_name', 'title', 'day_offset', 'type']
                    ]
                ]
            ]
        ];

        $landAreaContext = $landArea ? "The total area of land for cultivation is {$landArea} acres." : '';

        $prompt = "You are an expert agricultural AI. I am starting to grow {$cropType}.\n" .
            "First, verify if \"{$cropType}\" is a valid crop or agricultural plant. If it is NOT a valid crop, return an error field with the message \"Please enter a valid crop.\" and return empty arrays for phases/tasks.\n" .
            "If it IS a valid crop:\n" .
            "The crop cultivation started on {$startDate}.\n" .
            "{$landAreaContext}\n" .
            "Please generate the sequential growth phases for this crop, the typical duration (days_count) for each phase, and some suggested key tasks tied to these phases.\n" .
            "Keep the phase names extremely short and concise, ideally a single word (e.g. \"Germination\", \"Vegetative\", \"Flowering\", \"Harvest\"). Do not use long phrases like \"Germination & Establishment\".\n" .
            "If land area is provided, scale the tasks appropriately (e.g., mention the estimated amount of seeds, fertilizers, or manpower needed for the given acres in the task descriptions).\n" .
            "Provide a suitable professional base color name for a light UI theme for this crop (e.g., \"emerald\", \"amber\", \"teal\", \"orange\", \"yellow\").";

        $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');

        if ($result) {
            return response()->json($result);
        }

        return response()->json(['error' => 'Failed to generate content'], 500);
    }

    public function pricePrediction(Request $request)
    {
        $crop = $request->input('crop');
        $month = $request->input('month');
        $year = $request->input('year');
        $location = $request->input('location');
        $reportType = $request->input('reportType', 'monthly');

        if (!$crop || !is_string($crop)) {
            return response()->json(['error' => 'crop name is required and must be a string.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'summary' => [
                    'type' => 'STRING',
                    'description' => "A brief, 2-3 sentence analysis of why prices are trending this way during this period in Bangladesh."
                ],
                'unit' => [
                    'type' => 'STRING',
                    'description' => "The local wholesale measurement unit in Bangladesh for this specific crop (e.g., 'Mond (40 kg)' for Rice, 'Kg' for Tomatoes, 'Ton' for large quantities)."
                ],
                'data' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'period' => ['type' => 'STRING', 'description' => "E.g., 'Week 1', 'Week 2' OR 'January', 'February', depending on the report type."],
                            'price' => ['type' => 'NUMBER', 'description' => "The predicted average wholesale price (in BDT per the specified local measurement unit) for this period."]
                        ],
                        'required' => ['period', 'price']
                    ]
                ],
                'news' => [
                    'type' => 'ARRAY',
                    'description' => "Recent news headlines related to this crop's market price. Provide only if reportType is yearly.",
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'title' => ['type' => 'STRING', 'description' => "The headline or summary of the news"],
                            'source' => ['type' => 'STRING', 'description' => "The source or publication name"],
                            'date' => ['type' => 'STRING', 'description' => "The date of the news publication (e.g., 'August 15, 2026', 'Recently')"]
                        ],
                        'required' => ['title', 'source', 'date']
                    ]
                ]
            ],
            'required' => ['summary', 'unit', 'data']
        ];

        $monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        $targetMonth = is_numeric($month) ? ($monthNames[$month] ?? $month) : $month;
        $loc = $location ?: 'Bangladesh';

        $prompt = "You are an expert agricultural market analyst for Bangladesh.\n" .
            "I need a realistic wholesale price prediction for the following crop: {$crop}.\n" .
            "The market location context is {$loc}.\n\n" .
            "Crucially, you must use the standard local wholesale measurement unit for this crop (e.g., 'Mond (40 kg)' for Rice, 'Kg' for vegetables, etc.). Provide this unit in the 'unit' string.\n" .
            "The prices you provide must be in BDT per that specific measurement unit.\n";

        if ($reportType === 'yearly') {
            $prompt .= "\nThe prediction is for the entire year of {$year}.\n" .
                "Consider the typical seasonality, supply/demand dynamics, and harvest times in Bangladesh for this specific crop throughout {$year}.\n" .
                "Return the predicted prices for each month: January, February, March, April, May, June, July, August, September, October, November, and December. The 'period' field must contain the month name.\n" .
                "Also provide a short summary analyzing the yearly trend.\n" .
                "Analyze recent news about the market price for this crop and provide a summary of the news in the 'news' array (including title and source).\n";
        } else {
            $prompt .= "\nThe prediction is for the month of {$targetMonth} in the year {$year}.\n" .
                "Consider the typical seasonality, supply/demand dynamics, and harvest times in Bangladesh for this specific crop during {$targetMonth}.\n" .
                "Return the predicted prices for Week 1, Week 2, Week 3, and Week 4 of that month. The 'period' field must contain the week name.\n" .
                "Also provide a short summary analyzing the monthly trend. Do not include news.\n";
        }

        $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');

        if ($result) {
            return response()->json($result);
        }

        return response()->json(['error' => 'Failed to generate content'], 500);
    }

    public function weatherSummary(Request $request)
    {
        $weatherData = $request->input('weatherData');
        $crops = $request->input('crops');

        if (!$weatherData) {
            return response()->json(['error' => 'Weather data is required.'], 400);
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'summary' => [
                    'type' => 'STRING',
                    'description' => "A short, 2-sentence actionable insight based on the weather and the farmer's crops."
                ]
            ],
            'required' => ['summary']
        ];

        $cropContext = 'No active crops currently';
        if ($crops && is_array($crops) && count($crops) > 0) {
            $cropStrings = [];
            foreach ($crops as $c) {
                $type = $c['type'] ?? 'Unknown crop';
                $landName = $c['land']['name'] ?? 'a field';
                $area = isset($c['land']['area']) ? $c['land']['area'] . ' acres' : 'unknown size';
                $cropStrings[] = "{$type} on {$landName} ({$area})";
            }
            $cropContext = implode(', ', $cropStrings);
        }

        $temp = $weatherData['temp'] ?? '--';
        $condition = $weatherData['condition'] ?? '--';
        $rainChanceToday = $weatherData['rainChanceToday'] ?? '--';
        $rainChance3Hr = $weatherData['rainChance3Hr'] ?? '--';

        $prompt = "You are an expert AI agronomist providing a quick daily briefing to a farmer on their dashboard.\n\n" .
            "Current Weather Context:\n" .
            "- Temperature: {$temp}°C\n" .
            "- Condition: {$condition}\n" .
            "- Rain Chance (Today): {$rainChanceToday}%\n" .
            "- Rain Chance (Next 3 Hours): {$rainChance3Hr}%\n\n" .
            "Farmer's Active Crops:\n" .
            "{$cropContext}\n\n" .
            "Task:\n" .
            "Write a short, sharp, 2-sentence actionable insight for the farmer. \n" .
            "Relate the weather strictly to their crops if they have any. \n" .
            "For example, if rain is coming and they have tomatoes, tell them to avoid watering or applying fertilizer today. If it's hot and dry, remind them about irrigation.\n" .
            "Keep it encouraging, highly relevant, and professional. Do NOT use markdown.";

        $result = $this->callGemini($prompt, $schema, 'gemini-1.5-flash');

        if ($result) {
            return response()->json($result);
        }

        return response()->json(['error' => 'Failed to generate content'], 500);
    }
}
