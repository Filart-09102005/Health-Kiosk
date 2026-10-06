<?php

namespace App\Support;

/**
 * Which departments belong to which kind of account.
 *
 * Mirrors resources/js/Global/departments.js — change both together. The forms
 * only offer the right list, but the rule is enforced here as well: a request
 * that pairs a member of staff with a student cohort files them in the wrong
 * place in every report and chart afterwards, and nothing downstream can tell.
 */
class Departments
{
    public const STUDENT = ['COLLEGE', 'BED'];

    public const STAFF = ['COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP'];

    /** Every role that is not a student is staff, whatever it is called. */
    public static function isStaffRole(?string $role): bool
    {
        return strtolower((string) $role) !== 'student';
    }

    /** @return array<int, string> */
    public static function forRole(?string $role): array
    {
        return self::isStaffRole($role) ? self::STAFF : self::STUDENT;
    }

    public static function allowed(?string $role, ?string $department): bool
    {
        return in_array(strtoupper(trim((string) $department)), self::forRole($role), true);
    }

    /** The one a role falls back to when a caller genuinely has none. */
    public static function defaultFor(?string $role): string
    {
        return self::isStaffRole($role) ? 'NTP' : 'COLLEGE';
    }
}
