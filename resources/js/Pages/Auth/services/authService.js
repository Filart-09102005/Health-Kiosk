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

    resendVerification(email) {
        return withCsrf(() => axios.post("/api/auth/email/verification-notification", { email }));
    },

    forgotPassword(email) {
        return withCsrf(() => axios.post("/api/auth/forgot-password", { email }));
    },

    resetPassword(payload) {
        return withCsrf(() => axios.post("/api/auth/reset-password", payload));
    },

    adminDashboard() {
        return axios.get("/api/admin/dashboard");
    },

    adminAnalytics() {
        return axios.get("/api/admin/analytics");
    },

    userDashboard() {
        return axios.get("/api/user/dashboard");
    },
};

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    const validationErrors = error?.response?.data?.errors;

    if (validationErrors) {
        return Object.values(validationErrors).flat().at(0) || fallback;
    }

    return fallback;
}

export function getValidationErrors(error) {
    return error?.response?.data?.errors || {};
}
