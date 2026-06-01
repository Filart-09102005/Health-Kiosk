import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { healthRecords } from "./data/demoData";
import EmptyState from "./components/EmptyState";
import HealthRecordsSkeleton from "./components/HealthRecordsSkeleton";
import RecordDetailsDrawer from "./components/RecordDetailsDrawer";
import RecordsAnalyticsPanel from "./components/RecordsAnalyticsPanel";
import RecordsFilters from "./components/RecordsFilters";
import RecordsHeader from "./components/RecordsHeader";
import RecordsStatsGrid from "./components/RecordsStatsGrid";
import RecordsTable from "./components/RecordsTable";
import { countActiveFilters, filterHealthRecords } from "./utils/filterRecords";

const PAGE_SIZE = 10;

const defaultFilters = {
    dateFrom: "2026-05-12",
    dateTo: "2026-05-19",
    healthStatus: "all",
    role: "all",
    sessionStatus: "all",
    measurement: "all",
};

export default function HealthRecords() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [quickFilter, setQuickFilter] = useState("all");
    const [filters, setFilters] = useState(defaultFilters);
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), 550);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        setIsSearching(true);

        const timer = window.setTimeout(() => {
            setDebouncedSearch(search);
            setIsSearching(false);
            setPage(1);
        }, 420);

        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [quickFilter, filters]);

    const filteredRecords = useMemo(
        () => filterHealthRecords(healthRecords, { search: debouncedSearch, quickFilter, filters }),
        [debouncedSearch, quickFilter, filters],
    );

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;

        return filteredRecords.slice(start, start + PAGE_SIZE);
    }, [filteredRecords, page]);

    const activeFilterCount = countActiveFilters(filters);

    const emptyVariant = useMemo(() => {
        if (debouncedSearch) return "search";
        if (quickFilter === "alerts") return "alerts";
        if (quickFilter === "incomplete") return "incomplete";
        if (activeFilterCount > 0) return "filters";

        return "default";
    }, [debouncedSearch, quickFilter, activeFilterCount]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
    }, []);

    const handleRefresh = useCallback(() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 500);
    }, []);

    const handleViewDetails = useCallback((record) => {
        setDrawerOpen(true);
        setDrawerLoading(true);
        setSelectedRecord(null);

        window.setTimeout(() => {
            setSelectedRecord(record);
            setDrawerLoading(false);
        }, 320);
    }, []);

    const handleViewSession = useCallback((record) => {
        setDrawerOpen(true);
        setDrawerLoading(true);
        setSelectedRecord(null);

        window.setTimeout(() => {
            setSelectedRecord(record);
            setDrawerLoading(false);
        }, 220);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setDrawerLoading(false);
        setSelectedRecord(null);
    }, []);

    if (loading) {
        return <HealthRecordsSkeleton />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="mt-6 space-y-6">
            <RecordsHeader />
            <RecordsStatsGrid />
            <RecordsAnalyticsPanel />
            <RecordsFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                quickFilter={quickFilter}
                onQuickFilterChange={setQuickFilter}
                search={search}
                onSearchChange={setSearch}
                isSearching={isSearching}
                onRefresh={handleRefresh}
                activeFilterCount={activeFilterCount}
                filteredRecords={filteredRecords}
            />

            {filteredRecords.length === 0 ? (
                <EmptyState variant={emptyVariant} />
            ) : (
                <RecordsTable
                    records={paginatedRecords}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onViewDetails={handleViewDetails}
                    onViewSession={handleViewSession}
                    totalLabel={`Showing ${paginatedRecords.length} of ${filteredRecords.length} filtered records`}
                />
            )}

            <RecordDetailsDrawer
                open={drawerOpen}
                record={selectedRecord}
                loading={drawerLoading}
                onClose={closeDrawer}
            />
        </motion.div>
    );
}
