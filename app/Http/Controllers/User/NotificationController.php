<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Services\Health\UserNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly UserNotificationService $notifications) {}

    /** Everything this user has been notified of, newest first. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'notifications' => $this->notifications->listFor($user->id)->map($this->present(...))->all(),
            'unread_count' => $this->notifications->unreadCount($user->id),
        ]);
    }

    /**
     * Mark specific notifications read.
     *
     * Opening the list is not reading it: the ids come from the notifications
     * the user actually opened, so an unopened alert keeps its unread mark even
     * after the page has been scrolled past it.
     */
    public function read(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $user = $request->user();

        UserNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $validated['ids'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['unread_count' => $this->notifications->unreadCount($user->id)]);
    }

    /** The explicit "Mark all read" control. */
    public function readAll(Request $request): JsonResponse
    {
        $user = $request->user();

        UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['unread_count' => 0]);
    }

    private function present(UserNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'key' => $notification->key,
            'type' => $notification->type,
            'severity' => $notification->severity,
            'title' => $notification->title,
            'message' => $notification->message,
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
            'health_record_id' => $notification->health_record_id,
            'kiosk_session_id' => $notification->kiosk_session_id,
        ];
    }
}
