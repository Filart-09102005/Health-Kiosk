const receiptValue = (value, fallback = "--") => value ?? fallback;

export function printHealthReceipt(record = {}) {
    const receiptWindow = window.open("", "_blank", "width=420,height=680");

    if (! receiptWindow) return;

    const rows = [
        ["User Name", receiptValue(record.name || record.user_name)],
        ["Barcode", receiptValue(record.barcode)],
        ["Date/Time", receiptValue(record.date || new Date().toLocaleString())],
        ["Heart Rate", `${receiptValue(record.heart_rate)} bpm`],
        ["SpO2", `${receiptValue(record.spo2)}%`],
        ["Temperature", `${receiptValue(record.temperature)} C`],
        ["Height", `${receiptValue(record.height)} cm`],
        ["Weight", `${receiptValue(record.weight)} kg`],
        ["BMI", receiptValue(record.bmi)],
        ["Health Status", receiptValue(record.status)],
    ];

    receiptWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <title>Health Kiosk Receipt</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        color: #000;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                        margin: 0;
                        padding: 12px;
                        width: 280px;
                    }
                    h1 {
                        font-size: 16px;
                        margin: 0;
                        text-align: center;
                        text-transform: uppercase;
                    }
                    .sub {
                        border-bottom: 1px dashed #000;
                        font-size: 11px;
                        margin: 4px 0 10px;
                        padding-bottom: 8px;
                        text-align: center;
                    }
                    .row {
                        display: flex;
                        font-size: 11px;
                        justify-content: space-between;
                        line-height: 1.55;
                        gap: 12px;
                    }
                    .row span:last-child {
                        font-weight: 700;
                        text-align: right;
                    }
                    .advice {
                        border-top: 1px dashed #000;
                        font-size: 11px;
                        line-height: 1.5;
                        margin-top: 10px;
                        padding-top: 8px;
                    }
                    .footer {
                        border-top: 1px dashed #000;
                        font-size: 10px;
                        margin-top: 10px;
                        padding-top: 8px;
                        text-align: center;
                    }
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body { width: 80mm; }
                    }
                </style>
            </head>
            <body>
                <h1>School Health Kiosk</h1>
                <div class="sub">Thermal Health Receipt</div>
                ${rows.map(([label, value]) => `<div class="row"><span>${label}</span><span>${value}</span></div>`).join("")}
                <div class="advice">
                    <strong>Advice</strong><br />
                    ${receiptValue(record.advice, "Please consult the clinic staff if you feel unwell.")}
                </div>
                <div class="footer">Keep this receipt for clinic reference.</div>
                <script>
                    window.onload = () => {
                        window.print();
                        window.setTimeout(() => window.close(), 300);
                    };
                </script>
            </body>
        </html>
    `);

    receiptWindow.document.close();
}
