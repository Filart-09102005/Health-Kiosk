<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\KioskSessionResource;
use App\Services\Health\KioskSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function current(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $session = $sessions->activeFor($request->user());

        return response()->json([
            'session' => $session
                ? new KioskSessionResource($session->load(['healthRecord', 'activities' => fn ($query) => $query->latest()->limit(20)]))
                : null,
        ]);
    }

    public function end(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $sessions->end($sessions->activeFor($request->user()));

        return response()->json([
            'message' => 'Session ended successfully.',
        ]);
    }
}
