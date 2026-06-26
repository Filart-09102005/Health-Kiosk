export function filterHealthRecords(records, { search, quickFilter, filters }) {
    const query = search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);

    return records.filter((record) => {
        const recordDate = record.recordedAt?.slice(0, 10) || "";

        if (query) {
            const haystack = `${record.fullName} ${record.schoolId} ${record.sessionId}`.toLowerCase();

            if (! haystack.includes(query)) return false;
        }

        if (quickFilter === "alerts" && record.healthStatus !== "Alert") return false;
        if (quickFilter === "incomplete" && record.sessionStatus !== "Incomplete") return false;
        if (quickFilter === "completed" && record.sessionStatus !== "Completed") return false;
        if (quickFilter === "today" && recordDate !== today) return false;

        if (filters.healthStatus !== "all" && record.healthStatus !== filters.healthStatus) return false;
        if (filters.role !== "all" && record.role !== filters.role) return false;
        if (filters.sessionStatus !== "all" && record.sessionStatus !== filters.sessionStatus) return false;
        if (filters.dateFrom && recordDate < filters.dateFrom) return false;
        if (filters.dateTo && recordDate > filters.dateTo) return false;

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
    if (filters.dateFrom) count += 1;
    if (filters.dateTo) count += 1;

    return count;
}
