import { ALPHA_SECTIONS } from "./alphaTestData";

/**
 * Persistence for the Alpha Testing questionnaire.
 *
 * Two things make this more than a JSON blob in localStorage:
 *
 * 1. Question numbers restart at Q1 in every section, so a bare "Q5" is
 *    ambiguous. Results are keyed "<section>:<q>" instead.
 *
 * 2. Sections get renumbered when the questionnaire is revised. A step that
 *    survives a revision carries `legacyQ`, and the migration below moves any
 *    result recorded under the old number onto the new one — so reorganising
 *    the questionnaire never costs a tester a completed test.
 */

export const STORAGE_KEY = "healthKioskAlphaTesting";
const VERSION = 11;

export const resultKey = (sectionId, q) => `${sectionId}:${q}`;
export const overallKey = (sectionId, caseId) => `${sectionId}:${caseId}`;

const emptyState = () => ({
    version: VERSION,
    meta: { tester: "", date: "", time: "" },
    results: {},   // "<section>:<q>"  -> { status, comment, extra }
    overall: {},   // "<section>:<TC>" -> { comment, submitted, submittedAt }
});

/**
 * Bring a v1 payload forward.
 *
 * v1 stored a flat map of bare question numbers written before sections were
 * scoped or renumbered: { Q1: {...}, Q41: {...}, __meta: {...} }. Login ran
 * Q1-Q40 plus Q181+, User-Side Q41-Q107, Admin-Side Q108-Q180.
 */
function migrateV1(raw) {
    const next = emptyState();

    if (raw.__meta) {
        next.meta = { ...next.meta, ...raw.__meta };
    }

    const flat = {};
    Object.entries(raw).forEach(([key, value]) => {
        if (key !== "__meta" && /^Q\d+$/.test(key)) flat[key] = value;
    });

    ALPHA_SECTIONS.forEach((section) => {
        const steps = section.cases.flatMap((testCase) => testCase.steps);

        // A renumbered section is identified by its questions carrying legacyQ.
        // There, only legacyQ may be trusted: its new Q1 is a different question
        // from the old Q1, and matching on the bare number would hand one
        // question's result to another - or pull in a result that belongs to a
        // different section entirely, since numbering restarts per section.
        const renumbered = steps.some((step) => step.legacyQ);

        steps.forEach((step) => {
            const source = renumbered ? flat[step.legacyQ] : flat[step.q];
            if (source) next.results[resultKey(section.id, step.q)] = source;
        });
    });

    return next;
}

/**
 * Re-file results after a section has been renumbered.
 *
 * A step that survived a renumber carries `priorQ` — the number it held before,
 * and therefore where its result is currently filed. Every version step since
 * keys were scoped uses this same remap, so a payload written under any of them
 * arrives intact.
 */
function migrateByPriorQ(raw) {
    const next = { ...emptyState(), meta: { ...emptyState().meta, ...(raw.meta || {}) } };
    const previous = raw.results || {};

    ALPHA_SECTIONS.forEach((section) => {
        section.cases.forEach((testCase) => {
            testCase.steps.forEach((step) => {
                const from = step.priorQ || step.q;
                const source = previous[resultKey(section.id, from)];
                if (source) next.results[resultKey(section.id, step.q)] = source;
            });
        });
    });

    // Overall comments are keyed by test case, and a reorder can hand a TC id
    // to a different module — old admin TC-3 was User Management, new TC-3 is
    // Health Records. `priorCase` says where each one's comment is filed today.
    const previousOverall = raw.overall || {};

    ALPHA_SECTIONS.forEach((section) => {
        section.cases.forEach((testCase) => {
            const from = testCase.priorCase || testCase.id;
            const source = previousOverall[overallKey(section.id, from)];
            if (source) next.overall[overallKey(section.id, testCase.id)] = source;
        });
    });

    return next;
}

export function loadState() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();

        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) {
            return { ...emptyState(), ...parsed, meta: { ...emptyState().meta, ...(parsed.meta || {}) } };
        }

        // Each step forward is applied in turn, so a payload written before
        // sections were scoped still arrives intact.
        if (parsed && parsed.version >= 2 && parsed.version < VERSION) return migrateByPriorQ(parsed);

        return migrateByPriorQ(migrateV1(parsed || {}));
    } catch {
        return emptyState();
    }
}

export function saveState(state) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: VERSION }));
    } catch {
        /* storage unavailable — testing continues, persistence does not */
    }
}
