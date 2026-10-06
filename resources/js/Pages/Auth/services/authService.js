import axios from "axios";

let csrfPromise = null;

const ensureCsrfCookie = async ({ refresh = false } = {}) => {
    if (refresh || ! csrfPromise) {
        csrfPromise = axios.get("/sanctum/csrf-cookie").catch((error) => {
            csrfPromise = null;
            throw error;
        });
    }

    return csrfPromise;
};

const withCsrf = async (request) => {
    await ensureCsrfCookie();

    try {
        return await request();
    } catch (error) {
        if (error?.response?.status === 419) {
            await ensureCsrfCookie({ refresh: true });
            return request();
        }

        throw error;
    }
};

export const authService = {
    ensureCsrfCookie,

    checkBarcode(barcode) {
        return withCsrf(() => axios.post("/api/auth/check-barcode", { barcode }));
    },

    checkEmail(email) {
        return withCsrf(() => axios.post("/api/auth/check-email", { email }));
    },

    register(payload) {
        return withCsrf(() => axios.post("/api/auth/register", payload));
    },

    login(payload) {
        return withCsrf(() => axios.post("/api/auth/login", payload));
    },

    barcodeLogin(payload) {
        return withCsrf(() => axios.post("/api/auth/barcode-login", payload));
    },

    logout() {
        return withCsrf(() => axios.post("/api/auth/logout"));
    },

    currentUser() {
        return axios.get("/api/auth/user");
    },

    updateProfile(payload) {
        return withCsrf(() => axios.put("/api/auth/user/profile", payload));
    },

    updatePassword(payload) {
        return withCsrf(() => axios.put("/api/auth/user/password", payload));
    },

    resendVerification(email) {
        return withCsrf(() => axios.post("/api/auth/email/verification-notification", { email }));
    },

    forgotPassword(email) {
        return withCsrf(() => axios.post("/api/auth/forgot-password", { email }));
    },

    resetPassword(payload) {
        return withCsrf(() => axios.post("/api/auth/reset-password", payload));
    },

    adminDashboard(params = {}) {
        return axios.get("/api/admin/dashboard", { params });
    },

    adminHealthRecords() {
        return axios.get("/api/admin/health-records", { params: { dashboard_ready: true } });
    },

    adminUsers(params = {}) {
        return axios.get("/api/admin/users", { params });
    },

    adminCreateUser(payload) {
        return withCsrf(() => axios.post("/api/admin/users", payload));
    },

    adminUpdateUser(id, payload) {
        return withCsrf(() => axios.put(`/api/admin/users/${id}`, payload));
    },

    adminDeleteUser(id) {
        return withCsrf(() => axios.delete(`/api/admin/users/${id}`));
    },

    adminImportUsers(file, role) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("role", role);
        return withCsrf(() => axios.post("/api/admin/users/import", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }));
    },

    adminVerifyUser(id) {
        return withCsrf(() => axios.post(`/api/admin/users/${id}/verify`));
    },

    adminToggleUserActive(id) {
        return withCsrf(() => axios.post(`/api/admin/users/${id}/toggle-active`));
    },

    adminSessions(params = {}) {
        return axios.get("/api/admin/sessions", { params });
    },

    adminActivityLogs(params = {}) {
        return axios.get("/api/admin/activity-logs", { params });
    },

    adminAlerts() {
        return axios.get("/api/admin/alerts");
    },

    adminAlertsUnreadCount() {
        return axios.get("/api/admin/alerts/unread-count");
    },

    adminAlertsQueue() {
        return axios.get("/api/admin/alerts/queue");
    },

    acknowledgeAlert(id) {
        return withCsrf(() => axios.post(`/api/admin/alerts/${id}/acknowledge`));
    },

    resolveAlert(id, payload) {
        return withCsrf(() => axios.post(`/api/admin/alerts/${id}/resolve`, payload));
    },

    resolveAllAlerts(severity) {
        return withCsrf(() => axios.post("/api/admin/alerts/resolve-all", severity ? { severity } : {}));
    },

    adminReports(params = {}) {
        return axios.get("/api/admin/reports", { params });
    },

    downloadReportData(params = {}) {
        return axios.get("/api/admin/reports/data", { params });
    },

    downloadReportPdf(params = {}) {
        return axios.get("/api/admin/reports/download-pdf", { params, responseType: "blob" });
    },

    downloadReportExcel(params = {}) {
        return axios.get("/api/admin/reports/download-excel", { params, responseType: "blob" });
    },

    adminReportFilterOptions() {
        return axios.get("/api/admin/reports/filter-options");
    },

    syncAdminUsersToCloud() {
        return withCsrf(() => axios.post("/api/admin/sync/users"));
    },

    adminSettings() {
        return axios.get("/api/admin/settings");
    },

    updateAdminSettings(settings) {
        return withCsrf(() => axios.put("/api/admin/settings", { settings }));
    },

    // Public - no admin session required. The floating keyboard needs this
    // before login, so it can't sit behind auth like the rest of Settings.
    kioskKeyboardSetting() {
        return axios.get("/api/settings/keyboard");
    },

    adminAnalytics(params = {}) {
        return axios.get("/api/admin/analytics", { params });
    },

    userDashboard() {
        return axios.get("/api/user/dashboard");
    },

    notifications(signal) {
        return axios.get("/api/user/notifications", { signal });
    },

    markNotificationsRead(ids) {
        return withCsrf(() => axios.post("/api/user/notifications/read", { ids }));
    },

    markAllNotificationsRead() {
        return withCsrf(() => axios.post("/api/user/notifications/read-all"));
    },
};

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    const data = error?.response?.data;
    
    if (data?.errors) {
        // Return the first validation error message encountered
        const firstErrorList = Object.values(data.errors)[0];
        if (Array.isArray(firstErrorList) && firstErrorList.length > 0) {
            return firstErrorList[0];
        }
    }

    if (data?.message) {
        return data.message;
    }

    if (data?.error) {
        return data.error;
    }

    return fallback;
}

export function getValidationErrors(error) {
    return error?.response?.data?.errors || {};
}
