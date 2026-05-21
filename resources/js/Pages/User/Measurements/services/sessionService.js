import axios from "axios";
import { authService } from "../../../Auth/services/authService";

export const sessionService = {
    current(signal) {
        return axios.get("/api/user/session", { signal });
    },

    async end() {
        await authService.ensureCsrfCookie();
        return axios.post("/api/user/session/end");
    },
};
