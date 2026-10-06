import axios from "axios";

let activePrints = new Map();

function notify(type, title, message, duration) {
    window.dispatchEvent(new CustomEvent("health-kiosk:toast", {
        detail: { type, title, message, duration },
    }));
}

function getPrintKey(record = {}) {
    return String(record.id || record.record_id || record.school_id || record.schoolId || record.barcode || "health-receipt");
}

export async function printHealthReceipt(record = {}) {
    const key = getPrintKey(record);

    if (activePrints.has(key)) {
        return activePrints.get(key);
    }

    notify("info", "Printing receipt...", "Sending health summary to the thermal printer.", 1600);

    const request = axios
        .post("/api/receipt/print", record)
        .then((response) => {
            // The server can only confirm the job reached the print queue, so the
            // toast says that rather than claiming paper came out.
            const offline = response.data?.printer_online === false;
            notify(
                offline ? "warning" : "success",
                offline ? "Printer offline" : "Receipt sent to printer",
                response.data?.message || "Health receipt sent to the thermal printer.",
            );
            return { ok: true };
        })
        .catch((error) => {
            const message = error?.response?.data?.message
                || "Thermal printer failed. Check USB connection and printer share name.";

            notify("error", "Receipt print failed", message, 6500);

            return { ok: false, error };
        })
        .finally(() => {
            activePrints.delete(key);
        });

    activePrints.set(key, request);

    return request;
}
