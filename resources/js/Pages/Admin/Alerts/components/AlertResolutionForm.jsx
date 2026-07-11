import { useState } from "react";
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
            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <h4 className="mb-3 font-black text-[1.05rem]" style={{ color: "var(--color-success)" }}>Health Alert Resolved Successfully</h4>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>Resolved By</p>
                        <p className="font-semibold">{alert.reviewedBy}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>New Measurement Value</p>
                        <p className="font-semibold">{alert.newMeasurement}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>Resolution Notes</p>
                        <p className="whitespace-pre-wrap font-semibold leading-relaxed">{alert.resolutionNotes}</p>
                    </div>
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
                        className={`w-full rounded-[10px] border bg-transparent px-3 py-2 text-sm font-semibold outline-none transition ${errors.newMeasurement ? 'border-red-500' : 'focus:border-primary'}`}
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
                        className={`min-h-[100px] w-full resize-none rounded-[10px] border bg-transparent p-3 text-sm font-semibold outline-none transition ${errors.resolutionNotes ? 'border-red-500' : 'focus:border-primary'}`}
                        style={{ borderColor: errors.resolutionNotes ? "var(--color-error)" : "var(--color-border)" }}
                        disabled={isSubmitting}
                    />
                    {errors.resolutionNotes && <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-error)" }}>{errors.resolutionNotes}</p>}
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-[12px] px-4 py-3 text-sm font-black text-white transition hk-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    {isSubmitting ? "Resolving..." : "Resolve Alert"}
                </button>
            </div>
        </div>
    );
}
