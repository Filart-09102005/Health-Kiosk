/**
 * Client mirror of app/Support/MeasurementRanges.php — change both together.
 *
 * The server is the authority; these exist so the form can reject a typo
 * inline instead of making the user wait for a round trip to find out.
 *
 * Both modes share one set of bounds. They answer only "could a real device
 * have displayed this?" — wide enough to admit any plausible reading, since
 * the person typing cannot predict which values the form will accept. Whether
 * a reading is concerning is decided by the admin thresholds server-side, which
 * flag rather than block.
 *
 * One difference in shape worth knowing: PHP keys its bounds by request field
 * (`value` / `secondary_value`) so violations map onto validation errors,
 * while these are keyed by metric key (`primary` / `secondary`) to line up
 * with `config.metrics` and the live sensor payload the UI already renders.
 * The flow shell maps primary → value and secondary → secondary_value when it
 * saves, exactly as it already did for sensor readings.
 */

const SMART_RANGES = {
    heart_rate: {
        primary: { min: 25, max: 250 },
        secondary: { min: 50, max: 100 },
    },
    temperature: {
        primary: { min: 25, max: 45 },
    },
    height: {
        primary: { min: 50, max: 250 },
    },
    weight: {
        primary: { min: 1, max: 250 },
    },
};

// Intentionally empty — manual entry is held to the same bounds as the sensors.
// Kept as an extension point for a future device that genuinely needs its own
// limit. See the PHP file for the reasoning.
const MANUAL_OVERRIDES = {};

export function rangesFor(mode, type) {
    const base = SMART_RANGES[type] || {};

    if (mode !== "manual") return base;

    const overrides = MANUAL_OVERRIDES[type] || {};
    const merged = {};

    Object.entries(base).forEach(([key, range]) => {
        merged[key] = { ...range, ...(overrides[key] || {}) };
    });

    return merged;
}

const formatBound = (bound) => (Number.isInteger(bound) ? String(bound) : bound.toFixed(1));

/**
 * Validate raw form input against a range set.
 *
 * @param ranges  Output of rangesFor().
 * @param metrics config.metrics — drives which fields are required and how
 *                each one is labelled.
 * @param values  { [metricKey]: string } straight from the inputs.
 * @returns { [metricKey]: string } — empty when everything is valid.
 */
export function validateMeasurementValues(ranges, metrics, values) {
    const errors = {};

    metrics.forEach((metric) => {
        const raw = values?.[metric.key];
        const label = metric.label || metric.key;

        if (raw === undefined || raw === null || String(raw).trim() === "") {
            errors[metric.key] = `${label} is required.`;
            return;
        }

        const number = Number(raw);

        if (!Number.isFinite(number)) {
            errors[metric.key] = `${label} must be a number.`;
            return;
        }

        const range = ranges?.[metric.key];
        if (!range) return;

        if (number < range.min || number > range.max) {
            errors[metric.key] = `${label} must be between ${formatBound(range.min)} and ${formatBound(range.max)} ${metric.unit}.`;
        }
    });

    return errors;
}
