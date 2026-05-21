export const dashboardStats = [
    { key: "students", label: "Total Students", value: 1248, change: 4.2, trend: "up", icon: "students" },
    { key: "teachers", label: "Total Teachers", value: 86, change: 1.1, trend: "up", icon: "teachers" },
    { key: "checks_today", label: "Health Checks Today", value: 342, change: 12.8, trend: "up", icon: "checks" },
    { key: "alerts", label: "Active Alerts", value: 7, change: -18.4, trend: "down", icon: "alerts" },
    { key: "completed", label: "Completed Sessions", value: 318, change: 9.3, trend: "up", icon: "completed" },
    { key: "incomplete", label: "Incomplete Sessions", value: 24, change: -6.2, trend: "down", icon: "incomplete" },
    { key: "active_sessions", label: "Active Kiosk Session", value: 1, change: 0, trend: "neutral", icon: "active" },
    { key: "devices_online", label: "Devices Online", value: 6, change: 0, trend: "neutral", icon: "devices" },
];

export const dailyHealthChecks = [
    { day: "Mon", checks: 280 },
    { day: "Tue", checks: 310 },
    { day: "Wed", checks: 295 },
    { day: "Thu", checks: 342 },
    { day: "Fri", checks: 368 },
    { day: "Sat", checks: 142 },
    { day: "Sun", checks: 98 },
];

export const healthStatusDistribution = [
    { name: "Normal", value: 68, color: "var(--color-success)" },
    { name: "Watch", value: 22, color: "var(--color-primary)" },
    { name: "Alert", value: 10, color: "var(--color-error)" },
];

export const bmiDistribution = [
    { range: "Under", count: 42 },
    { range: "Normal", count: 186 },
    { range: "Over", count: 78 },
    { range: "Obese", count: 36 },
];

export const temperatureAnalytics = [
    { time: "8AM", value: 36.4 },
    { time: "10AM", value: 36.6 },
    { time: "12PM", value: 36.8 },
    { time: "2PM", value: 36.7 },
    { time: "4PM", value: 36.5 },
];

export const heartRateAnalytics = [
    { time: "8AM", value: 74 },
    { time: "10AM", value: 78 },
    { time: "12PM", value: 82 },
    { time: "2PM", value: 79 },
    { time: "4PM", value: 76 },
];

export const spo2Analytics = [
    { time: "8AM", value: 98 },
    { time: "10AM", value: 97 },
    { time: "12PM", value: 98 },
    { time: "2PM", value: 97 },
    { time: "4PM", value: 98 },
];

export const sessionCompletion = [
    { name: "Completed", value: 93, color: "var(--color-success)" },
    { name: "Incomplete", value: 7, color: "var(--color-error)" },
];

export const recentHealthRecords = [
    { id: 1, name: "Hans Kurvey", barcode: "C-230204", vitals: "78 bpm · 98% · 36.6°C", bmi: 21.3, status: "Normal", date: "Today, 8:20 AM" },
    { id: 2, name: "Maria Santos", barcode: "C-230118", vitals: "88 bpm · 96% · 37.2°C", bmi: 23.8, status: "Watch", date: "Today, 8:45 AM" },
    { id: 3, name: "Faculty User", barcode: "F-1001", vitals: "92 bpm · 97% · 37.1°C", bmi: 24.2, status: "Watch", date: "Today, 9:05 AM" },
    { id: 4, name: "Juan Dela Cruz", barcode: "C-229901", vitals: "102 bpm · 94% · 37.8°C", bmi: 27.1, status: "Alert", date: "Today, 9:18 AM" },
    { id: 5, name: "Ana Reyes", barcode: "C-230045", vitals: "72 bpm · 99% · 36.4°C", bmi: 19.8, status: "Normal", date: "Today, 9:32 AM" },
];

export const recentAlerts = [
    { id: 1, student: "Juan Dela Cruz", type: "Elevated Temperature", severity: "high", time: "9:18 AM", status: "Open" },
    { id: 2, student: "Maria Santos", type: "Low SpO2", severity: "medium", time: "8:52 AM", status: "Reviewing" },
    { id: 3, student: "Kiosk Unit B", type: "Sensor Calibration", severity: "low", time: "8:10 AM", status: "Resolved" },
];

export const recentSessions = [
    { id: 1, schoolId: "C-230204", user: "Hans Kurvey", duration: "4m 12s", status: "Completed", started: "8:16 AM" },
    { id: 2, schoolId: "C-230118", user: "Maria Santos", duration: "3m 48s", status: "Completed", started: "8:41 AM" },
    { id: 3, schoolId: "C-229901", user: "Juan Dela Cruz", duration: "2m 05s", status: "Incomplete", started: "9:16 AM" },
];

export const recentActivityLogs = [
    { id: 1, action: "Health record exported", actor: "Admin", module: "Reports", time: "9:40 AM" },
    { id: 2, action: "Alert acknowledged", actor: "Nurse Reyes", module: "Alerts", time: "9:22 AM" },
    { id: 3, action: "Student profile updated", actor: "Admin", module: "Students", time: "8:55 AM" },
    { id: 4, action: "Kiosk session started", actor: "System", module: "Sessions", time: "8:16 AM" },
];

export const deviceStatuses = [
    { id: 1, name: "Arduino Controller", status: "online" },
    { id: 2, name: "MAX30102 Sensor", status: "online" },
    { id: 3, name: "Temperature Sensor", status: "online" },
    { id: 4, name: "Height Sensor", status: "warning" },
    { id: 5, name: "Weight Sensor", status: "online" },
    { id: 6, name: "Barcode Scanner", status: "online" },
    { id: 7, name: "Internet Connection", status: "online" },
];

export const activeSessions = [
    { id: 1, schoolId: "C-230512", measurement: "Heart Rate", duration: "1m 24s", status: "Measuring" },
];

export const quickActions = [
    { id: "report", label: "Generate Report", description: "Export clinic summary", icon: "report" },
    { id: "student", label: "Add Student", description: "Register new learner", icon: "student" },
    { id: "teacher", label: "Add Teacher", description: "Register faculty user", icon: "teacher" },
    { id: "export", label: "Export Records", description: "Download health data", icon: "export" },
    { id: "alerts", label: "View Alerts", description: "Open alert center", icon: "alerts" },
];
