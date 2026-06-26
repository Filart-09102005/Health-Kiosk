# Health Kiosk System

Health Kiosk System is a Laravel and React based kiosk application for school health screening. It supports student and teacher registration, email and barcode login, guided health measurements, AI voice assistance for users, admin monitoring, analytics, reports, activity logs, and thermal receipt printing.

## Project Stack

- Backend: Laravel
- Frontend: React with Vite
- Styling: Tailwind CSS and custom CSS variables
- Authentication: Laravel Sanctum with email verification
- Local printing: Thermal receipt print endpoint and browser print support
- Voice guidance: Browser Web Speech API for offline-friendly assistant mode

## Main Modules

- User registration and login
- Barcode scanner login
- User dashboard
- Guided health measurement flow
- Health results and receipt printing
- User health records
- Admin dashboard
- Admin health records
- Measurement analytics
- Health alerts
- Reports
- Devices and sensors monitoring
- Kiosk sessions
- Activity logs
- Admin settings and profile

## Data Collected and Processed

Detailed database structure and relationships are documented in [docs/ERD.md](docs/ERD.md).

### 1. User Data

The system stores basic account and school identity data for students, teachers, and administrators.

| Data | Project Field |
| --- | --- |
| First name | `firstname` |
| Last name | `lastname` |
| Age | `age` |
| Gender | `gender` |
| Email address | `email` |
| School ID | `student_id` |
| Password | `password` |
| Role | `role` |
| Department | `department` |
| Barcode UID | `barcode` |

Additional academic fields may also be stored when applicable:

- `grade_level`
- `strand`
- `year_level`
- `program`
- `is_active`

### 2. Health Measurement Data

The kiosk records health readings from the measurement flow and synchronizes them into a health record.

| Data | Project Field |
| --- | --- |
| Heart rate | `heart_rate` |
| SpO2 | `spo2` |
| Body temperature | `temperature` |
| Height | `height` |
| Weight | `weight` |
| BMI | `bmi` |
| Health status | `health_status` |

Measurement attempts are stored per kiosk session using `session_measurements`. The Heart Rate and SpO2 reading uses the pulse oximeter sensor.

### 3. Login and Verification Data

The system supports email/password login and barcode scanner login.

| Data | Project Field |
| --- | --- |
| Email address | `email` |
| Password | `password` |
| Barcode UID | `barcode` |
| Email verification status | `email_verified_at` |
| Remember token | `remember_token` |

Barcode login is rate-limited and is available only for verified student and teacher accounts. Admin accounts use email and password login.

### 4. Health Record Data

Health records summarize a user's completed or incomplete kiosk session.

| Data | Project Field |
| --- | --- |
| User ID | `user_id` |
| Kiosk session ID | `kiosk_session_id` |
| Measurement results | `heart_rate`, `spo2`, `temperature`, `height`, `weight`, `bmi` |
| Date and time of measurement | `created_at`, `updated_at` |
| Status of record | `health_status` |
| Missing measurements | `missing_measurements` |

Health records are connected to the user and the active kiosk session for accountability and printing.

### 5. Admin Monitoring Data

The admin side displays operational and clinical data for monitoring the kiosk.

- User records
- Health records
- Health alerts
- Kiosk sessions
- Measurement analytics
- Generated reports
- Devices and sensors status
- Activity logs

Admin tables use pagination with a limit of 15 rows per page.

### 6. System-Generated Data

The system generates operational records and summaries during kiosk use.

| Data | Purpose |
| --- | --- |
| Health summary | User-facing result summary and advice |
| BMI result | Computed from height and weight |
| Thermal receipt data | Printable health result receipt |
| Activity logs | Admin and system audit trail |
| Report files | Generated clinic reports and exports |
| Session records | Login, measurement, completion, logout, and timeout tracking |

## Kiosk Hardware and Sensors

The system is designed around the actual Health Kiosk hardware:

- Mega Board: Arduino Mega 2560 main controller board
- Barcode Scanner: student and teacher barcode scanner
- Temperature Sensor: infrared body temperature module
- Heart Rate and SpO2 Sensor: MAX30102 pulse oximeter module
- Height Sensor: ultrasonic distance measurement module
- Weight Sensor: load cell and HX711 scale module
- User Presence Detection: camera-based user detection service
- Mini PC / Server: Laravel application and database host

## AI Assistant Mode

AI Assistant Mode is a lightweight voice-guided kiosk assistant for first-time users. It is not a chatbot and does not use cloud AI APIs.

- Uses browser SpeechSynthesis when available
- Works on localhost
- Offline-friendly whenever the browser voice engine is available
- Provides event-based voice instructions for login, measurement steps, results, printing, records, profile, appearance, and logout
- Applies only to the user kiosk side, not the admin side

## Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev
php artisan serve
```

## Build

```bash
npm run build
```

## Repository

GitHub repository:

```text
https://github.com/Filart-09102005/Health_Kiosk.git
```
