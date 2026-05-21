import { motion } from "framer-motion";
import { cardClassName, cardStyle } from "../utils/surface";
import AnalyticsToolbar from "./AnalyticsToolbar";
import DateRangePicker from "./DateRangePicker";

export default function AnalyticsFilters({ filters, onChange, search, onSearchChange, isSearching, onRefresh, activeFilterCount }) {
    const selectClass = "h-10 w-full appearance-none rounded-xl border px-3 text-xs font-black outline-none";
    const selectStyle = { backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" };

    return (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`space-y-4 ${cardClassName} p-5`} style={cardStyle}>
            <AnalyticsToolbar search={search} onSearchChange={onSearchChange} isSearching={isSearching} onRefresh={onRefresh} activeFilterCount={activeFilterCount} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <DateRangePicker from={filters.dateFrom} to={filters.dateTo} onFromChange={(v) => onChange("dateFrom", v)} onToChange={(v) => onChange("dateTo", v)} />
                <label><span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Period</span><select className={selectClass} style={selectStyle} value={filters.period} onChange={(e) => onChange("period", e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
                <label><span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Role</span><select className={selectClass} style={selectStyle} value={filters.role} onChange={(e) => onChange("role", e.target.value)}><option value="all">All roles</option><option value="student">Students</option><option value="teacher">Teachers</option></select></label>
                <label><span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Health status</span><select className={selectClass} style={selectStyle} value={filters.healthStatus} onChange={(e) => onChange("healthStatus", e.target.value)}><option value="all">All</option><option value="Normal">Normal</option><option value="Watch">Watch</option><option value="Alert">Alert</option></select></label>
                <label><span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Measurement</span><select className={selectClass} style={selectStyle} value={filters.measurement} onChange={(e) => onChange("measurement", e.target.value)}><option value="all">All types</option><option value="vitals">Vitals</option><option value="bmi">BMI</option></select></label>
                <label><span className="mb-1 block text-[0.65rem] font-black uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Comparison</span><select className={selectClass} style={selectStyle} value={filters.comparison} onChange={(e) => onChange("comparison", e.target.value)}><option value="today">Today vs yesterday</option><option value="week">Week over week</option><option value="role">Student vs teacher</option></select></label>
            </div>
        </motion.section>
    );
}
