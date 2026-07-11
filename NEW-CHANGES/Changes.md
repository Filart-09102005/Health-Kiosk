# Health Kiosk Capstone - Change Log

## Date: July 9, 2026

### Feature: Registration Form & User Model Updates (Earlier)

#### 1. Database & Migrations
- **Created Migration**: `2026_07_09_084021_replace_age_with_birthday_in_users_table.php`
- **Updated Table**: `users`
  - Replaced the manual `age` column with a `birthday` date column.

#### 2. Backend (Models & Controllers)
- **Updated Model**: `App\Models\User.php`
  - Added `birthday` to `$fillable`.
  - Removed `age` from `$fillable`.
  - Added an automatic accessor `getAgeAttribute` to compute age dynamically from the `birthday` relative to the current year.
- **Updated Request Validation**: `App\Http\Requests\Auth\RegisterRequest.php`
  - Updated rules to validate `birthday` as a date.
- **Updated Controller**: `App\Http\Controllers\AuthController.php`
  - Modified the registration logic to accept `birthday` instead of `age`.

#### 3. Frontend (React / Inertia)
- **Updated Component**: `resources/js/Pages/Auth/Register.jsx`
  - Rebuilt the form state to replace the manual Age input with a Birthday date picker field.
  - Added explicit placeholders for First Name and Last Name.
  - Updated Department options to accurately reflect the institution: `College`, `BED (Basic Education Department)`, and `NTP (Non-Teaching Personnel)`.
- **Updated Component**: `resources/js/Pages/Auth/components/RoleSelector.jsx`
  - Changed the "Teacher" role label to "Personnel" to represent both teaching and non-teaching staff.

---

### Feature: Health Alerts Resolve Workflow
- **Created Migration**: `2026_07_09_105047_add_resolution_fields_to_alerts_table.php`
- **Updated Table**: `alerts`
  - Added `new_measurement` (nullable string)
  - Added `resolution_notes` (nullable text)
  - Added `resolved_by` (nullable foreignId referencing `users.id`)

### 2. Backend (Models & Controllers)
- **Updated Model**: `App\Models\Alert.php`
  - Added `new_measurement`, `resolution_notes`, and `resolved_by` to the `$fillable` array.
  - Added `resolvedBy()` relationship mapping to the `User` model.
- **Updated Controller**: `App\Http\Controllers\Admin\AlertController.php`
  - Created `resolve()` method to handle validation and saving of resolution data.
  - Updated `index()` and `queue()` methods to join the `resolver` user and return `newMeasurement`, `resolutionNotes`, and `reviewedBy` (staff's full name) in the JSON payload.
- **Added Route**: `routes/api.php`
  - Added `Route::post('/alerts/{id}/resolve', [AlertController::class, 'resolve']);`

### 3. Frontend (React / Inertia)
- **Updated API Service**: `resources/js/Pages/Auth/services/authService.js`
  - Added `resolveAlert(id, payload)` wrapper to hit the new resolve endpoint.
- **Updated Component**: `resources/js/Pages/Admin/Alerts/components/AlertsTable.jsx`
  - Added "New Measurement" to the table headers.
- **Updated Component**: `resources/js/Pages/Admin/Alerts/components/AlertTableRow.jsx`
  - Added a new `<td>` to display the `newMeasurement` if the alert status is "Resolved", otherwise displays `—`.
- **New Component**: `resources/js/Pages/Admin/Alerts/components/AlertResolutionForm.jsx`
  - Created a form component with "New Measurement Value" and "Resolution Notes" fields.
  - Includes validation, error handling, and API integration.
  - When the alert is already resolved, it renders a read-only detailed view instead of input fields.
- **Updated Component**: `resources/js/Pages/Admin/Alerts/components/AlertDetailsDrawer.jsx`
  - Imported and embedded `<AlertResolutionForm />` at the bottom of the drawer.
  - Removed the old `ResolveAlertButton` placeholder component as the logic is now fully contained within the resolution form.

---

### Feature: Health Alert Analytics Integration into Data Analytics Page

#### 1. Backend (AnalyticsController.php)
- **Updated Controller**: `app/Http/Controllers/Admin/AnalyticsController.php`
  - Added `use Illuminate\Support\Facades\DB;` import.
  - Added `alert_analytics` key to the `__invoke` JSON response.
  - Added `alertAnalytics(Request $request): array` — queries the `alerts` table joined with `users`, `health_records`, and `kiosk_sessions`. Applies all existing global filters (date range, department, grade level, strand, year level, program, gender). Returns four sections:
    - `overview`: total, resolved, pending, resolution_rate.
    - `distribution`: per-type (temperature, heart_rate, spo2, bmi) breakdown with total, resolved, pending, recovery_rate.
    - `drill_down`: keyed by type, containing all student-level alert rows formatted for the AlertDetailsDrawer.
    - `recent_resolved`: last 20 resolved alerts with full resolution data.
  - Added `formatAlertForAnalytics(object $alert): array` — formats a raw DB row to match the `AlertDetailsDrawer` prop contract, enabling the existing drawer to be reused.
  - Added `originalMeasurementFromRecord(object $alert): string` — dynamically computes the original measurement value from the joined `health_records` fields. **No new database column was added.**

#### 2. Frontend (Analytics.jsx)
- **Updated Component**: `resources/js/Pages/Admin/Analytics/Analytics.jsx`
  - Added `Bell`, `CheckCircle` to lucide-react imports.
  - Added `AlertDetailsDrawer` import from `../Alerts/components/AlertDetailsDrawer`.
  - Added `alertTypeConfig` constant mapping type keys to label, color, and icon.
  - Added `drawerAlert` state to hold the alert object for the detail drawer.
  - Added `<AlertAnalyticsSection>` render block below the existing `FollowUpTable` section.
  - Added `<AlertDetailsDrawer>` portal at the root level of the page — reuses the existing drawer when "View Details" is clicked in any alert analytics table.
  - On `onResolved`, the drawer closes and the filter state is refreshed to re-fetch updated analytics.

#### 3. New Components (All inside Analytics.jsx)
- **AlertAnalyticsSection**: Main wrapper. Manages `selectedType` state for drill-down. Contains section header, overview cards, distribution chart, KPI sidebar, drill-down table, and resolved table.
- **AlertOverviewCards**: Renders 4 `SummaryCard` instances — Total Alerts, Pending Alerts, Resolved Alerts, Resolution Rate (%).
- **AlertDistributionChart**: Recharts `BarChart` with grouped bars (Resolved = green, Pending = amber) per alert type. Clicking a bar group opens the drill-down table.
- **AlertTypeKPICards**: Clickable cards per alert type showing Total / Resolved / Pending counts and Recovery Rate (%). Acts as an interactive legend synced with the chart selection.
- **AlertDrillDownTable**: Paginated table of all student alerts for the selected type. Includes Search (name/ID/department) and Status filter (All / Pending / Resolved). Each row has a "View Details" button that opens `AlertDetailsDrawer`.
- **AlertStatusPill**: Inline pill badge (green = Resolved, amber = Pending).
- **RecentlyResolvedTable**: Paginated table of the last 20 resolved alerts showing student, department, alert type, original measurement, new measurement, resolver, date, and a "View Details" action.

#### 4. Design Notes
- All filters (date range, academic level, department, grade level, strand, program, gender) apply to both measurement analytics AND alert analytics from the same request.
- No new API endpoint was created — alert data is appended to the existing `/api/admin/analytics` response.
- Original measurement values are computed dynamically from `health_records` (joined via `kiosk_session_id`). No migration required.

---

### Fix: Students Requiring Follow-Up — Alert-Driven Filter

#### Modified File
- **`app/Http/Controllers/Admin/AnalyticsController.php`** — `followUpStudents()` method

#### What Changed
Previously, the Follow-up table showed any student whose most recent `health_records` entry contained an abnormal reading (`needsFollowUp()` returned true), regardless of whether a clinic staff member had already resolved their health alert.

**New behavior:**
- Before filtering health records, a lookup set (`$pendingSet`) is built by querying the `alerts` table for all `user_id` values where `read_at IS NULL` (i.e., the alert is still pending).
- The `filter()` now uses a **dual condition**: `needsFollowUp($record) && isset($pendingSet[$record->user_id])`.
- A student only appears in the Follow-up table if they have **both** an abnormal measurement **and** at least one unresolved alert.
- As soon as all of a student's alerts are resolved (all `read_at` are set), they are automatically removed from the Follow-up table on the next data fetch.
- Resolved students now appear exclusively in the **Recently Resolved Alerts** section of the Alert Analytics below.

#### No Frontend Changes Required
The `FollowUpTable` React component is unchanged. The filtering logic is entirely server-side.

#### No Migration Required
No database columns were added or modified.

---

### Feature: System Integration Test & Real Reports Generation

#### 1. Setup & Dependencies
- Installed `barryvdh/laravel-dompdf` for server-side PDF generation.
- Installed `maatwebsite/excel` for server-side Excel generation.

#### 2. Comprehensive Test Dataset
- **New Seeder**: `CleanDemoDataSeeder` - Purges all old 21 dummy users while retaining the admin and default test accounts.
- **Rewritten Seeder**: `UserTestingSeeder` - Now generates ~250 users across College, BED, and NTP.
  - Spans 5-10 kiosk sessions per user across the last 60 days.
  - Implements randomized clinical data with automatic alert generation and resolution.
  - Contains edge case students (Scenario A, B, C, D) manually hardcoded to demonstrate specific workflow states.

#### 3. Backend (Controllers & Exports)
- **Updated Controller**: `ReportController.php`
  - Replaced the mockup JSON responses with functional `downloadPdf` and `downloadExcel` methods.
  - Filters are accurately mapped and passed to both export methods.
- **New Export Class**: `app/Exports/HealthReportExport.php`
  - Reuses the blade views by implementing `FromView` to generate perfectly matched Excel tables.
- **New Blade Views**: `resources/views/reports/pdf/`
  - `layout.blade.php`: The master styling and header showing applied filters.
  - `measurement_analytics.blade.php`: PDF view.
  - `alert_analytics.blade.php`: PDF view.
  - `follow_up.blade.php`: PDF view.
  - `recently_resolved.blade.php`: PDF view.

#### 4. Frontend (React)
- **Updated Component**: `Reports.jsx` & `ReportsTable.jsx`
  - Replaced the fake table listing with a cleanly designed 3-column table allowing selection of the 4 report types.
- **Updated Component**: `ReportTableRow.jsx`
  - Implemented direct href anchor tags for "PDF" and "Excel" downloads that serialize all selected UI filters into the URL query string.
- **Removed Component**: `ReportPreviewDrawer.jsx`
  - Removed as it was a mockup modal and no longer necessary since files are downloaded instantly.

---

### Feature: Final UX & Business Logic Fixes (Follow-up, UX, Downloads)

#### 1. Follow-up Business Logic Overhaul
- **Modified**: `app/Http/Controllers/Admin/AnalyticsController.php`
  - **Removed**: `needsFollowUp()` dependency.
  - **Updated**: `followUpStudents()` was completely rewritten. It now explicitly queries the `alerts` table for `read_at IS NULL` (pending), joins the specific `health_records` via `kiosk_session_id`, and builds the student rows.
  - **Logic**: If a student has multiple pending alerts, they are merged into one Follow-up row. Only the metrics associated with the pending alerts reflect the abnormal values; all other metrics default to `Normal`.

#### 2. Alert Resolution UX Background Refetch
- **Modified**: `resources/js/Pages/Admin/Alerts/Alert.jsx`
  - **Removed**: `window.location.reload();`
  - **Added**: Implemented a `refreshKey` state hook. When an alert is resolved via the `AlertDetailsDrawer`, it increments `refreshKey`, smoothly triggering a background `axios` refetch of the alerts without reloading the browser.

#### 3. Report Download Authentication Fix
- **Modified**: `resources/js/Pages/Auth/services/authService.js`
  - **Added**: `downloadReportPdf(params)` and `downloadReportExcel(params)` performing authenticated Axios requests with `responseType: "blob"`.
- **Modified**: `resources/js/Pages/Admin/Reports/components/ReportTableRow.jsx`
  - **Removed**: Unauthenticated `<a href>` links that caused the `Route [login] not defined` redirect error.
  - **Added**: Replaced with `<button>` elements. Clicking them triggers the new Axios blob requests, extracts the filename from the `Content-Disposition` header, and programmatically forces the browser to download the file natively while preserving the Sanctum session. Added loading spinners (`Loader2`) during download.
