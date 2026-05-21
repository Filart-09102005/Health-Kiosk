import { useEffect, useState } from "react";
import { Activity, Printer, ShieldCheck } from "lucide-react";
import Header from "../components/Header";
import { authService } from "../../Auth/services/authService";
import { useToast } from "../../Global/Toast";
import { printHealthReceipt } from "../../Global/receiptPrinter";
import { measurementService } from "../Measurements/services/measurementService";

export default function Results({ navigate }) {
    const { showToast } = useToast();
    const [data, setData] = useState({ session: null, record: null });

    useEffect(() => {
        const controller = new AbortController();

        measurementService
            .summary(controller.signal)
            .then((response) => setData(response.data))
            .catch(() => showToast({ type: "error", title: "Results unavailable", message: "Please try again." }));

        return () => controller.abort();
    }, [showToast]);

    const logout = async () => {
        await authService.logout();
        showToast({ type: "info", title: "Logged out", message: "Your session has ended." });
        navigate("/login");
    };

    const record = data.record || {};
    const user = data.session?.user || {};
    const receipt = {
        name: user.name,
        barcode: user.barcode,
        session_number: data.session?.session_number,
        date: new Date().toLocaleString(),
        heart_rate: record.heart_rate,
        spo2: record.spo2,
        temperature: record.temperature,
        height: record.height,
        weight: record.weight,
        bmi: record.bmi,
        status: record.health_status || "Incomplete",
        advice: record.advice,
    };

    const metrics = [
        ["Heart Rate", record.heart_rate ? `${record.heart_rate} bpm` : "Missing"],
        ["SpO2", record.spo2 ? `${record.spo2}%` : "Missing"],
        ["Temperature", record.temperature ? `${record.temperature} C` : "Missing"],
        ["Height", record.height ? `${record.height} cm` : "Missing"],
        ["Weight", record.weight ? `${record.weight} kg` : "Missing"],
    ];

    return (
        <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <div className="mx-auto max-w-7xl">
                <Header user={{ firstname: user.name || "Health", lastname: "", role: user.role, department: user.department, barcode: user.barcode }} onLogout={logout} navigate={navigate} />

                <section className="mx-auto mt-8 max-w-5xl rounded-[2rem] border p-6 shadow-2xl md:p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="text-center">
                        <ShieldCheck className="mx-auto" size={48} style={{ color: record.health_status === "Alert" ? "var(--color-error)" : "var(--color-primary)" }} />
                        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                            Session #{data.session?.session_number || "--"} Results
                        </p>
                        <h2 className="mt-2 text-4xl font-black">{record.health_status || "Incomplete"} health summary</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                            Complete or incomplete sessions can still be reviewed and printed for clinic accountability.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <article className="rounded-[2rem] border p-6 text-center" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <Activity className="mx-auto" size={28} style={{ color: "var(--color-primary)" }} />
                            <p className="mt-4 text-sm font-black" style={{ color: "var(--color-muted)" }}>BMI</p>
                            <div className="mt-2 text-6xl font-black">{record.bmi || "--"}</div>
                            <p className="mt-2 text-sm font-bold" style={{ color: "var(--color-muted)" }}>
                                {record.bmi_category || (record.missing_measurements?.includes("height") ? "Please complete height measurement" : "Please complete weight measurement")}
                            </p>
                        </article>

                        <article className="rounded-[2rem] border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            <h3 className="text-lg font-black">Measurements</h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {metrics.map(([label, value]) => (
                                    <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-surface)" }}>
                                        <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{label}</p>
                                        <p className="mt-2 text-2xl font-black">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>

                    <section className="mt-5 rounded-[2rem] border p-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <h3 className="font-black">Health advice</h3>
                        <p className="mt-2 text-sm leading-7" style={{ color: "var(--color-muted)" }}>
                            {record.advice || "Complete measurements to generate advice."}
                        </p>
                    </section>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={() => printHealthReceipt(receipt)} className="flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)" }}>
                            <Printer size={18} />
                            Print receipt
                        </button>
                        <button type="button" onClick={() => navigate("/measurements")} className="rounded-2xl border px-5 py-4 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                            Continue measurements
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
