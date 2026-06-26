<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserIndexRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(UserIndexRequest $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->validated();
        $perPage = min((int) ($filters['per_page'] ?? 15), 50);

        $users = User::query()
            ->select([
                'id',
                'firstname',
                'lastname',
                'student_id',
                'email',
                'email_verified_at',
                'role',
                'department',
                'age',
                'gender',
                'barcode',
                'created_at',
            ])
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when($filters['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        ActivityLog::record('admin_users_index', $request->user(), $request, 'Admin viewed paginated users.', [
            'filters' => $filters,
        ]);

        return response()->json($users);
    }
}
