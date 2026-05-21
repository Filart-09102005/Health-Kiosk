import { useCallback, useState } from "react";

export default function useMeasurementTracker(initial = {}) {
    const [measurements, setMeasurements] = useState(initial);

    const upsert = useCallback((type, payload) => {
        setMeasurements((current) => ({ ...current, [type]: payload }));
    }, []);

    return { measurements, upsert };
}
