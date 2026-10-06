import SectionHeader from "./SectionHeader";

export default function SavedReportsPanel({ reports = [], onPreview }) {
    return (
        <section className="rounded-[1.25rem] border p-5 hk-admin-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader title="Saved reports" description="Pinned report outputs for quick clinic review." />
            <div className="mt-4 space-y-3">
                {reports.slice(0, 3).map((report) => (
                    <button key={report.id} onClick={() => onPreview(report)} className="w-full rounded-[1rem] border p-3 text-left transition hk-admin-nav-hover" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <p className="font-black">{report.name}</p>
                        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>{report.format} - {report.generatedAt}</p>
                    </button>
                ))}
            </div>
        </section>
    );
}
