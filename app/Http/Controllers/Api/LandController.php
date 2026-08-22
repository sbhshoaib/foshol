<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Land;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LandController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id() ?: 1;
        $lands = Land::where('user_id', $userId)->get();
        return response()->json($lands);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'area' => 'nullable|numeric|min:0',
        ]);

        $userId = Auth::id() ?: 1;

        $land = Land::create([
            'user_id' => $userId,
            'name' => $request->name,
            'area' => $request->area,
        ]);

        return response()->json(['message' => 'Land created successfully', 'land' => $land], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'area' => 'nullable|numeric|min:0',
        ]);

        $userId = Auth::id() ?: 1;
        $land = Land::where('id', $id)->where('user_id', $userId)->first();

        if (!$land) {
            return response()->json(['error' => 'Land not found or unauthorized'], 404);
        }

        $land->update([
            'name' => $request->name,
            'area' => $request->area,
        ]);

        return response()->json(['message' => 'Land updated successfully', 'land' => $land]);
    }

    public function destroy($id)
    {
        $userId = Auth::id() ?: 1;
        $land = Land::where('id', $id)->where('user_id', $userId)->first();

        if (!$land) {
            return response()->json(['error' => 'Land not found or unauthorized'], 404);
        }

        $land->delete();
        
        return response()->json(['message' => 'Land deleted successfully']);
    }
}
