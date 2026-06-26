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
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\KioskLiveVitalsController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ThermalReceiptController;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use App\Http\Controllers\User\MeasurementController;
use App\Http\Controllers\User\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/check-barcode', [AuthController::class, 'checkBarcode'])->middleware('throttle:barcode-check');
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
    });
});

Route::middleware(['auth:sanctum', 'verified', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);
        Route::get('/analytics', AdminAnalyticsController::class);
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/alerts', [AlertController::class, 'index']);
        Route::get('/health-records', [AdminHealthRecordController::class, 'index']);
        Route::get('/sessions', [AdminKioskSessionController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
    });

Route::middleware(['auth:sanctum', 'verified', 'role:student,teacher'])
    ->prefix('user')
    ->group(function () {
        Route::get('/dashboard', UserDashboardController::class);
        Route::get('/session', [SessionController::class, 'current']);
        Route::post('/session/end', [SessionController::class, 'end']);
        Route::get('/measurements/summary', [MeasurementController::class, 'summary']);
        Route::get('/health-records', [MeasurementController::class, 'records']);
        Route::post('/measurements', [MeasurementController::class, 'store'])->middleware('throttle:60,1');
    });

Route::middleware(['auth:sanctum', 'verified'])
    ->post('/receipt/print', [ThermalReceiptController::class, 'print'])
    ->middleware('throttle:30,1');

Route::middleware('throttle:600,1')->group(function () {
    Route::get('/kiosk/live-vitals', [KioskLiveVitalsController::class, 'show']);
    Route::post('/kiosk/live-vitals', [KioskLiveVitalsController::class, 'store']);
    Route::get('/kiosk/command', [KioskLiveVitalsController::class, 'command']);
    Route::post('/kiosk/command', [KioskLiveVitalsController::class, 'setCommand']);
});
