import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authService, getErrorMessage } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import EmptyState from "./components/EmptyState";
import HealthRecordsSkeleton from "./components/HealthRecordsSkeleton";
import RecordDetailsDrawer from "./components/RecordDetailsDrawer";

import RecordsFilters from "./components/RecordsFilters";
import RecordsHeader from "./components/RecordsHeader";
import RecordsStatsGrid from "./components/RecordsStatsGrid";
import RecordsTable from "./components/RecordsTable";
import { countActiveFilters, filterHealthRecords } from "./utils/filterRecords";

const PAGE_SIZE = 15;

const defaultFilters = {
    dateFrom: "",
    dateTo: "",
    healthStatus: "all",
    role: "all",
    sessionStatus: "all",
    measurement: "all",
};

export default function HealthRecords({ navigate }) {
    const { showToast } = useToast();
    const shouldReduceMotion = useReducedMotion();
    const [loading, setLoading] = useState(true);
    const [recordsData, setRecordsData] = useState({ records: [], stats: [], analytics: null });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [quickFilter, setQuickFilter] = useState("all");
    const [filters, setFilters] = useState(defaultFilters);
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    const fetchRecords = useCallback(() => {
        setLoading(true);

        return authService
            .adminHealthRecords()
            .then((response) => {
                setRecordsData({
                    records: response.data?.records || [],
                    stats: response.data?.stats || [],
                    analytics: response.data?.analytics || null,
                });
            })
            .catch((error) => {
                setRecordsData({ records: [], stats: [], analytics: null });

                showToast({
                    type: "error",
                    title: "Health records unavailable",
                    message: getErrorMessage(error, "Unable to load health records right now."),
                });

                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigate("/login");
                }
            })
            .finally(() => setLoading(false));
    }, [navigate, showToast]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

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
        () => filterHealthRecords(recordsData.records, { search: debouncedSearch, quickFilter, filters }),
        [recordsData.records, debouncedSearch, quickFilter, filters],
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
        fetchRecords();
    }, [fetchRecords]);

    const handleViewDetails = useCallback((record) => {
        setDrawerOpen(true);
        setDrawerLoading(true);
        setSelectedRecord(null);

        window.setTimeout(() => {
            setSelectedRecord(record);
            setDrawerLoading(false);
        }, 320);
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
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: "easeOut" }}
            className="mt-6 space-y-6"
        >
            <RecordsHeader />
            <RecordsStatsGrid stats={recordsData.stats} />

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
                    onPageChange={(newPage) => {
                        if (newPage === page) return;
                        setIsPageLoading(true);
                        setPage(newPage);
                        setTimeout(() => setIsPageLoading(false), 450);
                    }}
                    onViewDetails={handleViewDetails}
                    exportRecords={filteredRecords}
                    totalLabel={`Showing ${paginatedRecords.length} of ${filteredRecords.length} filtered users`}
                    loading={isPageLoading}
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
