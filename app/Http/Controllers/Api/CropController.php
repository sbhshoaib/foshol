<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\CropPhase;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CropController extends Controller
{
    public function index(Request $request)
    {
        // For now, if no auth is fully wired in the frontend for these calls,
        // we can fetch all or just the authenticated user's crops.
        $userId = Auth::id() ?: 1; // Fallback to 1 for dev if auth isn't passed

        $crops = Crop::with(['phases', 'tasks'])->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return response()->json($crops);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'type' => 'required|string',
            'start_date' => 'required|date',
            'color_shade' => 'nullable|string',
            'emoji' => 'nullable|string',
            'phases' => 'required|array',
            'tasks' => 'nullable|array',
        ]);

        $userId = Auth::id() ?: 1;

        DB::beginTransaction();
        try {
            // Create Crop
            $crop = Crop::create([
                'user_id' => $userId,
                'name' => $request->name,
                'type' => $request->type,
                'start_date' => $request->start_date,
                'color_shade' => $request->color_shade,
                'emoji' => $request->emoji,
            ]);

            $phaseMap = []; // Map frontend phase name to DB phase ID

            // Create Phases
            foreach ($request->phases as $index => $phaseData) {
                if (!isset($phaseData['is_active']) || $phaseData['is_active']) {
                    $phase = CropPhase::create([
                        'crop_id' => $crop->id,
                        'name' => $phaseData['name'],
                        'sequence' => $index + 1,
                        'days_count' => $phaseData['days_count'],
                        'start_date' => $phaseData['start_date'] ?? null,
                        'end_date' => $phaseData['end_date'] ?? null,
                    ]);
                    $phaseMap[$phase->name] = $phase->id;
                }
            }

            // Create Tasks
            if ($request->tasks) {
                foreach ($request->tasks as $taskData) {
                    // Only save tasks for active phases
                    if (isset($phaseMap[$taskData['phase_name']])) {
                        Task::create([
                            'user_id' => $userId,
                            'crop_id' => $crop->id,
                            'crop_phase_id' => $phaseMap[$taskData['phase_name']],
                            'title' => $taskData['title'],
                            'date' => $taskData['date'] ?? null,
                            'type' => $taskData['type'] ?? 'general',
                            'is_schedule' => true,
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => 'Crop created successfully', 'crop' => $crop->load('phases')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create crop', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $userId = Auth::id() ?: 1;
        $crop = Crop::where('id', $id)->where('user_id', $userId)->first();

        if (!$crop) {
            return response()->json(['error' => 'Crop not found or unauthorized'], 404);
        }

        DB::beginTransaction();
        try {
            Task::where('crop_id', $crop->id)->delete();
            CropPhase::where('crop_id', $crop->id)->delete();
            $crop->delete();
            
            DB::commit();
            return response()->json(['message' => 'Crop and associated tasks deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to delete crop'], 500);
        }
    }
}
