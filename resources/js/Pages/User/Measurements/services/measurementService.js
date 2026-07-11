import axios from "axios";
import { authService } from "../../../Auth/services/authService";

const withCsrf = async (callback) => {
    await authService.ensureCsrfCookie();

    try {
        return await callback();
    } catch (error) {
        if (error?.response?.status === 419) {
            await authService.ensureCsrfCookie({ refresh: true });
            return callback();
        }

        throw error;
    }
};

export const measurementService = {
    currentSession(signal) {
        return axios.get("/api/user/session", { signal });
    },

    summary(signal) {
        return axios.get("/api/user/measurements/summary", { signal });
    },

    records(signal, perPage = 100) {
        return axios.get("/api/user/health-records", { params: { per_page: perPage }, signal });
    },

    save(payload) {
        return withCsrf(() => axios.post("/api/user/measurements", payload));
    },

    resetLiveVitals() {
        return axios.post("/api/kiosk/live-vitals", { reset: true, mode: "IDLE" });
    },

    command(command) {
        return axios.post("/api/kiosk/command", { command });
    },
};
