<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\BarcodeCheckRequest;
use App\Http\Requests\Auth\BarcodeLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\Health\KioskSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $barcode = ($validated['barcode'] ?? null) ?: User::generateUniqueBarcode();

        $user = User::create([
            'firstname' => $validated['firstname'],
            'lastname' => $validated['lastname'],
            'student_id' => $validated['role'] === 'student' ? $barcode : null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'department' => $validated['department'],
            'age' => $validated['age'],
            'gender' => $validated['gender'],
            'barcode' => $barcode,
        ]);

        $user->sendEmailVerificationNotification();

        Cache::forget('admin.dashboard.counts');
        ActivityLog::record('register_success', $user, $request, 'User registered successfully.');

        return response()->json([
            'message' => 'Registration successful. Please check your email for the verification link.',
            'user' => $this->safeUser($user),
        ], 201);
    }

    public function login(LoginRequest $request, KioskSessionService $sessions): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');
        $candidate = User::where('email', $credentials['email'])->first();

        if (! Auth::attempt($credentials, $remember)) {
            ActivityLog::record(
                'login_failed',
                $candidate,
                $request,
                'Login failed.',
                ['email' => $credentials['email']]
            );

            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $request->session()->regenerate();
        $user = $request->user();

        if (! $user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            ActivityLog::record('login_failed', $user, $request, 'Login blocked because account is inactive.');

            return response()->json([
                'message' => 'This account is inactive. Please contact the clinic administrator.',
            ], 403);
        }

        if (! $user->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            ActivityLog::record('login_failed', $user, $request, 'Login blocked because email is not verified.');

            return response()->json([
                'message' => 'Please verify your email before logging in.',
            ], 403);
        }

        ActivityLog::record('login_success', $user, $request, 'User logged in successfully.');
        $session = $sessions->start($user, $request, 'email');

        return response()->json([
            'message' => 'Login successful.',
            'user' => $this->safeUser($user),
            'session' => [
                'id' => $session->id,
                'session_number' => $session->session_number,
            ],
            'redirect' => $user->isAdmin() ? '/admin/dashboard' : '/user/dashboard',
        ]);
    }

    public function barcodeLogin(BarcodeLoginRequest $request, KioskSessionService $sessions): JsonResponse
    {
        $barcode = $request->validated('barcode');
        $user = User::where('barcode', $barcode)->first();

        if (! $user) {
            ActivityLog::record('barcode_login_failed', null, $request, 'Barcode login failed.', [
                'barcode' => $barcode,
            ]);

            throw ValidationException::withMessages([
                'barcode' => ['Barcode was not found. Please scan a registered barcode or use email login.'],
            ]);
        }

        if ($user->isAdmin()) {
            throw ValidationException::withMessages([
                'barcode' => ['Admin accounts must use email and password login.'],
            ]);
        }

        if (! $user->is_active) {
            ActivityLog::record('barcode_login_failed', $user, $request, 'Barcode login blocked because account is inactive.');

            return response()->json([
                'message' => 'This account is inactive. Please contact the clinic administrator.',
            ], 403);
        }

        if (! $user->hasVerifiedEmail()) {
            ActivityLog::record('barcode_login_failed', $user, $request, 'Barcode login blocked because email is not verified.');

            return response()->json([
                'message' => 'Please verify your email before using barcode login.',
            ], 403);
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        ActivityLog::record('barcode_login_success', $user, $request, 'User logged in with barcode.');
        $session = $sessions->start($user, $request, 'barcode');

        return response()->json([
            'message' => 'Barcode login successful.',
            'user' => $this->safeUser($user),
            'session' => [
                'id' => $session->id,
                'session_number' => $session->session_number,
            ],
            'redirect' => $user->isAdmin() ? '/admin/dashboard' : '/user/dashboard',
        ]);
    }

    public function logout(Request $request, KioskSessionService $sessions): JsonResponse
    {
        $user = $request->user();

        ActivityLog::record('logout', $user, $request, 'User logged out.');
        if ($user) {
            $sessions->end($sessions->activeFor($user));
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->safeUser($request->user()),
        ]);
    }

    public function checkBarcode(BarcodeCheckRequest $request): JsonResponse
    {
        $barcode = $request->validated('barcode');
        $exists = User::where('barcode', $barcode)->exists();

        return response()->json([
            'available' => ! $exists,
            'message' => $exists
                ? 'This barcode is already registered.'
                : 'Barcode is available.',
        ]);
    }

    private function safeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'full_name' => $user->full_name,
            'student_id' => $user->student_id,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
            'role' => $user->role,
            'department' => $user->department,
            'age' => $user->age,
            'gender' => $user->gender,
            'barcode' => $user->barcode,
            'is_active' => $user->is_active,
        ];
    }
}
