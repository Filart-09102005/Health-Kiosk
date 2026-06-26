<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\KioskSessionResource;
use App\Models\KioskSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class KioskSessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = KioskSession::query()
            ->with(['user:id,firstname,lastname,student_id,barcode,role,department', 'healthRecord', 'activities'])
            ->whereHas('user', fn ($userQuery) => $userQuery->where('role', '!=', 'admin'))
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
            $query->where('status', $status);
        }

        return KioskSessionResource::collection($query->paginate(min($request->integer('per_page', 15), 100)));
    }
}
