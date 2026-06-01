export const overviewMetrics = [
    { key: "today", label: "Total Sessions Today", value: 342, change: 12.4, trend: "up", icon: "measure", spark: [280, 295, 310, 330, 342, 318, 342] },
    { key: "completed", label: "Completed Sessions", value: 318, change: 9.1, trend: "up", icon: "completed", spark: [290, 300, 305, 312, 318, 301, 318] },
    { key: "incomplete", label: "Incomplete Sessions", value: 24, change: -5.2, trend: "down", icon: "incomplete", spark: [32, 28, 26, 25, 24, 27, 24] },
    { key: "alerts", label: "Active Alerts", value: 18, change: 2.1, trend: "up", icon: "alerts", spark: [12, 14, 15, 16, 18, 17, 18] },
];

export const temperatureTrend = [
    { label: "Mon", value: 36.5 },
    { label: "Tue", value: 36.6 },
    { label: "Wed", value: 36.7 },
    { label: "Thu", value: 36.8 },
    { label: "Fri", value: 36.7 },
    { label: "Sat", value: 36.6 },
    { label: "Sun", value: 36.5 },
];

export const heartRateTrend = [
    { label: "Mon", value: 76 },
    { label: "Tue", value: 78 },
    { label: "Wed", value: 80 },
    { label: "Thu", value: 82 },
    { label: "Fri", value: 79 },
    { label: "Sat", value: 77 },
    { label: "Sun", value: 75 },
];

export const spo2Trend = [
    { label: "Mon", value: 97.2 },
    { label: "Tue", value: 97.5 },
    { label: "Wed", value: 97.8 },
    { label: "Thu", value: 98.0 },
    { label: "Fri", value: 97.6 },
    { label: "Sat", value: 97.9 },
    { label: "Sun", value: 98.1 },
];

export const bmiDistribution = [
    { range: "Underweight", count: 38 },
    { range: "Normal", count: 192 },
    { range: "Overweight", count: 74 },
    { range: "Obese", count: 38 },
];

export const healthStatusDistribution = [
    { name: "Normal", value: 214 },
    { name: "Needs Review", value: 26 },
    { name: "High Risk", value: 18 },
    { name: "Incomplete", value: 12 },
];

export const measurementCompletion = { completed: 93, incomplete: 7 };

export const weeklyAnalytics = [
    { label: "W1", temperature: 36.5, heartRate: 77, spo2: 97.4 },
    { label: "W2", temperature: 36.6, heartRate: 78, spo2: 97.6 },
    { label: "W3", temperature: 36.7, heartRate: 79, spo2: 97.8 },
    { label: "W4", temperature: 36.8, heartRate: 80, spo2: 97.9 },
];

export const vitalTrendAnalytics = {
    weekly: weeklyAnalytics,
    monthly: [
        { label: "Jan", temperature: 36.4, heartRate: 76, spo2: 97.2 },
        { label: "Feb", temperature: 36.5, heartRate: 77, spo2: 97.4 },
        { label: "Mar", temperature: 36.7, heartRate: 79, spo2: 97.7 },
        { label: "Apr", temperature: 36.6, heartRate: 78, spo2: 97.8 },
        { label: "May", temperature: 36.8, heartRate: 80, spo2: 97.9 },
    ],
    yearly: [
        { label: "2022", temperature: 36.3, heartRate: 75, spo2: 97.1 },
        { label: "2023", temperature: 36.5, heartRate: 77, spo2: 97.3 },
        { label: "2024", temperature: 36.6, heartRate: 78, spo2: 97.6 },
        { label: "2025", temperature: 36.7, heartRate: 79, spo2: 97.8 },
        { label: "2026", temperature: 36.8, heartRate: 80, spo2: 97.9 },
    ],
};

export const monthlyAnalytics = [
    { month: "Jan", completed: 760, incomplete: 58, alerts: 42 },
    { month: "Feb", completed: 810, incomplete: 52, alerts: 38 },
    { month: "Mar", completed: 860, incomplete: 46, alerts: 34 },
    { month: "Apr", completed: 920, incomplete: 39, alerts: 31 },
    { month: "May", completed: 980, incomplete: 32, alerts: 28 },
];

export const sessionTrendAnalytics = {
    weekly: [
        { label: "W1", completed: 182, incomplete: 16, alerts: 12 },
        { label: "W2", completed: 196, incomplete: 14, alerts: 10 },
        { label: "W3", completed: 211, incomplete: 12, alerts: 9 },
        { label: "W4", completed: 228, incomplete: 10, alerts: 8 },
    ],
    monthly: monthlyAnalytics.map(({ month, ...values }) => ({ label: month, ...values })),
    yearly: [
        { label: "2022", completed: 6840, incomplete: 420, alerts: 310 },
        { label: "2023", completed: 7920, incomplete: 386, alerts: 284 },
        { label: "2024", completed: 8840, incomplete: 342, alerts: 246 },
        { label: "2025", completed: 9560, incomplete: 318, alerts: 224 },
        { label: "2026", completed: 10320, incomplete: 276, alerts: 198 },
    ],
};

export const sessionAnalytics = [
    { name: "Completed", value: 318 },
    { name: "Incomplete", value: 24 },
];

export const peakUsageHours = [
    { hour: "7AM", count: 12 },
    { hour: "8AM", count: 48 },
    { hour: "9AM", count: 72 },
    { hour: "10AM", count: 65 },
    { hour: "11AM", count: 54 },
    { hour: "12PM", count: 38 },
    { hour: "1PM", count: 42 },
    { hour: "2PM", count: 58 },
    { hour: "3PM", count: 44 },
];

export const commonAlerts = [
    { alert: "Elevated Temperature", count: 42 },
    { alert: "Low SpO2", count: 28 },
    { alert: "High Heart Rate", count: 19 },
    { alert: "Incomplete Height", count: 14 },
    { alert: "Sensor Timeout", count: 9 },
];

export const heatmapData = [
    { day: "Mon", hours: [2, 8, 14, 18, 12, 6, 3] },
    { day: "Tue", hours: [3, 10, 16, 20, 14, 7, 4] },
    { day: "Wed", hours: [2, 9, 15, 19, 13, 6, 3] },
    { day: "Thu", hours: [4, 12, 18, 22, 16, 8, 5] },
    { day: "Fri", hours: [5, 14, 20, 24, 18, 9, 6] },
    { day: "Sat", hours: [1, 4, 8, 10, 7, 3, 2] },
    { day: "Sun", hours: [1, 3, 6, 8, 5, 2, 1] },
];

export const measurementAccuracy = [
    { metric: "Temperature", value: 96 },
    { metric: "Heart Rate", value: 92 },
    { metric: "SpO2", value: 94 },
    { metric: "Weight", value: 88 },
    { metric: "Height", value: 85 },
    { metric: "Barcode", value: 98 },
];

export const insights = [
    { title: "Most incomplete measurement", value: "Height sensor", detail: "11 sessions skipped module", trend: "down", change: 3 },
    { title: "Most active kiosk hour", value: "9:00 AM", detail: "72 measurements peak", trend: "up", change: 12 },
    { title: "Most repeated measurement", value: "Weight retry", detail: "18 retried readings", trend: "neutral", change: 0 },
    { title: "Most common alert type", value: "Low SpO2", detail: "28 alert events logged", trend: "up", change: 4 },
];

export const healthMetricsTable = [
    { id: 1, metric: "Temperature", average: "36.7°C", min: "35.8°C", max: "38.1°C", status: "Normal", trend: "+0.1%" },
    { id: 2, metric: "Heart Rate", average: "79 bpm", min: "62 bpm", max: "112 bpm", status: "Normal", trend: "+1.8%" },
    { id: 3, metric: "SpO2", average: "97.6%", min: "91%", max: "99%", status: "Needs Review", trend: "+0.4%" },
    { id: 4, metric: "BMI", average: "22.4", min: "16.8", max: "31.8", status: "Normal", trend: "+0.3%" },
];

export const topAlertsTable = [
    { id: 1, type: "Elevated Temperature", count: 42, severity: "high", change: "+8" },
    { id: 2, type: "Low SpO2", count: 28, severity: "medium", change: "+4" },
    { id: 3, type: "High Heart Rate", count: 19, severity: "medium", change: "+2" },
    { id: 4, type: "Incomplete Height", count: 14, severity: "low", change: "-1" },
];

export const recentAnalyticsTable = [
    { id: 1, event: "Weekly vitals spike", module: "Temperature", time: "Today, 9:40 AM", impact: "Needs Review" },
    { id: 2, event: "Session completion improved", module: "Sessions", time: "Today, 8:15 AM", impact: "Normal" },
    { id: 3, event: "SpO2 alert cluster", module: "SpO2", time: "Yesterday, 2:20 PM", impact: "Alert" },
];

export const devicePerformance = [
    { name: "Temperature Sensor Accuracy", score: 96, caption: "Stable clinic readings" },
    { name: "Weight Sensor Stability", score: 88, caption: "Minor retry variance" },
    { name: "Height Sensor Consistency", score: 85, caption: "Calibration recommended" },
    { name: "Heart Rate Sensor Performance", score: 92, caption: "MAX30102 performing well" },
];

export const comparisons = [
    { label: "Today vs Yesterday", current: 342, previous: 298, unit: "measurements" },
    { label: "This Week vs Last Week", current: 93, previous: 89, unit: "% completion" },
    { label: "Student vs Teacher", current: 88, previous: 72, unit: "daily avg" },
    { label: "Completed vs Incomplete", current: 318, previous: 24, unit: "sessions" },
];
