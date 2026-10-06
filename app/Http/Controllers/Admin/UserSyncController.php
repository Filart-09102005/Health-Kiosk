<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseHealthRecordSyncService;
use App\Services\SupabaseUserSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class UserSyncController extends Controller
{
    public function __invoke(
        SupabaseUserSyncService $userSyncService,
        SupabaseHealthRecordSyncService $healthRecordSyncService,
    ): JsonResponse
    {
        Log::info('Manual Supabase cloud sync requested.', [
            'admin_id' => auth()->id(),
        ]);

        try {
            // Pressing this button means "make the cloud match what is here", so
            // it re-pushes everything rather than trusting the local flags. Left
            // to those flags, rows deleted in the Supabase dashboard were skipped
            // and the admin was told the sync had completed with nothing to do.
            $usersMarked = SupabaseUserSyncService::markAllPending();
            $recordsMarked = SupabaseHealthRecordSyncService::markAllPending();

            Log::info('Manual sync marked rows for re-upload.', [
                'users' => $usersMarked,
                'health_records' => $recordsMarked,
            ]);

            $userResult = $userSyncService->syncUsers();
            $healthRecordResult = $healthRecordSyncService->syncHealthRecords();

            Log::info('Manual Supabase cloud sync finished.', [
                'admin_id' => auth()->id(),
                'users_synced_count' => $userResult['synced_count'] ?? 0,
                'users_failed_count' => $userResult['failed_count'] ?? 0,
                'health_records_synced_count' => $healthRecordResult['synced_count'] ?? 0,
                'health_records_failed_count' => $healthRecordResult['failed_count'] ?? 0,
                'health_records_skipped_count' => $healthRecordResult['skipped_count'] ?? 0,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Manual Supabase cloud sync failed.', [
                'admin_id' => auth()->id(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Cloud sync failed.',
                'error' => $exception->getMessage(),
                'synced_count' => 0,
                'failed_count' => 0,
                'users' => [
                    'synced_count' => 0,
                    'failed_count' => 0,
                    'errors' => [],
                ],
                'health_records' => [
                    'synced_count' => 0,
                    'failed_count' => 0,
                    'skipped_count' => 0,
                    'errors' => [],
                ],
            ], 500);
        }

        $failedCount = (int) ($userResult['failed_count'] ?? 0) + (int) ($healthRecordResult['failed_count'] ?? 0);
        $syncedCount = (int) ($userResult['synced_count'] ?? 0) + (int) ($healthRecordResult['synced_count'] ?? 0);
        $errors = array_merge($userResult['errors'] ?? [], $healthRecordResult['errors'] ?? []);

        return response()->json([
            'success' => $failedCount === 0,
            'message' => $failedCount === 0 ? 'Cloud sync completed successfully.' : 'Cloud sync completed with issues.',
            // Everything is re-sent, so the client can say what the cloud now
            // holds instead of only what changed.
            'full_resync' => true,
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'errors' => array_slice($errors, 0, 5),
            'users' => [
                'synced_count' => $userResult['synced_count'] ?? 0,
                'failed_count' => $userResult['failed_count'] ?? 0,
                'errors' => $userResult['errors'] ?? [],
                'synced_names' => $userResult['synced_names'] ?? [],
            ],
            'health_records' => [
                'synced_count' => $healthRecordResult['synced_count'] ?? 0,
                'failed_count' => $healthRecordResult['failed_count'] ?? 0,
                'skipped_count' => $healthRecordResult['skipped_count'] ?? 0,
                'errors' => $healthRecordResult['errors'] ?? [],
            ],
        ]);
    }
}
