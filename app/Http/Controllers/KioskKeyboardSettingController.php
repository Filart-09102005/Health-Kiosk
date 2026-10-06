<?php

namespace App\Http\Controllers;

use App\Support\AdminSettings;
use Illuminate\Http\JsonResponse;

/**
 * Read is public, same reasoning as MeasurementAvailabilityController: the
 * floating on-screen keyboard mounts on every page, including the login and
 * register screens where nobody is signed in yet, so it needs this before
 * any session exists. It is a display preference, not sensitive data, so
 * there is nothing to protect by requiring auth here. Writing the setting
 * stays admin-only - see Admin\SettingController::update(), the same
 * settings.kioskKeyboardEnabledAdmin / kioskKeyboardEnabledUser keys.
 */
class KioskKeyboardSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = AdminSettings::all();

        return response()->json([
            'admin' => (bool) ($settings['kioskKeyboardEnabledAdmin'] ?? true),
            'user' => (bool) ($settings['kioskKeyboardEnabledUser'] ?? true),
        ]);
    }
}
