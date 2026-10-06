import { useEffect, useState, useRef } from "react";
import { measurementService } from "../services/measurementService";

export function useMeasurementWorkflow(type, isRunning, sessionId) {
    const [state, setState] = useState({
        machineState: "WAITING",
        liveData: null,
        finalResult: null,
        error: null
    });

    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!isRunning || !sessionId) return;

        let alive = true;
        let pollTimer = null;
        let noResponseTimer = null;
        let gotSensorData = false;
        let timedOut = false;
        
        const abortController = new AbortController();

        // 5-second timeout: if no real sensor data arrives, show FAILED and stop polling
        noResponseTimer = window.setTimeout(() => {
            if (!gotSensorData && alive) {
                timedOut = true;
                // Stop any pending poll
                if (pollTimer) { window.clearTimeout(pollTimer); pollTimer = null; }
                setState({
                    machineState: "FAILED",
                    liveData: null,
                    finalResult: null,
                    error: "No sensor response. Check hardware connection and try again."
                });
            }
        }, 5000);

        const poll = async () => {
            if (!alive || timedOut) return;

            try {
                const response = await measurementService.getLiveVitals(abortController.signal);
                const data = response.data;
                
                // Don't overwrite if we already timed out
                if (timedOut) return;

                // If it's a completely different session, ignore
                if (data.session_id && data.session_id !== sessionId) {
                    // Do nothing
                } else {
                    const ms = data.machine_state || "WAITING";

                    // Any state beyond IDLE means real sensor data arrived (including WAITING)
                    if (ms !== "IDLE") {
                        gotSensorData = true;
                        if (noResponseTimer) { window.clearTimeout(noResponseTimer); noResponseTimer = null; }
                    }

                    setState({
                        machineState: ms,
                        liveData: data.live_data || null,
                        finalResult: data.final_result || null,
                        error: data.error || null
                    });
                }
                
                if (data.machine_state === "COMPLETE" || data.machine_state === "FAILED" || data.machine_state === "ERROR") {
                    pollTimer = window.setTimeout(poll, 1500);
                } else {
                    pollTimer = window.setTimeout(poll, 500);
                }

            } catch (err) {
                if (err.name !== 'CanceledError' && err.message !== 'canceled') {
                    console.error("Live vitals poll error:", err);
                    if (!timedOut) pollTimer = window.setTimeout(poll, 2000);
                }
            }
        };

        poll();

        return () => {
            alive = false;
            abortController.abort();
            if (pollTimer) window.clearTimeout(pollTimer);
            if (noResponseTimer) window.clearTimeout(noResponseTimer);
            
            // Send STOP command to cancel any active hardware measurement
            measurementService.command("STOP").catch(() => {});
        };
    }, [isRunning, sessionId]);

    return state;
}
