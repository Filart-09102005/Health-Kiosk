<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Health\ThresholdReevaluationService;
use App\Support\AdminSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        // Deliberately not scoped to the signed-in admin: thresholds are global,
        // and showing a per-admin row meant the screen could display values that
        // were not the ones actually grading readings.
        return response()->json([
            'settings' => AdminSettings::all(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        // Validated for constraints only — the value persisted is the raw input,
        // which AdminSettings prunes against its own defaults. validated() would
        // drop any key lacking an explicit rule below.
        $request->validate([
            'settings' => ['required', 'array'],

            'settings.temperature.alertLow' => ['sometimes', 'numeric', 'between:20,45'],
            'settings.temperature.normalLow' => ['sometimes', 'numeric', 'between:20,45'],
            'settings.temperature.normalHigh' => ['sometimes', 'numeric', 'between:20,45'],
            'settings.temperature.alertHigh' => ['sometimes', 'numeric', 'between:20,45'],

            'settings.heartRate.alertLow' => ['sometimes', 'numeric', 'between:20,250'],
            'settings.heartRate.normalLow' => ['sometimes', 'numeric', 'between:20,250'],
            'settings.heartRate.normalHigh' => ['sometimes', 'numeric', 'between:20,250'],
            'settings.heartRate.alertHigh' => ['sometimes', 'numeric', 'between:20,250'],

            'settings.spo2.alertLow' => ['sometimes', 'numeric', 'between:50,100'],
            'settings.spo2.normalLow' => ['sometimes', 'numeric', 'between:50,100'],

            'settings.bmi.underweightMax' => ['sometimes', 'numeric', 'between:5,60'],
            'settings.bmi.normalMax' => ['sometimes', 'numeric', 'between:5,60'],
            'settings.bmi.overweightMax' => ['sometimes', 'numeric', 'between:5,60'],

            'settings.alertsEnabled' => ['sometimes', 'boolean'],
            'settings.alertSensitivity' => ['sometimes', 'string', 'max:32'],
            'settings.platformOffsetCm' => ['sometimes', 'numeric', 'between:0,50'],
            'settings.kioskKeyboardEnabledAdmin' => ['sometimes', 'boolean'],
            'settings.kioskKeyboardEnabledUser' => ['sometimes', 'boolean'],
        ]);

        $before = AdminSettings::all();
        $settings = AdminSettings::save((array) $request->input('settings'), $request->user()->id);

        // A band that moved has to be applied to what is already on file.
        // Without this, a reading turned Alert on the records screen while the
        // student was never notified and the clinic never saw the alert.
        $regraded = 0;

        if ($this->bandsChanged($before, $settings)) {
            $regraded = app(ThresholdReevaluationService::class)->run();
        }

        return response()->json([
            'settings' => $settings,
            'regraded_records' => $regraded,
        ]);
    }

    /** Only the grading bands matter here; a display preference changes nothing. */
    private function bandsChanged(array $before, array $after): bool
    {
        $bands = ['temperature', 'heartRate', 'spo2', 'bmi'];

        foreach ($bands as $band) {
            if (($before[$band] ?? null) != ($after[$band] ?? null)) {
                return true;
            }
        }

        return false;
    }
}
