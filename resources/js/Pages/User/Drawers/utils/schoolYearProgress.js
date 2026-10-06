/**
 * Groups a student's health records into academic years for the School-Year
 * Progress section.
 *
 * Pure functions over the records the drawer has already fetched — no new
 * endpoint, and no duplication of the backend's status logic: a record's
 * `status` is whatever HealthEvaluationService already decided.
 *
 * Two rules run through all of this:
 *
 *  - Nothing is invented. A year with no records is reported as having none,
 *    never back-filled from its neighbours.
 *  - Growth and vitals are measured differently. Height and weight are growth
 *    measurements, so a year is represented by its LATEST valid reading, not an
 *    average of readings taken while the student was still growing. Heart rate,
 *    SpO2 and temperature are screenings, so those are averaged.
 */

/**
 * Same status palette the drawer uses. Lives here rather than being imported
 * from HealthRecordsDrawer so the new section does not create a circular
 * import back into its own parent.
 */
export const statusTone = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "alert") return "var(--color-error)";
    if (value === "watch") return "var(--color-warning)";
    if (value === "normal") return "var(--color-success)";
    return "var(--color-muted)";
};

/** Records still missing measurements must not skew growth or averages. */
export const isCompletedRecord = (record) =>
    Boolean(record) && String(record.status || "").toLowerCase() !== "incomplete";

/**
 * A metric is usable only when it is a real positive number. Zero and negative
 * readings mean the sensor produced nothing, not that the value is zero.
 */
export const metricValue = (record, key) => {
    const value = Number(record?.[key]);
    return Number.isFinite(value) && value > 0 ? value : null;
};

/** "S.Y. 2026 - 2027" → 2026, used for ordering and gap detection. */
export const schoolYearStart = (schoolYear) => {
    const match = String(schoolYear || "").match(/(\d{4})/);
    return match ? Number(match[1]) : null;
};

export const formatSchoolYear = (start) => `S.Y. ${start} - ${start + 1}`;

const average = (values) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

/**
 * Latest and first valid readings for a growth metric within one year.
 * `records` must already be sorted oldest → newest.
 */
function growthFor(records, key) {
    const valid = records
        .filter(isCompletedRecord)
        .map((record) => ({ record, value: metricValue(record, key) }))
        .filter((entry) => entry.value !== null);

    if (!valid.length) return { value: null, first: null, delta: null, samples: 0 };

    const first = valid[0].value;
    const value = valid[valid.length - 1].value;

    return {
        value,
        first,
        // Only meaningful once there are two readings to compare.
        delta: valid.length > 1 ? value - first : null,
        samples: valid.length,
        latestRecord: valid[valid.length - 1].record,
    };
}

function vitalFor(records, key) {
    const values = records
        .filter(isCompletedRecord)
        .map((record) => metricValue(record, key))
        .filter((value) => value !== null);

    return { value: average(values), samples: values.length };
}

/**
 * The academic level to show against a year.
 *
 * Taken from the records themselves (each carries the level it was saved at),
 * preferring the most recent one. Never derived from the year number — that
 * assumption is what previously labelled every record "4th Year College".
 */
function levelForRecords(records) {
    for (let i = records.length - 1; i >= 0; i -= 1) {
        const level = records[i]?.academic_level;
        if (level) return level;
    }
    return null;
}

/**
 * @param {Array} records  Formatted records from the drawer.
 * @returns {Array} One entry per academic year, oldest first. Years between the
 *                  first and last with no records are included with
 *                  `hasData: false` so the gap is visible rather than silently
 *                  collapsed — but no year is ever added after the last one on
 *                  file, so a graduated student gets no phantom extra year.
 */
export function buildSchoolYearGroups(records = []) {
    const byYear = new Map();

    records.forEach((record) => {
        const start = schoolYearStart(record.school_year);
        if (start === null) return;

        if (!byYear.has(start)) byYear.set(start, []);
        byYear.get(start).push(record);
    });

    if (byYear.size === 0) return [];

    const starts = [...byYear.keys()].sort((a, b) => a - b);
    const earliest = starts[0];
    const latest = starts[starts.length - 1];
    const groups = [];

    for (let start = earliest; start <= latest; start += 1) {
        const yearRecords = (byYear.get(start) || [])
            .slice()
            .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

        if (!yearRecords.length) {
            groups.push({
                key: `sy-${start}`,
                start,
                schoolYear: formatSchoolYear(start),
                level: null,
                hasData: false,
                records: [],
                totalVisits: 0,
                screenings: 0,
                incompleteCount: 0,
                growth: { height: null, weight: null, bmi: null },
                vitals: { heart_rate: null, spo2: null, temperature: null },
            });
            continue;
        }

        const completed = yearRecords.filter(isCompletedRecord);
        const height = growthFor(yearRecords, "height");
        const weight = growthFor(yearRecords, "weight");

        // Prefer the BMI already stored on the record the height/weight came
        // from; only compute when that record has none.
        let bmi = growthFor(yearRecords, "bmi");
        if (bmi.value === null && height.value && weight.value) {
            const computed = weight.value / ((height.value / 100) ** 2);
            bmi = { value: Number(computed.toFixed(2)), first: null, delta: null, samples: 1 };
        }

        groups.push({
            key: `sy-${start}`,
            start,
            schoolYear: formatSchoolYear(start),
            level: levelForRecords(yearRecords),
            hasData: true,
            records: yearRecords,
            totalVisits: yearRecords.length,
            screenings: completed.length,
            incompleteCount: yearRecords.length - completed.length,
            growth: { height, weight, bmi },
            vitals: {
                heart_rate: vitalFor(yearRecords, "heart_rate"),
                spo2: vitalFor(yearRecords, "spo2"),
                temperature: vitalFor(yearRecords, "temperature"),
            },
        });
    }

    return groups;
}
