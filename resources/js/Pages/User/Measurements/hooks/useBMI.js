import { useMemo } from "react";
import { calculateBMI } from "../services/bmiService";

export default function useBMI(height, weight) {
    return useMemo(() => calculateBMI(height, weight), [height, weight]);
}
