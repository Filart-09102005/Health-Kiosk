# Health Kiosk System ERD

This document describes the Entity Relationship Diagram for the Health Kiosk System based on the current Laravel migrations and models.

## ERD Diagram

```mermaid
erDiagram
    USERS ||--o{ KIOSK_SESSIONS : starts
    USERS ||--o{ SESSION_MEASUREMENTS : owns
    USERS ||--o{ HEALTH_RECORDS : has
    USERS ||--o{ SESSION_ACTIVITIES : performs
    USERS ||--o{ ALERTS : receives
    USERS ||--o{ SETTINGS : owns
    USERS ||--o{ ACTIVITY_LOGS : creates

    KIOSK_SESSIONS ||--o{ SESSION_MEASUREMENTS : contains
    KIOSK_SESSIONS ||--|| HEALTH_RECORDS : summarizes
    KIOSK_SESSIONS ||--o{ SESSION_ACTIVITIES : logs
    KIOSK_SESSIONS ||--o{ ALERTS : triggers

    USERS {
        bigint id PK
        varchar firstname
        varchar lastname
        varchar student_id UK
        varchar email UK
        timestamp email_verified_at
        varchar password
        varchar role
        varchar department
        varchar grade_level
        varchar strand
        varchar year_level
        varchar program
        tinyint age
        varchar gender
        varchar barcode UK
        boolean is_active
        varchar remember_token
        timestamp created_at
        timestamp updated_at
    }

    KIOSK_SESSIONS {
        bigint id PK
        bigint user_id FK
        integer session_number
        varchar status
        timestamp started_at
        timestamp ended_at
        varchar login_method
        varchar ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    SESSION_MEASUREMENTS {
        bigint id PK
        bigint kiosk_session_id FK
        bigint user_id FK
        varchar type
        decimal value
        decimal secondary_value
        varchar unit
        integer attempt
        varchar status
        json metadata
        timestamp measured_at
        timestamp created_at
        timestamp updated_at
    }

    HEALTH_RECORDS {
        bigint id PK
        bigint kiosk_session_id FK_UK
        bigint user_id FK
        decimal heart_rate
        decimal spo2
        decimal temperature
        decimal height
        decimal weight
        decimal bmi
        varchar bmi_category
        varchar health_status
        json missing_measurements
        text advice
        timestamp created_at
        timestamp updated_at
    }

    SESSION_ACTIVITIES {
        bigint id PK
        bigint kiosk_session_id FK
        bigint user_id FK
        varchar action
        text description
        json metadata
        timestamp created_at
        timestamp updated_at
    }

    ALERTS {
        bigint id PK
        bigint user_id FK
        bigint kiosk_session_id FK
        varchar type
        varchar severity
        varchar title
        text message
        timestamp read_at
        timestamp created_at
        timestamp updated_at
    }

    SETTINGS {
        bigint id PK
        bigint user_id FK
        varchar key
        json value
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITY_LOGS {
        bigint id PK
        bigint user_id FK
        varchar action
        text description
        varchar ip_address
        text user_agent
        json metadata
        timestamp created_at
        timestamp updated_at
    }

    PASSWORD_RESET_TOKENS {
        varchar email PK
        varchar token
        timestamp created_at
    }

    SESSIONS {
        varchar id PK
        bigint user_id FK
        varchar ip_address
        text user_agent
        longtext payload
        integer last_activity
    }

    PERSONAL_ACCESS_TOKENS {
        bigint id PK
        varchar tokenable_type
        bigint tokenable_id
        varchar name
        varchar token UK
        text abilities
        timestamp last_used_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
```

## Entity Details

### users

Stores all registered kiosk accounts, including students, teachers, and administrators.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique user identifier. |
| `firstname` | string | Required | User first name. |
| `lastname` | string | Required | User last name. |
| `student_id` | string | Unique, nullable | School ID. Used for student or teacher identity. |
| `email` | string | Unique | Login email address. |
| `email_verified_at` | timestamp | Nullable | Email verification status. Null means not verified. |
| `password` | string | Required | Hashed account password. |
| `role` | string | Indexed | User role, such as `student`, `teacher`, or `admin`. |
| `department` | string | Indexed, nullable | Department or school group. |
| `grade_level` | string | Nullable | BED grade level when applicable. |
| `strand` | string | Nullable | BED strand when applicable. |
| `year_level` | string | Nullable | College year level when applicable. |
| `program` | string | Nullable | College program when applicable. |
| `age` | unsigned tiny integer | Nullable | User age. |
| `gender` | string | Nullable | User gender. |
| `barcode` | string | Unique, nullable | Barcode UID used by the barcode scanner login. |
| `is_active` | boolean | Indexed | Enables or blocks account access. |
| `remember_token` | string | Nullable | Laravel remember token. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Important indexes:

- `student_id` unique
- `email` unique
- `barcode` unique
- `role`
- `department`
- `created_at`
- Composite index on `role`, `department`, `created_at`

Relationships:

- One user has many kiosk sessions.
- One user has many session measurements.
- One user has many health records.
- One user has many session activities.
- One user has many alerts.
- One user has many settings.
- One user has many activity logs.

### kiosk_sessions

Stores each kiosk visit from login to logout, timeout, or completion.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique kiosk session identifier. |
| `user_id` | bigint | Foreign Key | References `users.id`. |
| `session_number` | unsigned integer | Composite Unique | User-specific session number. |
| `status` | string | Indexed | Session state, such as `active`, `completed`, or ended. |
| `started_at` | timestamp | Indexed | Session start time. |
| `ended_at` | timestamp | Nullable | Session end time. |
| `login_method` | string | Nullable | Login source, such as `email` or `barcode`. |
| `ip_address` | string | Nullable | Client IP address. |
| `user_agent` | text | Nullable | Browser or device user agent. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints and indexes:

- `user_id` references `users.id` with cascade delete.
- Unique composite key: `user_id`, `session_number`.
- Composite index: `user_id`, `status`, `created_at`.

Relationships:

- A kiosk session belongs to one user.
- A kiosk session has many session measurements.
- A kiosk session has one health record.
- A kiosk session has many session activities.
- A kiosk session may have many alerts.

### session_measurements

Stores raw or per-attempt measurement readings captured during a kiosk session.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique measurement row. |
| `kiosk_session_id` | bigint | Foreign Key | References `kiosk_sessions.id`. |
| `user_id` | bigint | Foreign Key | References `users.id`. |
| `type` | string | Indexed | Measurement type, such as `heart_rate`, `temperature`, `height`, or `weight`. |
| `value` | decimal(8,2) | Nullable | Main measurement value. |
| `secondary_value` | decimal(8,2) | Nullable | Secondary value, used for SpO2 when heart rate and SpO2 are captured together. |
| `unit` | string(20) | Nullable | Measurement unit, such as `bpm`, `%`, `C`, `cm`, or `kg`. |
| `attempt` | unsigned integer | Default 1 | Attempt number for repeat measurements. |
| `status` | string | Indexed | Measurement status, default `successful`. |
| `metadata` | json | Nullable | Extra sensor or workflow details. |
| `measured_at` | timestamp | Indexed | Actual measurement timestamp. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints and indexes:

- `kiosk_session_id` references `kiosk_sessions.id` with cascade delete.
- `user_id` references `users.id` with cascade delete.
- Composite index: `kiosk_session_id`, `type`, `created_at`.
- Composite index: `user_id`, `type`, `created_at`.

Measurement examples:

- Heart Rate and SpO2: `type = heart_rate`, `value = heart_rate`, `secondary_value = spo2`.
- Temperature: `type = temperature`, `value = body temperature`.
- Height: `type = height`, `value = standing height`.
- Weight: `type = weight`, `value = body weight`.

### health_records

Stores the summarized health result for one kiosk session.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique health record identifier. |
| `kiosk_session_id` | bigint | Foreign Key, Unique | References one kiosk session. One session has one summary record. |
| `user_id` | bigint | Foreign Key | References `users.id`. |
| `heart_rate` | decimal(8,2) | Nullable | Latest heart rate reading. |
| `spo2` | decimal(8,2) | Nullable | Latest blood oxygen reading. |
| `temperature` | decimal(8,2) | Nullable | Latest body temperature reading. |
| `height` | decimal(8,2) | Nullable | Latest height reading. |
| `weight` | decimal(8,2) | Nullable | Latest weight reading. |
| `bmi` | decimal(8,2) | Nullable | Calculated BMI. |
| `bmi_category` | string | Nullable | BMI category, such as normal, underweight, overweight, or obese. |
| `health_status` | string | Indexed | Health result status, default `Incomplete`. |
| `missing_measurements` | json | Nullable | Measurements not yet completed. |
| `advice` | text | Nullable | Generated health advice shown to the user and printed on receipt. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints and indexes:

- `kiosk_session_id` references `kiosk_sessions.id` with cascade delete.
- `kiosk_session_id` is unique, so each kiosk session has only one health summary.
- `user_id` references `users.id` with cascade delete.
- Composite index: `user_id`, `health_status`, `created_at`.

Relationships:

- A health record belongs to one user.
- A health record belongs to one kiosk session.

### session_activities

Stores session-level timeline events for the kiosk flow.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique session activity identifier. |
| `kiosk_session_id` | bigint | Foreign Key | References `kiosk_sessions.id`. |
| `user_id` | bigint | Foreign Key, nullable | References `users.id`. Null allowed if user is deleted. |
| `action` | string | Indexed | Event action, such as `login`, `opened_temperature`, `calculated_bmi`, or `logout`. |
| `description` | text | Nullable | Human-readable event description. |
| `metadata` | json | Nullable | Extra event details. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints and indexes:

- `kiosk_session_id` references `kiosk_sessions.id` with cascade delete.
- `user_id` references `users.id` with null on delete.
- Composite index: `kiosk_session_id`, `created_at`.

### alerts

Stores health or system alerts shown on the admin side.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique alert identifier. |
| `user_id` | bigint | Foreign Key, nullable | Related user, if applicable. |
| `kiosk_session_id` | bigint | Foreign Key, nullable | Related kiosk session, if applicable. |
| `type` | string | Indexed | Alert category, such as clinical, device, or session alert. |
| `severity` | string | Indexed | Alert severity, default `info`. |
| `title` | string | Required | Alert title. |
| `message` | text | Nullable | Alert details. |
| `read_at` | timestamp | Nullable | When the alert was reviewed or marked read. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints:

- `user_id` references `users.id` with null on delete.
- `kiosk_session_id` references `kiosk_sessions.id` with null on delete.

### settings

Stores user-specific or system configuration values.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique settings row. |
| `user_id` | bigint | Foreign Key, nullable | Related user. Null can represent global settings. |
| `key` | string | Indexed | Setting key. |
| `value` | json | Nullable | Setting value. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Constraints:

- `user_id` references `users.id` with cascade delete.
- Unique composite key: `user_id`, `key`.

Current setting examples:

- Alert sensitivity
- Kiosk behavior settings
- User interface preferences

### activity_logs

Application audit log model used by authentication and admin controllers.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Unique activity log identifier. |
| `user_id` | bigint | Foreign Key, nullable | Related user. |
| `action` | string | Required | Audit action, such as `login_success`, `barcode_login_failed`, or `admin_dashboard_viewed`. |
| `description` | text | Nullable | Human-readable description. |
| `ip_address` | string | Nullable | Request IP address. |
| `user_agent` | text | Nullable | Browser or device user agent. |
| `metadata` | json | Nullable | Extra audit details. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

Note: The `ActivityLog` model and controllers reference this table. If the migration is missing in a local copy, add an `activity_logs` migration with the fields above before running a fresh database migration.

### password_reset_tokens

Laravel password reset token table.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `email` | string | Primary Key | Account email address. |
| `token` | string | Required | Password reset token. |
| `created_at` | timestamp | Nullable | Token creation time. |

### sessions

Laravel session storage table.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | string | Primary Key | Laravel session ID. |
| `user_id` | bigint | Indexed, nullable | Authenticated user ID. |
| `ip_address` | string | Nullable | Session IP address. |
| `user_agent` | text | Nullable | Browser or device user agent. |
| `payload` | longtext | Required | Serialized session payload. |
| `last_activity` | integer | Indexed | Last session activity timestamp. |

### personal_access_tokens

Laravel Sanctum API token table.

| Column | Type | Key | Description |
| --- | --- | --- | --- |
| `id` | bigint | Primary Key | Token row identifier. |
| `tokenable_type` | string | Indexed | Model class that owns the token. |
| `tokenable_id` | bigint | Indexed | Model ID that owns the token. |
| `name` | string | Required | Token name. |
| `token` | string | Unique | Hashed token value. |
| `abilities` | text | Nullable | Token abilities. |
| `last_used_at` | timestamp | Nullable | Last use time. |
| `expires_at` | timestamp | Nullable | Token expiry. |
| `created_at`, `updated_at` | timestamp |  | Record timestamps. |

## Relationship Summary

| Parent | Relationship | Child | Cardinality | Delete Behavior |
| --- | --- | --- | --- | --- |
| `users` | starts | `kiosk_sessions` | One-to-many | Cascade delete sessions when user is deleted. |
| `users` | owns | `session_measurements` | One-to-many | Cascade delete measurements when user is deleted. |
| `users` | owns | `health_records` | One-to-many | Cascade delete health records when user is deleted. |
| `users` | performs | `session_activities` | One-to-many | Set `user_id` to null when user is deleted. |
| `users` | receives | `alerts` | One-to-many | Set `user_id` to null when user is deleted. |
| `users` | owns | `settings` | One-to-many | Cascade delete settings when user is deleted. |
| `users` | creates | `activity_logs` | One-to-many | Expected nullable user reference. |
| `kiosk_sessions` | contains | `session_measurements` | One-to-many | Cascade delete measurements when session is deleted. |
| `kiosk_sessions` | summarizes | `health_records` | One-to-one | Cascade delete health record when session is deleted. |
| `kiosk_sessions` | logs | `session_activities` | One-to-many | Cascade delete activities when session is deleted. |
| `kiosk_sessions` | triggers | `alerts` | One-to-many | Set `kiosk_session_id` to null when session is deleted. |

## Data Flow

1. A student or teacher registers with user information, school ID, department, and barcode UID.
2. The user verifies their email before accessing kiosk functions.
3. The user logs in using email/password or barcode scanner.
4. A new `kiosk_sessions` record is created with the login method.
5. The kiosk records each measurement attempt in `session_measurements`.
6. The measurement service synchronizes the latest readings into one `health_records` row for the session.
7. BMI, BMI category, health status, missing measurements, and advice are calculated.
8. Session activities are stored in `session_activities`.
9. Alerts may be generated for abnormal readings, incomplete sessions, or system conditions.
10. The admin dashboard reads users, health records, alerts, sessions, analytics, reports, and logs.
11. The receipt printer uses health record and user data to generate printable thermal receipt data.

## Important Business Rules

- A user can have many kiosk sessions.
- A kiosk session belongs to exactly one user.
- A kiosk session can have many measurement attempts.
- A kiosk session has only one summarized health record.
- A health record can be complete or incomplete.
- Repeat checks are allowed because each measurement attempt is stored and the health record uses the latest values.
- Barcode login is only allowed for verified student and teacher accounts.
- Admin users use email and password login.
- Admin-side monitoring includes records, alerts, sessions, analytics, reports, devices, and activity logs.
- AI Assistant Mode is a user-side guidance feature only and does not create chatbot records.
