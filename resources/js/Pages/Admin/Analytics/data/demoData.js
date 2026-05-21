export const overviewMetrics = [
    { key: "temp", label: "Average Temperature", value: "36.7°C", change: -0.2, trend: "down", icon: "temp", spark: [36.4, 36.6, 36.7, 36.5, 36.8, 36.7, 36.6] },
    { key: "hr", label: "Average Heart Rate", value: "79 bpm", change: 1.8, trend: "up", icon: "hr", spark: [74, 76, 78, 81, 79, 77, 80] },
    { key: "spo2", label: "Average SpO2", value: "97.6%", change: 0.4, trend: "up", icon: "spo2", spark: [97, 98, 97, 98, 97, 98, 98] },
    { key: "bmi", label: "Average BMI", value: "22.4", change: 0.3, trend: "up", icon: "bmi", spark: [21.8, 22.1, 22.3, 22.5, 22.2, 22.4, 22.4] },
    { key: "today", label: "Total Measurements Today", value: 342, change: 12.4, trend: "up", icon: "measure", spark: [280, 295, 310, 330, 342, 318, 342] },
    { key: "completed", label: "Completed Sessions", value: 318, change: 9.1, trend: "up", icon: "completed", spark: [290, 300, 305, 312, 318, 301, 318] },
    { key: "incomplete", label: "Incomplete Sessions", value: 24, change: -5.2, trend: "down", icon: "incomplete", spark: [32, 28, 26, 25, 24, 27, 24] },
    { key: "alerts", label: "Active Alerts", value: 18, change: 2.1, trend: "up", icon: "alerts", spark: [12, 14, 15, 16, 18, 17, 18] },
    { key: "completion", label: "Measurement Completion Rate", value: "93%", change: 1.6, trend: "up", icon: "rate", spark: [88, 89, 90, 91, 92, 93, 93] },
    { key: "duration", label: "Average Session Duration", value: "3m 42s", change: -4.0, trend: "down", icon: "duration", spark: [240, 235, 228, 225, 222, 220, 222] },
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
    { name: "Watch", value: 26 },
    { name: "Alert", value: 18 },
    { name: "Incomplete", value: 12 },
];

export const measurementCompletion = { completed: 93, incomplete: 7 };

export const weeklyAnalytics = [
    { week: "W1", temperature: 36.5, heartRate: 77, spo2: 97.4 },
    { week: "W2", temperature: 36.6, heartRate: 78, spo2: 97.6 },
    { week: "W3", temperature: 36.7, heartRate: 79, spo2: 97.8 },
    { week: "W4", temperature: 36.8, heartRate: 80, spo2: 97.9 },
];

export const monthlyAnalytics = [
    { month: "Jan", vitals: 820, bmi: 640, sessions: 760 },
    { month: "Feb", vitals: 880, bmi: 690, sessions: 810 },
    { month: "Mar", vitals: 940, bmi: 720, sessions: 860 },
    { month: "Apr", vitals: 1010, bmi: 780, sessions: 920 },
    { month: "May", vitals: 1080, bmi: 840, sessions: 980 },
];

export const sessionAnalytics = [
    { name: "Completed", value: 318 },
    { name: "Incomplete", value: 24 },
    { name: "Timeout", value: 8 },
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
    { title: "Most common abnormal reading", value: "Elevated temperature", detail: "42 cases this week", trend: "up", change: 8 },
    { title: "Most incomplete measurement", value: "Height sensor", detail: "11 sessions skipped module", trend: "down", change: 3 },
    { title: "Highest BMI recorded", value: "31.8", detail: "Student screening on Thu", trend: "up", change: 0.6 },
    { title: "Lowest SpO2 detected", value: "91%", detail: "Flagged for nurse review", trend: "down", change: 2 },
    { title: "Most active kiosk hour", value: "9:00 AM", detail: "72 measurements peak", trend: "up", change: 12 },
    { title: "Average daily sessions", value: "68", detail: "Across all kiosk units", trend: "up", change: 5 },
    { title: "Most repeated measurement", value: "Weight retry", detail: "18 retried readings", trend: "neutral", change: 0 },
    { title: "Most common alert type", value: "Low SpO2", detail: "28 alert events logged", trend: "up", change: 4 },
];

export const healthMetricsTable = [
    { id: 1, metric: "Temperature", average: "36.7°C", min: "35.8°C", max: "38.1°C", status: "Normal", trend: "+0.1%" },
    { id: 2, metric: "Heart Rate", average: "79 bpm", min: "62 bpm", max: "112 bpm", status: "Normal", trend: "+1.8%" },
    { id: 3, metric: "SpO2", average: "97.6%", min: "91%", max: "99%", status: "Watch", trend: "+0.4%" },
    { id: 4, metric: "BMI", average: "22.4", min: "16.8", max: "31.8", status: "Normal", trend: "+0.3%" },
];

export const topAlertsTable = [
    { id: 1, type: "Elevated Temperature", count: 42, severity: "high", change: "+8" },
    { id: 2, type: "Low SpO2", count: 28, severity: "medium", change: "+4" },
    { id: 3, type: "High Heart Rate", count: 19, severity: "medium", change: "+2" },
    { id: 4, type: "Incomplete Height", count: 14, severity: "low", change: "-1" },
];

export const recentAnalyticsTable = [
    { id: 1, event: "Weekly vitals spike", module: "Temperature", time: "Today, 9:40 AM", impact: "Watch" },
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
