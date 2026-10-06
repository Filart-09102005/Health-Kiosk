<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\Health\MeasurementAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read is open to any signed-in user (the kiosk screens need it to know whether
 * to start a Smart measurement); write is restricted to admins by the route
 * group it is registered in.
 */
class MeasurementAvailabilityController extends Controller
{
    public function __construct(private readonly MeasurementAvailabilityService $availability)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'availability' => $this->availability->all(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $payload = $request->validate($this->rules());

        $before = $this->availability->all();
        $after = $this->availability->update($payload['availability']);

        $changed = [];

        foreach ($after as $type => $entry) {
            if ($entry['smart_enabled'] !== $before[$type]['smart_enabled']) {
                $changed[$type] = $entry['smart_enabled'];
            }
        }

        // Taking a sensor out of service is a maintenance action, so it belongs
        // in the same audit trail as the other admin actions.
        if ($changed !== []) {
            ActivityLog::record(
                action: 'measurement_availability_updated',
                user: $request->user(),
                request: $request,
                description: 'Updated Smart Mode availability for '.implode(', ', array_keys($changed)).'.',
                metadata: ['changes' => $changed],
            );
        }

        return response()->json([
            'availability' => $after,
        ]);
    }

    /**
     * Built from the registry so a newly added measurement is accepted without
     * touching this method.
     */
    protected function rules(): array
    {
        $rules = [
            'availability' => ['required', 'array'],
        ];

        foreach (MeasurementAvailabilityService::types() as $type) {
            $rules["availability.{$type}"] = ['sometimes', 'array'];
            $rules["availability.{$type}.smart_enabled"] = ['required_with:availability.'.$type, 'boolean'];
        }

        return $rules;
    }
}
