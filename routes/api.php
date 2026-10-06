<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AlertController;
use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\HealthRecordController as AdminHealthRecordController;
use App\Http\Controllers\Admin\KioskSessionController as AdminKioskSessionController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserImportController;
use App\Http\Controllers\Admin\UserSyncController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\KioskKeyboardSettingController;
use App\Http\Controllers\KioskLiveVitalsController;
use App\Http\Controllers\MeasurementAvailabilityController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ThermalReceiptController;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use App\Http\Controllers\User\MeasurementController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\User\SessionController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProfileController;

Route::prefix('auth')->group(function () {
    Route::post('/check-barcode', [AuthController::class, 'checkBarcode'])->middleware('throttle:barcode-check');
    Route::post('/check-email', [AuthController::class, 'checkEmail'])->middleware('throttle:barcode-check');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/barcode-login', [AuthController::class, 'barcodeLogin'])->middleware('throttle:barcode-login');
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:verification-resend');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:verification-resend');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:verification-resend');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::middleware(['auth:sanctum', 'verified'])->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/user/profile', [ProfileController::class, 'update']);
        Route::put('/user/password', [ProfileController::class, 'updatePassword']);
    });
});

Route::middleware(['auth:sanctum', 'verified', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);
        Route::get('/analytics', AdminAnalyticsController::class);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::post('/users/import', [UserImportController::class, 'import']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/verify', [UserController::class, 'verify']);
        Route::post('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/alerts', [AlertController::class, 'index']);
        Route::get('/alerts/queue', [AlertController::class, 'queue']);
        // The sidebar's unread-alert badge has always called this path, but the
        // route was never registered - AlertController::unreadCount() existed
        // and was simply unreachable, so the badge silently stayed at 0.
        Route::get('/alerts/unread-count', [AlertController::class, 'unreadCount']);
        Route::post('/alerts/resolve-all', [AlertController::class, 'resolveAll']);
        Route::post('/alerts/{id}/acknowledge', [AlertController::class, 'acknowledge']);
        Route::post('/alerts/{id}/resolve', [AlertController::class, 'resolve']);
        Route::get('/health-records', [AdminHealthRecordController::class, 'index']);
        Route::get('/sessions', [AdminKioskSessionController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);
        // The Measurement Analytics row builds its file in the browser from
        // this payload. The route was never registered, so that report's PDF
        // and Excel buttons 404'd and reported "an error occurred".
        Route::get('/reports/data', [ReportController::class, 'getData']);
        Route::get('/reports/download-pdf', [ReportController::class, 'downloadPdf']);
        Route::get('/reports/download-excel', [ReportController::class, 'downloadExcel']);
        Route::get('/reports/filter-options', [ReportController::class, 'filterOptions']);
        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
        Route::put('/measurement-availability', [MeasurementAvailabilityController::class, 'update']);
        Route::post('/sync/users', UserSyncController::class)->middleware('throttle:10,1');
    });

// Staff accounts are created with the `personnel` role, and the older
// `teacher`/`staff`/`faculty` rows predate it. Every one of them is a kiosk
// user, so all of them belong here - leaving `personnel` out locked every
// account the Teachers page creates out of the kiosk.
Route::middleware(['auth:sanctum', 'verified', 'role:student,teacher,personnel,staff,faculty'])
    ->prefix('user')
    ->group(function () {
        Route::get('/dashboard', UserDashboardController::class);
        Route::get('/session', [SessionController::class, 'current']);
        Route::post('/session/end', [SessionController::class, 'end']);
        Route::get('/measurements/summary', [MeasurementController::class, 'summary']);
        Route::get('/health-records', [MeasurementController::class, 'records']);
        Route::post('/measurements', [MeasurementController::class, 'store'])->middleware('throttle:60,1');
        // The frontend has always called this path to skip a measurement, and
        // MeasurementController::skip() was fully implemented - the route
        // itself was just never registered, so every "Skip" press 404'd.
        Route::post('/measurements/skip', [MeasurementController::class, 'skip'])->middleware('throttle:60,1');
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read', [NotificationController::class, 'read']);
        Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    });

Route::middleware(['auth:sanctum', 'verified'])
    ->post('/receipt/print', [ThermalReceiptController::class, 'print'])
    ->middleware('throttle:30,1');

// Readable by every signed-in role: the kiosk screens poll this to know whether
// a Smart measurement may be started. Writing is admin-only and lives in the
// admin group above.
Route::middleware(['auth:sanctum', 'verified'])
    ->get('/measurement-availability', [MeasurementAvailabilityController::class, 'index']);

// Public on purpose: the floating keyboard mounts on the login/register
// screens too, before anyone is signed in, and needs to know the admin's
// on/off preference before that. Writing is admin-only, via the ordinary
// settings.kioskKeyboardEnabled key on the admin settings endpoint above.
Route::middleware('throttle:120,1')
    ->get('/settings/keyboard', [KioskKeyboardSettingController::class, 'index']);

// These four had no authentication at all - any device on the network could
// inject fake sensor readings or issue START/STOP commands to the kiosk.
// The two callers need different treatment: the browser (a logged-in kiosk
// user or admin) authenticates the normal way; the Python serial bridge has
// no session at all and instead proves itself with the shared
// X-Kiosk-Bridge-Token header (see AuthenticateKioskBridge[OrUser]).
Route::middleware('throttle:600,1')->group(function () {
    Route::middleware(['auth:sanctum', 'verified'])->get('/kiosk/live-vitals', [KioskLiveVitalsController::class, 'show']);
    // Written by both the bridge (sensor payloads) and the browser (resetting
    // the display between measurements), so either credential is accepted.
    Route::middleware('kiosk.bridge_or_user')->post('/kiosk/live-vitals', [KioskLiveVitalsController::class, 'store']);
    // Only the bridge polls this, to learn what command to send the Arduino.
    Route::middleware('kiosk.bridge')->get('/kiosk/command', [KioskLiveVitalsController::class, 'command']);
    // Only the browser sets a command (the Start/Stop buttons); the bridge
    // never writes here, only reads.
    Route::middleware(['auth:sanctum', 'verified'])->post('/kiosk/command', [KioskLiveVitalsController::class, 'setCommand']);
});
