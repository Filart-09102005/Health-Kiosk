import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    DEFAULT_NO_DETECTION_TIMEOUT_MS,
    stageTableFor,
    WAITING_ICON,
} from "../constants/measurementStages";

// How far into a stage's own band the bar may creep before the next real
// event. Stopping short is what keeps a boundary meaningful: crossing one
// always means something actually happened.
const BAND_CEILING = 0.94;

const easeOut = (t) => 1 - Math.pow(1 - t, 2.2);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Truthful progress for the Reading step.
 *
 * Deliberately separate from the acquisition pacer in MeasurementFlowShell:
 * that timer decides *when the reading is taken*, this decides *what the bar
 * is allowed to claim*. Keeping them apart is what lets the bar be honest
 * without changing a single thing about how a measurement is captured.
 *
 * @param {object}  options
 * @param {string}  options.type            Measurement type key.
 * @param {boolean} options.active          True while the Reading step is on screen.
 * @param {string}  options.machineState    Real firmware state.
 * @param {boolean} options.detected        Sensor currently sees the person.
 * @param {boolean} options.settled         Reading is finalised (COMPLETE + a result).
 * @param {boolean} options.failed          Reading failed.
 * @param {number}  [options.durationMs]    Override the table's reading window.
 * @param {number}  [options.attempt]       Bump to start a fresh attempt.
 */
export function useMeasurementProgress({
    type,
    active,
    machineState,
    detected,
    settled,
    failed,
    durationMs,
    attempt = 0,
}) {
    const table = useMemo(() => stageTableFor(type), [type]);
    const stages = table.stages;
    const windowMs = durationMs || table.durationMs;

    const [progress, setProgress] = useState(0);
    const [stageIndex, setStageIndex] = useState(-1);
    // True once the sensor has seen the person at least once this attempt.
    const [everDetected, setEverDetected] = useState(false);
    // Detection was established and then lost — distinct from "not started".
    const [lost, setLost] = useState(false);
    // No detection at all within the timeout: the caller opens the retry dialog.
    const [notDetected, setNotDetected] = useState(false);

    // Monotonic floor. The bar never walks backwards except on an explicit
    // reset, which would otherwise read as the machine changing its mind.
    const floorRef = useRef(0);
    const detectedAtRef = useRef(null);
    // Time already banked before a detection loss, so resuming continues from
    // where it paused rather than restarting the clock.
    const bankedMsRef = useRef(0);

    const reset = () => {
        floorRef.current = 0;
        detectedAtRef.current = null;
        bankedMsRef.current = 0;
        setProgress(0);
        setStageIndex(-1);
        setEverDetected(false);
        setLost(false);
        setNotDetected(false);
    };

    // Fresh attempt whenever the Reading step (re)starts, or the person asks
    // to try again without leaving the step. This hook's state outlives a
    // single measurement (the same component instance is reused across
    // retakes), so a plain useEffect here would let the browser paint one
    // frame of the *previous* measurement's leftover 100% before resetting —
    // a visible "100 down to 0" flash. useLayoutEffect resets synchronously
    // before that paint happens.
    useLayoutEffect(() => {
        if (!active) return;
        reset();
    }, [active, type, attempt]);

    // Track detection edges.
    useEffect(() => {
        if (!active) return;

        if (detected) {
            setLost(false);
            setEverDetected(true);
            setNotDetected(false);
            if (detectedAtRef.current === null) detectedAtRef.current = performance.now();
            return;
        }

        // Lost after having been detected.
        if (detectedAtRef.current !== null) {
            bankedMsRef.current += performance.now() - detectedAtRef.current;
            detectedAtRef.current = null;
            setLost(true);

            if (table.onLost === "reset") {
                floorRef.current = 0;
                bankedMsRef.current = 0;
                setProgress(0);
                setStageIndex(-1);
            }
        }
    }, [active, detected, table.onLost]);

    // "Nobody ever showed up" timeout. Only runs while genuinely waiting, so a
    // slow-but-progressing reading is never interrupted.
    useEffect(() => {
        if (!active || everDetected || settled || failed) return undefined;

        const timer = window.setTimeout(() => setNotDetected(true), DEFAULT_NO_DETECTION_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [active, everDetected, settled, failed]);

    // Drive the bar.
    useEffect(() => {
        if (!active) return undefined;

        if (failed) return undefined;

        if (settled) {
            floorRef.current = 100;
            setProgress(100);
            setStageIndex(stages.length - 1);
            return undefined;
        }

        // Nothing detected yet, or detection lost on a sensor that resets:
        // hold where we are and let the copy do the talking.
        if (!detected) return undefined;

        let raf;

        const tick = () => {
            const elapsed = bankedMsRef.current + (detectedAtRef.current !== null
                ? performance.now() - detectedAtRef.current
                : 0);

            // Where the clock alone would put us.
            const totalWeight = stages.slice(0, -1).reduce((sum, s) => sum + (s.weight || 1), 0);
            let remaining = (elapsed / windowMs) * totalWeight;
            let byTime = 0;
            for (let i = 0; i < stages.length - 1; i += 1) {
                const w = stages[i].weight || 1;
                if (remaining < w) break;
                remaining -= w;
                byTime = i + 1;
            }
            const withinStage = (() => {
                const w = stages[byTime]?.weight || 1;
                return clamp(remaining / w, 0, 1);
            })();

            // Where the real firmware state says we are.
            let byState = -1;
            stages.forEach((stage, i) => {
                if (stage.states?.includes(machineState)) byState = i;
            });

            // Forward-only: hardware can pull the bar ahead, never drag it back.
            const index = clamp(Math.max(byTime, byState, 0), 0, stages.length - 2);

            const stage = stages[index];
            const next = stages[index + 1];
            const band = next.at - stage.at;
            // Only the segment the clock is actually inside gets eased; jumping
            // ahead on a state change lands at that stage's floor.
            const eased = index === byTime ? easeOut(withinStage) * BAND_CEILING : 0;
            const value = stage.at + band * eased;

            if (value > floorRef.current) floorRef.current = value;

            setProgress(floorRef.current);
            setStageIndex(index);

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, detected, settled, failed, machineState, stages, windowMs]);

    const stage = stageIndex >= 0 ? stages[stageIndex] : null;

    const label = settled
        ? "Measurement Complete"
        : lost
            ? table.lostLabel
            : !everDetected
                ? table.waitingLabel
                : stage?.label || table.waitingLabel;

    const hint = settled
        ? null
        : lost
            ? table.lostHint
            : !everDetected
                ? table.waitingHint
                : null;

    return {
        progress: settled ? 100 : progress,
        label,
        hint,
        icon: stage?.icon && everDetected && !lost ? stage.icon : WAITING_ICON,
        waiting: !everDetected,
        lost,
        notDetected,
        // The bar should only shimmer while something is genuinely in flight.
        indeterminate: everDetected && !lost && !settled && !failed,
        acknowledgeNotDetected: () => setNotDetected(false),
    };
}
