import { useState } from "react";
import { CheckCircle2, ClipboardList, UserCheck } from "lucide-react";
import { authService, getErrorMessage, getValidationErrors } from "../../../Auth/services/authService";
import { useToast } from "../../../../Global/Toast";

export default function AlertResolutionForm({ alert, onResolved }) {
    const { showToast } = useToast();
    const [form, setForm] = useState({ newMeasurement: "", resolutionNotes: "" });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!alert) return null;

    const isResolved = alert.status === "Resolved";

    if (isResolved) {
        return (
            <div
                className="mt-4 rounded-[1.25rem] border p-4"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--color-success) 8%, var(--color-card))",
                    borderColor: "color-mix(in srgb, var(--color-success) 30%, var(--color-border))",
                }}
            >
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
                    <h4 className="font-black text-[1.05rem]" style={{ color: "var(--color-success)" }}>Health Alert Resolved Successfully</h4>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[1rem] p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                            <UserCheck size={12} />
                            Resolved By
                        </p>
                        <p className="mt-1 font-bold" style={{ color: "var(--color-text)" }}>{alert.reviewedBy}</p>
                    </div>
                    <div className="rounded-[1rem] p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>New Measurement Value</p>
                        <p className="mt-1 font-black" style={{ color: "var(--color-success)" }}>{alert.newMeasurement}</p>
                    </div>
                </div>

                <div className="mt-3 rounded-[1rem] p-3" style={{ backgroundColor: "var(--color-surface)" }}>
                    <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                        <ClipboardList size={12} />
                        Resolution Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap font-semibold leading-relaxed" style={{ color: "var(--color-text)" }}>{alert.resolutionNotes}</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        setErrors({});
        
        let newErrors = {};
        if (!form.newMeasurement.trim()) newErrors.newMeasurement = "Please enter the new measurement value.";
        if (!form.resolutionNotes.trim()) newErrors.resolutionNotes = "Please provide the resolution notes.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.resolveAlert(alert.id.replace('ALT-', ''), {
                new_measurement: form.newMeasurement,
                resolution_notes: form.resolutionNotes
            });

            window.dispatchEvent(new Event('refresh-alert-count'));

            showToast({
                type: "success",
                title: "Health Alert Resolved Successfully",
                message: "The patient's updated measurement has been saved and all related records have been updated.",
            });

            if (onResolved) onResolved();
        } catch (error) {
            showToast({
                type: "error",
                title: "Failed to resolve alert",
                message: getErrorMessage(error, "An error occurred while resolving this alert."),
            });
            setErrors(getValidationErrors(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-5 border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
            <h4 className="mb-4 font-black">Resolve Alert</h4>
            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-bold">New Measurement Value <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={form.newMeasurement}
                        onChange={(e) => setForm({ ...form, newMeasurement: e.target.value })}
                        placeholder={`e.g. ${alert.measurementValue}`}
                        className={`w-full rounded-[0.875rem] border bg-transparent px-3 py-2 text-sm font-semibold outline-none transition ${errors.newMeasurement ? 'border-red-500' : 'focus:border-primary'}`}
                        style={{ borderColor: errors.newMeasurement ? "var(--color-error)" : "var(--color-border)" }}
                        disabled={isSubmitting}
                    />
                    {errors.newMeasurement && <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-error)" }}>{errors.newMeasurement}</p>}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-bold">Resolution Notes <span className="text-red-500">*</span></label>
                    <textarea
                        value={form.resolutionNotes}
                        onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                        placeholder="What actions were taken? How was the patient managed? Why is the alert now considered resolved?"
                        className={`min-h-[100px] w-full resize-none rounded-[0.875rem] border bg-transparent p-3 text-sm font-semibold outline-none transition ${errors.resolutionNotes ? 'border-red-500' : 'focus:border-primary'}`}
                        style={{ borderColor: errors.resolutionNotes ? "var(--color-error)" : "var(--color-border)" }}
                        disabled={isSubmitting}
                    />
                    {errors.resolutionNotes && <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-error)" }}>{errors.resolutionNotes}</p>}
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-[1rem] px-4 py-3 text-sm font-black transition hk-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                >
                    {isSubmitting ? "Resolving..." : "Resolve Alert"}
                </button>
            </div>
        </div>
    );
}
