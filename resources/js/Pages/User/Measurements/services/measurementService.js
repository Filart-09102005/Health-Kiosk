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

    save(payload) {
        return withCsrf(() => axios.post("/api/user/measurements", payload));
    },
};
