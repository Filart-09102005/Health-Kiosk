import axios from "axios";
import { authService } from "../../../Auth/services/authService";
import { notifyNotificationsChanged } from "../../utils/notifications";

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

    async save(payload) {
        const response = await withCsrf(() => axios.post("/api/user/measurements", payload));

        // The server re-derives this user's notifications from the saved record,
        // so tell any bell on screen to re-read its count rather than waiting
        // for the next page load.
        notifyNotificationsChanged();

        return response;
    },

    getLiveVitals(signal) {
        return axios.get("/api/kiosk/live-vitals", { signal });
    },

    resetLiveVitals() {
        return axios.post("/api/kiosk/live-vitals", { reset: true, mode: "IDLE" });
    },

    command(command) {
        return axios.post("/api/kiosk/command", { command });
    },
};
