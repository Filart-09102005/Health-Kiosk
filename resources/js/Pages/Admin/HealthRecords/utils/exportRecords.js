/**
 * Utility helper for exporting health records as Excel, PDF, or printing.
 */

// 1. Export to Excel (Styled HTML/XML format which Excel opens beautifully)
export function exportToExcel(records) {
    const filename = `health_records_${new Date().toISOString().split("T")[0]}.xls`;
    
    let rowsHtml = "";
    records.forEach((record) => {
        const bmiColor = 
            record.healthStatus === "Alert" ? "#fee2e2" :
            record.healthStatus === "Watch" ? "#fef3c7" : "#ecfdf5";
            
        const statusBadgeColor = 
            record.healthStatus === "Alert" ? "#dc2626" :
            record.healthStatus === "Watch" ? "#d97706" : "#059669";

        rowsHtml += `
            <tr>
                <td style="mso-number-format:'\\@'; font-weight: bold;">${record.schoolId}</td>
                <td>${record.fullName}</td>
                <td>${record.role}</td>
                <td>${record.department || "COLLEGE"}</td>
                <td>${record.temperature}°C</td>
                <td>${record.heartRate} bpm</td>
                <td>${record.spo2}%</td>
                <td>${record.height} cm</td>
                <td>${record.weight} kg</td>
                <td style="background-color: ${bmiColor}; font-weight: bold;">${record.bmi}</td>
                <td style="color: ${statusBadgeColor}; font-weight: bold;">${record.healthStatus}</td>
                <td>${record.sessionStatus}</td>
                <td>${record.recordedAt}</td>
            </tr>
        `;
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
                    <td colspan="13" class="title">HEALTH KIOSK SYSTEM - CLINIC REPORTS</td>
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
function generatePrintTemplate(records, isPdf = false) {
    let rowsHtml = "";
    records.forEach((record) => {
        const healthClass = 
            record.healthStatus === "Alert" ? "status-alert" :
            record.healthStatus === "Watch" ? "status-watch" : "status-normal";

        rowsHtml += `
            <tr>
                <td class="font-bold">${record.schoolId}</td>
                <td>
                    <div class="name-text">${record.fullName}</div>
                    <div class="sub-text">${record.department || "COLLEGE"}</div>
                </td>
                <td>${record.role}</td>
                <td>${record.temperature}°C</td>
                <td>${record.heartRate} bpm</td>
                <td>${record.spo2}%</td>
                <td>${record.height} cm</td>
                <td>${record.weight} kg</td>
                <td class="font-bold">${record.bmi}</td>
                <td><span class="status-badge ${healthClass}">${record.healthStatus}</span></td>
                <td>${record.sessionStatus}</td>
                <td class="sub-text">${record.recordedAt}</td>
            </tr>
        `;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Kiosk Report - ${new Date().toISOString().split("T")[0]}</title>
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
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .header-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #2563eb;
                    letter-spacing: -0.5px;
                    margin: 0;
                }
                .header-subtitle {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                    font-weight: 500;
                }
                .meta-badge {
                    background-color: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    text-align: right;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-top: 10px;
                }
                th {
                    background-color: #2563eb !important;
                    color: #ffffff !important;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 9px;
                    letter-spacing: 0.5px;
                    border: 1px solid #cbd5e1;
                    padding: 10px 8px;
                    text-align: left;
                }
                td {
                    border: 1px solid #e2e8f0;
                    padding: 8px 8px;
                    text-align: left;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .font-bold {
                    font-weight: 700;
                }
                .name-text {
                    font-weight: 600;
                    color: #0f172a;
                }
                .sub-text {
                    font-size: 9px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 9px;
                    text-transform: uppercase;
                }
                .status-normal {
                    background-color: #dcfce7 !important;
                    color: #15803d !important;
                }
                .status-watch {
                    background-color: #fef3c7 !important;
                    color: #b45309 !important;
                }
                .status-alert {
                    background-color: #fee2e2 !important;
                    color: #b91c1c !important;
                }
                .footer {
                    margin-top: 40px;
                    border-top: 1px dashed #cbd5e1;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #64748b;
                }
                .signature-block {
                    margin-top: 50px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 80px;
                    font-size: 11px;
                }
                .sig-box {
                    text-align: center;
                    width: 200px;
                }
                .sig-line {
                    border-top: 1px solid #94a3b8;
                    margin-top: 35px;
                    padding-top: 5px;
                    font-weight: 600;
                    color: #334155;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="header-title">HEALTH KIOSK - CLINIC SCREENING SUMMARY</h1>
                    <div class="header-subtitle">Comprehensive Patient Vitals & Health Record Ledger</div>
                </div>
                <div class="meta-badge">
                    <div>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="margin-top: 2px; color: #2563eb;">Total Records Listed: ${records.length}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>School ID</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Temp</th>
                        <th>HR</th>
                        <th>SpO2</th>
                        <th>Height</th>
                        <th>Weight</th>
                        <th>BMI</th>
                        <th>Health Status</th>
                        <th>Session Status</th>
                        <th>Recorded At</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="signature-block">
                <div class="sig-box">
                    <div class="sig-line">Prepared By (Clinic Nurse)</div>
                </div>
                <div class="sig-box">
                    <div class="sig-line">Noted By (School Physician)</div>
                </div>
            </div>

            <div class="footer">
                <div>Health Kiosk System © 2026. All Rights Reserved. Confidential Medical Data.</div>
                <div>Page 1 of 1</div>
            </div>
        </body>
        </html>
    `;
}

// 2. Export as PDF (Configures window for Print-to-PDF layout)
export function exportToPdf(records) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups to export as PDF.");
        return;
    }
    
    printWindow.document.write(generatePrintTemplate(records, true));
    printWindow.document.close();
    
    // Slight timeout to ensure layout styles load completely
    setTimeout(() => {
        printWindow.print();
        // Option to close the print window after print dialog is closed (note: behaves differently in some browsers)
        // printWindow.close();
    }, 500);
}

// 3. Direct Print
export function printRecords(records) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups to print records.");
        return;
    }
    
    printWindow.document.write(generatePrintTemplate(records, false));
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}
