import { useEffect, useState } from "react";
import { nextSimulatedReading } from "../services/simulationService";

export default function useMeasurementSimulation(type, running) {
    const [tick, setTick] = useState(0);
    const [reading, setReading] = useState(() => nextSimulatedReading(type, 0));

    useEffect(() => {
        if (! running) return undefined;

        setTick(0);
        setReading(nextSimulatedReading(type, 0));

        const timer = window.setInterval(() => {
            setTick((current) => {
                const nextTick = current + 1;
                setReading(nextSimulatedReading(type, nextTick));

                return nextTick;
            });
        }, 420);

        return () => window.clearInterval(timer);
    }, [running, type]);

    return reading;
}
