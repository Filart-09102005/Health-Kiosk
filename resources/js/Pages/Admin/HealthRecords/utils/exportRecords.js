/**
 * Utility helper for exporting health records as Excel, PDF, or printing.
 */

// 1. Export to Excel (Styled HTML/XML format which Excel opens beautifully)
export function exportToExcel(records, options = {}) {
    const filename = `health_records_${new Date().toISOString().split("T")[0]}.xls`;
    const title = options.title || "HEALTH KIOSK SYSTEM";
    const subtitle = options.subtitle || "CLINIC REPORTS";
    
    let rowsHtml = "";
    
    const generateRow = (record, isHistory = false) => {
        const bmiColor = 
            record.healthStatus === "Alert" ? "#fee2e2" :
            record.healthStatus === "Watch" ? "#fef3c7" : "#ecfdf5";
            
        const statusBadgeColor = 
            record.healthStatus === "Alert" ? "#dc2626" :
            record.healthStatus === "Watch" ? "#d97706" : "#059669";

        const rowBg = isHistory ? "background-color: #f8fafc;" : "";
        const idPrefix = isHistory ? "↳ " : "";

        return `
            <tr style="${rowBg}">
                <td style="mso-number-format:'\\@'; font-weight: ${isHistory ? 'normal' : 'bold'}; padding-left: ${isHistory ? '20px' : '10px'};">${idPrefix}${record.schoolId}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.fullName}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.role}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.department || "COLLEGE"}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.temperature}°C</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.heartRate} bpm</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.spo2}%</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.height} cm</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.weight} kg</td>
                <td style="background-color: ${bmiColor}; font-weight: bold; color: ${isHistory ? '#64748b' : '#000'};">${record.bmi}</td>
                <td style="color: ${statusBadgeColor}; font-weight: bold;">${record.healthStatus}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.sessionStatus}</td>
                <td style="color: ${isHistory ? '#64748b' : '#000'};">${record.recordedAt}</td>
            </tr>
        `;
    };

    records.forEach((record) => {
        rowsHtml += generateRow(record, false);
        if (record.sessionHistory && record.sessionHistory.length > 0) {
            record.sessionHistory.forEach(historyRecord => {
                rowsHtml += generateRow(historyRecord, true);
            });
        }
    });

    const excelXml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Health Records</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                th { background-color: #2563eb; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
                td { border: 1px solid #cbd5e1; text-align: left; padding: 8px 10px; font-size: 12px; }
                .title { font-size: 18px; font-weight: bold; color: #2563eb; }
                .subtitle { font-size: 12px; color: #475569; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <td colspan="13" class="title">${title} - ${subtitle}</td>
                </tr>
                <tr>
                    <td colspan="13" class="subtitle">Generated: ${new Date().toLocaleString()} | Total Filtered Records: ${records.length}</td>
                </tr>
                <tr><td colspan="13"></td></tr>
                <thead>
                    <tr>
                        <th>School ID</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Temp</th>
                        <th>HR</th>
                        <th>SpO2</th>
                        <th>Height</th>
                        <th>Weight</th>
                        <th>BMI</th>
                        <th>Health Status</th>
                        <th>Session Status</th>
                        <th>Recorded Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([excelXml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper to construct highly-styled printable HTML content for Print/PDF
function generatePrintTemplate(records, isPdf = false, options = {}) {
    const title = options.title || "HEALTH KIOSK SYSTEM";
    const subtitle = options.subtitle || "Health Records Summary";

    let rowsHtml = "";
    
    const generatePrintRow = (record, isHistory = false) => {
        const rowBg = isHistory ? "background-color: #f8fafc;" : "";
        const idPrefix = isHistory ? "↳ " : "";
        const textColor = isHistory ? "color: #64748b;" : "";
        const pillOpacity = isHistory ? "opacity: 0.7;" : "";

        const tempColor = (record.temperature > 37.2 || record.temperature < 35.0) ? '#ef4444' : '#10b981';
        const hrColor = (record.heartRate > 100 || record.heartRate < 60) ? '#ef4444' : '#10b981';
        const spo2Color = (record.spo2 < 95) ? '#ef4444' : '#10b981';
        
        // Approximate BMI color based on value since we might not have bmi_category in export data
        const bmiVal = parseFloat(record.bmi);
        const bmiColor = (bmiVal < 18.5 || bmiVal >= 25) ? '#f59e0b' : '#10b981';

        const healthStatusColor = 
            record.healthStatus === "Alert" ? "#ef4444" :
            record.healthStatus === "Watch" ? "#f59e0b" : "#10b981";

        return `
            <tr style="${rowBg}">
                <td style="${textColor} padding-left: ${isHistory ? '20px' : '8px'};">${idPrefix}${record.recordedAt}</td>
                <td>
                    <div class="name-text" style="${textColor}">${record.fullName}</div>
                    <div class="sub-text" style="${textColor}">${record.schoolId}</div>
                </td>
                <td>
                    <div class="name-text" style="${textColor}">${record.department || "COLLEGE"}</div>
                    <div class="sub-text" style="${textColor}">${record.role}</div>
                </td>
                <td><span class="pill" style="background-color: ${tempColor}; ${pillOpacity}">${record.temperature} °C</span></td>
                <td><span class="pill" style="background-color: ${hrColor}; ${pillOpacity}">${record.heartRate} BPM</span></td>
                <td><span class="pill" style="background-color: ${spo2Color}; ${pillOpacity}">${record.spo2} %</span></td>
                <td><span class="pill" style="background-color: ${bmiColor}; ${pillOpacity}">${record.bmi}</span></td>
                <td><span class="pill" style="background-color: ${healthStatusColor}; ${pillOpacity}">${record.healthStatus}</span></td>
            </tr>
        `;
    };

    records.forEach((record) => {
        rowsHtml += generatePrintRow(record, false);
        if (record.sessionHistory && record.sessionHistory.length > 0) {
            record.sessionHistory.forEach(historyRecord => {
                rowsHtml += generatePrintRow(historyRecord, true);
            });
        }
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${subtitle}</title>
            <style>
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 15mm 10mm 15mm 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 20px;
                    background: #ffffff;
                }
                .header-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header-title {
                    color: #1e3a8a;
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0;
                    text-transform: uppercase;
                }
                .header-subtitle {
                    color: #64748b;
                    font-size: 14px;
                    font-weight: normal;
                    margin: 5px 0 15px 0;
                }
                .header-line {
                    border-bottom: 2px solid #3b82f6;
                    width: 100%;
                }
                .meta-card {
                    background-color: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    padding: 15px;
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                }
                .meta-section-title {
                    color: #64748b;
                    font-size: 11px;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }
                .meta-row {
                    font-size: 11px;
                    color: #1e293b;
                    margin-bottom: 4px;
                }
                .section-header {
                    margin-bottom: 15px;
                }
                .section-title {
                    color: #1e3a8a;
                    font-size: 16px;
                    margin: 0 0 5px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #cbd5e1;
                }
                .section-desc {
                    color: #475569;
                    font-size: 11px;
                    margin: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-bottom: 30px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #334155;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 10px;
                    border: 1px solid #cbd5e1;
                    padding: 10px 8px;
                    text-align: left;
                }
                td {
                    border: 1px solid #cbd5e1;
                    padding: 10px 8px;
                    text-align: left;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .name-text {
                    color: #0f172a;
                }
                .sub-text {
                    font-size: 10px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .pill {
                    display: inline-block;
                    color: #ffffff;
                    padding: 4px 8px;
                    font-weight: bold;
                    border-radius: 4px;
                    font-size: 9px;
                    text-transform: uppercase;
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <h1 class="header-title">${title}</h1>
                <h2 class="header-subtitle">${subtitle}</h2>
                <div class="header-line"></div>
            </div>

            <div class="meta-card">
                <div>
                    <h4 class="meta-section-title">REPORT INFORMATION</h4>
                    <div class="meta-row"><strong>Generated By:</strong> Health Kiosk</div>
                    <div class="meta-row"><strong>Date Generated:</strong> ${new Date().toLocaleString()}</div>
                    <div class="meta-row"><strong>Total Records:</strong> ${records.length}</div>
                </div>
                <div>
                    <h4 class="meta-section-title">FILTERS APPLIED</h4>
                    <div class="meta-row"><strong>From:</strong> All Time</div>
                    <div class="meta-row"><strong>To:</strong> Present</div>
                    <div class="meta-row"><strong>Gender:</strong> All</div>
                </div>
            </div>

            <div class="section-header">
                <h3 class="section-title">Measurement Summary</h3>
                <p class="section-desc">This report contains all health records submitted within the specified filters.</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date / Time</th>
                        <th>Student</th>
                        <th>Department</th>
                        <th>Temperature</th>
                        <th>Heart Rate</th>
                        <th>SpO2</th>
                        <th>BMI</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

        </body>
        </html>
    `;
}

/**
 * Print trigger, injected into the popup so the popup calls print() on itself.
 *
 * It used to be the opener that called `printWindow.print()` on a timer. A
 * same-origin popup shares the opener's event loop, and print() blocks until
 * the dialog is dismissed - so the opener froze mid-render and any button that
 * had just finished stayed stuck on its loading state until the user came back
 * and closed the dialog. Handing the call to the popup lets the opener's stack
 * unwind and repaint first.
 */
const PRINT_TRIGGER = `
    <script>
        window.addEventListener("load", function () {
            // One frame after load so fonts and table layout have settled.
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { window.print(); });
            });
        });
    <\/script>
`;

function openPrintWindow(records, isPdf, options, deniedMessage) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert(deniedMessage);
        return false;
    }

    const html = generatePrintTemplate(records, isPdf, options);

    // Injected before </body> rather than appended after </html>, so the parser
    // runs it as part of the document instead of recovering it into the body.
    printWindow.document.write(
        html.includes("</body>") ? html.replace("</body>", `${PRINT_TRIGGER}</body>`) : html + PRINT_TRIGGER,
    );
    printWindow.document.close();

    return true;
}

// 2. Export as PDF (Configures window for Print-to-PDF layout)
export function exportToPdf(records, options = {}) {
    return openPrintWindow(records, true, options, "Please allow popups to export as PDF.");
}

// 3. Direct Print
export function printRecords(records, options = {}) {
    return openPrintWindow(records, false, options, "Please allow popups to print records.");
}
