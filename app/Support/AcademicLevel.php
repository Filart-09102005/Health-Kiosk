<?php

namespace App\Support;

use App\Models\User;
use DateTimeInterface;

/**
 * Academic labelling, in one place.
 *
 * Mirrors deriveAcademicLevel() in the Health Records drawer so a record shows
 * the same label whether it was stamped at save time or resolved in the client.
 */
class AcademicLevel
{
    /**
     * The level to stamp on a record being saved now.
     *
     * Returns null when the account has no academic fields — callers show
     * nothing rather than inventing a level.
     */
    public static function forUser(?User $user): ?string
    {
        if (! $user) {
            return null;
        }

        $department = strtoupper((string) $user->department);
        $yearLevel = trim((string) $user->year_level);

        if ($yearLevel !== '') {
            return $department === 'COLLEGE' && ! preg_match('/college/i', $yearLevel)
                ? $yearLevel.' College'
                : $yearLevel;
        }

        $gradeLevel = trim((string) $user->grade_level);

        if ($gradeLevel === '') {
            return null;
        }

        // Suffix comes from the grade number itself, not from a lookup table.
        if (preg_match('/\d+/', $gradeLevel, $matches)) {
            $grade = (int) $matches[0];

            if ($grade >= 11) {
                return $gradeLevel.' (SHS)';
            }

            if ($grade >= 7) {
                return $gradeLevel.' (JHS)';
            }
        }

        return $gradeLevel;
    }

    /**
     * Philippine school year containing the given date. The year rolls over in
     * July, so August 2026 belongs to S.Y. 2026 - 2027.
     */
    public static function schoolYearFor(?DateTimeInterface $date = null): string
    {
        $date ??= now();
        $year = (int) $date->format('Y');
        $month = (int) $date->format('n');

        return $month >= 7
            ? sprintf('S.Y. %d - %d', $year, $year + 1)
            : sprintf('S.Y. %d - %d', $year - 1, $year);
    }
}
