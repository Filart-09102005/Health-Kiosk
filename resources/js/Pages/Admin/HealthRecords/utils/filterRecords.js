export function filterHealthRecords(records, { search, quickFilter, filters }) {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
        if (query) {
            const haystack = `${record.fullName} ${record.schoolId} ${record.sessionId}`.toLowerCase();

            if (! haystack.includes(query)) return false;
        }

        if (quickFilter === "alerts" && record.healthStatus !== "Alert") return false;
        if (quickFilter === "incomplete" && record.sessionStatus !== "Incomplete") return false;
        if (quickFilter === "completed" && record.sessionStatus !== "Completed") return false;
        if (quickFilter === "today" && ! record.recordedAt.includes("2026-05-19")) return false;

        if (filters.healthStatus !== "all" && record.healthStatus !== filters.healthStatus) return false;
        if (filters.role !== "all" && record.role !== filters.role) return false;
        if (filters.sessionStatus !== "all" && record.sessionStatus !== filters.sessionStatus) return false;

        if (filters.measurement === "complete" && record.measurementsCompleted !== record.measurementsTotal) return false;
        if (filters.measurement === "partial" && record.measurementsCompleted >= record.measurementsTotal) return false;

        return true;
    });
}

export function countActiveFilters(filters) {
    let count = 0;

    if (filters.healthStatus !== "all") count += 1;
    if (filters.role !== "all") count += 1;
    if (filters.sessionStatus !== "all") count += 1;
    if (filters.measurement !== "all") count += 1;

    return count;
}
