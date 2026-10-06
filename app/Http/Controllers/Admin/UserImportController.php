<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\RegisteredUserImport;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Validation\ValidationException;

class UserImportController extends Controller
{
    public function import(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\User::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'], // 10MB limit
            'role' => ['required', 'string', 'in:student,personnel'],
        ]);

        $role = $request->input('role');
        $import = new RegisteredUserImport($role);

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Unlikely to hit this since we catch per row in our ToCollection, 
            // but just in case we use WithValidation later.
            throw ValidationException::withMessages([
                'file' => 'The uploaded file contains structural errors.',
            ]);
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'file' => 'Failed to process the Excel file. Please ensure it uses the correct format. ' . $e->getMessage(),
            ]);
        }

        $results = $import->getResults();

        ActivityLog::record('admin_user_import', $request->user(), $request, "Admin imported {$results['successful']} {$role}s from Excel.", [
            'successful' => $results['successful'],
            'already_registered' => $results['already_registered'],
            'wrong_role' => $results['wrong_role'],
            'invalid_data' => $results['invalid_data'],
        ]);

        return response()->json([
            'message' => 'Import process completed.',
            'results' => $results,
        ]);
    }
}
