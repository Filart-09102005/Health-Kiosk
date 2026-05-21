<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\HealthRecordResource;
use App\Models\HealthRecord;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = HealthRecord::query()
            ->with(['user:id,firstname,lastname,barcode,role,department', 'kioskSession:id,session_number,status,started_at'])
            ->latest();

        if ($search = $request->string('search')->trim()->value()) {
            $query->whereHas('user', function ($userQuery) use ($search) {
                $userQuery
                    ->where('firstname', 'like', "%{$search}%")
                    ->orWhere('lastname', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('health_status', $status);
        }

        return HealthRecordResource::collection($query->paginate($request->integer('per_page', 10)));
    }
}
