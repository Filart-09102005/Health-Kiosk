<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $setting = Setting::query()
            ->where('user_id', $request->user()->id)
            ->where('key', 'admin_settings')
            ->first();

        return response()->json([
            'settings' => $setting?->value,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $setting = Setting::updateOrCreate(
            ['user_id' => $request->user()->id, 'key' => 'admin_settings'],
            ['value' => $payload['settings']]
        );

        return response()->json([
            'settings' => $setting->value,
        ]);
    }
}
