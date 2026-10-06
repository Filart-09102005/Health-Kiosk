import { useState } from "react";
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { authService, getErrorMessage } from "../../../Auth/services/authService";
import { useToast } from "../../../../Global/Toast";
import ModalShell from "../../../../Global/ModalShell";

export default function ImportUsersModal({ open, onClose, role, onSuccess }) {
    const { showToast } = useToast();
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");

    const handleClose = () => {
        if (isUploading) return;
        setFile(null);
        setResults(null);
        setError("");
        onClose();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setError("");
        setResults(null);

        try {
            const response = await authService.adminImportUsers(file, role);
            setResults(response.data.results);
            showToast({
                type: "success",
                title: "Import Complete",
                message: `Successfully imported ${response.data.results.successful} users.`,
            });
            if (response.data.results.successful > 0) {
                onSuccess();
            }
        } catch (err) {
            setError(getErrorMessage(err, "Failed to import users."));
        } finally {
            setIsUploading(false);
        }
    };

    const isStudent = role === "student";

    return (
        <ModalShell
            open={open}
            onClose={handleClose}
            title={`Import ${isStudent ? "Students" : "Personnel"}`}
            closeOnOverlay={!isUploading}
        >
            <>
                {!results ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                            Upload an Excel file from the Registration System.
                            The import will automatically create {isStudent ? "student" : "staff"} accounts and assign a default password.
                        </p>

                        <div
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                        >
                            <FileSpreadsheet size={48} className="mb-4" style={{ color: "var(--color-muted)" }} />
                            <input
                                type="file"
                                id="excel-upload"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="excel-upload"
                                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold shadow-sm border ${isUploading ? "opacity-50" : "hk-admin-nav-hover"}`}
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            >
                                {file ? file.name : "Select Excel File"}
                            </label>
                        </div>

                        {error && (
                            <div
                                className="rounded-lg p-4 text-sm flex items-start gap-2"
                                style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}
                            >
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isUploading}
                                className="rounded-xl px-5 py-2.5 text-sm font-bold border hk-admin-nav-hover disabled:opacity-50"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!file || isUploading}
                                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-md hk-primary-hover disabled:opacity-50"
                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        <span>Importing...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={18} />
                                        <span>Upload & Import</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                            <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                                <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
                                Import Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p style={{ color: "var(--color-muted)" }}>Successfully Imported</p>
                                    <p className="text-xl font-black" style={{ color: "var(--color-success)" }}>{results.successful}</p>
                                </div>
                                <div>
                                    <p style={{ color: "var(--color-muted)" }}>Already Registered</p>
                                    <p className="text-xl font-black" style={{ color: "var(--color-text)" }}>{results.already_registered}</p>
                                </div>
                                <div>
                                    <p style={{ color: "var(--color-muted)" }}>Wrong Role Skipped</p>
                                    <p className="text-xl font-black" style={{ color: "var(--color-primary)" }}>{results.wrong_role}</p>
                                </div>
                                <div>
                                    <p style={{ color: "var(--color-muted)" }}>Invalid Data / Errors</p>
                                    <p className="text-xl font-black" style={{ color: "var(--color-error)" }}>{results.invalid_data}</p>
                                </div>
                            </div>
                        </div>

                        {results.errors && results.errors.length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm mb-3" style={{ color: "var(--color-text)" }}>Skipped Rows</h4>
                                <div className="max-h-60 overflow-y-auto rounded-lg border text-sm" style={{ borderColor: "var(--color-border)" }}>
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0" style={{ backgroundColor: "var(--color-surface)" }}>
                                            <tr>
                                                <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text)" }}>Row</th>
                                                <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text)" }}>Name / ID</th>
                                                <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text)" }}>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ backgroundColor: "var(--color-card)" }}>
                                            {results.errors.map((err, i) => (
                                                <tr key={i} style={{ borderColor: "var(--color-border)" }}>
                                                    <td className="px-3 py-2" style={{ color: "var(--color-text)" }}>{err.row}</td>
                                                    <td className="px-3 py-2" style={{ color: "var(--color-text)" }}>{err.name || err.id}</td>
                                                    <td className="px-3 py-2" style={{ color: "var(--color-error)" }}>{err.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-xl px-6 py-2.5 text-sm font-bold hk-primary-hover"
                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </>
        </ModalShell>
    );
}
