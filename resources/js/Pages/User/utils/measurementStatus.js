/**
 * Shared reading of `measurement_statuses` from the API.
 *
 * The server (HealthEvaluationService) is the only thing that decides whether a
 * reading is Normal / Watch / Alert. Every screen that colours a reading goes
 * through here so the dashboard, the session summary and the results screen
 * cannot disagree — they did before, when the dashboard coloured purely on
 * "a value exists" and showed an out-of-range 34 °C in success green.
 */

/** Grades the server actually produces, worst first. */
const SEVERITY_ORDER = ["Consult Clinic", "Alert", "Watch", "Normal"];

export const MEASUREMENT_TONES = {
    "Consult Clinic": { color: "var(--color-error)", label: "Consult Clinic", graded: true },
    Alert: { color: "var(--color-error)", label: "Alert", graded: true },
    Watch: { color: "var(--color-warning)", label: "Watch", graded: true },
    Normal: { color: "var(--color-success)", label: "Normal", graded: true },
};

/** A reading is present but the server does not grade it (height, weight). */
export const UNGRADED_TONE = { color: "var(--color-primary)", label: "", graded: false };

/** No reading captured yet. */
export const IDLE_TONE = { color: "var(--color-muted)", label: "Idle", graded: false };

/** Per-metric accent, used for icons and card rails. */
export const METRIC_ACCENTS = {
    heart_rate: "var(--health-heart-rate)",
    spo2: "var(--health-spo2)",
    temperature: "var(--health-temperature)",
    height: "var(--health-height)",
    weight: "var(--health-weight)",
    bmi: "var(--health-bmi)",
};

export const accentFor = (key) => METRIC_ACCENTS[key] || "var(--color-primary)";

/** Worst grade among the given statuses, or undefined if none are graded. */
export const worstStatus = (...statuses) => SEVERITY_ORDER.find((rank) => statuses.includes(rank));

/**
 * Status string for a card key. The heart rate card renders SpO2 alongside the
 * pulse, so it reports whichever of the two is worse.
 */
export const statusFor = (key, statuses) =>
    key === "heart_rate" ? worstStatus(statuses?.heart_rate, statuses?.spo2) : statuses?.[key];

/**
 * Tone for a card.
 *
 * `hasValue` is passed in rather than inferred because each screen already
 * knows how it defines "captured" (the heart rate card needs both pulse and
 * SpO2, BMI needs height and weight).
 *
 * Height and weight are never graded by the server, so they resolve to the
 * neutral UNGRADED_TONE — success green is reserved for readings the server
 * actually judged clinically normal.
 */
export const toneFor = (key, statuses, hasValue = true) => {
    if (!hasValue) return IDLE_TONE;
    return MEASUREMENT_TONES[statusFor(key, statuses)] || UNGRADED_TONE;
};

/** Tone for the overall `health_status` on a record. */
export const HEALTH_STATUS_TONES = {
    Normal: {
        color: "var(--color-success)",
        headline: "Normal",
        blurb: "Your readings are within the expected range.",
    },
    Watch: {
        color: "var(--color-warning)",
        headline: "Watch",
        blurb: "One or more readings sit outside the usual range. Rest, hydrate and consider a recheck.",
    },
    Alert: {
        color: "var(--color-error)",
        headline: "Alert",
        blurb: "One or more readings need attention. Please see the clinic staff for a review.",
    },
    // The server's HealthEvaluationService emits "Consult Clinic" (not "Alert")
    // for the overall status; without this entry it fell through to Incomplete.
    "Consult Clinic": {
        color: "var(--color-error)",
        headline: "Consult Clinic",
        blurb: "One or more readings need attention. Please see the clinic staff for a review.",
    },
    Incomplete: {
        color: "var(--color-muted)",
        headline: "Incomplete",
        blurb: "Some health checks have not been recorded yet.",
    },
};

export const healthStatusTone = (status) => HEALTH_STATUS_TONES[status] || HEALTH_STATUS_TONES.Incomplete;
