import ExportExcelButton from "./ExportExcelButton";
import ExportPDFButton from "./ExportPDFButton";
import PrintReportButton from "./PrintReportButton";
import SectionHeader from "./SectionHeader";

export default function ExportOptionsCard() {
    return (
        <section className="rounded-[14px] border p-5 shadow-xl" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <SectionHeader eyebrow="Export" title="Export options" description="Prepare demo outputs for PDF, Excel, and print preview." />
            <div className="mt-4 grid gap-3">
                <ExportPDFButton />
                <ExportExcelButton />
                <PrintReportButton />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
            </div>
            <p className="mt-2 text-xs font-black" style={{ color: "var(--color-muted)" }}>Export readiness 67%</p>
        </section>
    );
}
