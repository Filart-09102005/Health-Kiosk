import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, XCircle } from "lucide-react";
import { measurementOptions, isMeasurementAvailable } from "../Measurements";

export default function SmartRecommendationScreen({ 
    completedKeys, 
    skippedKeys, 
    onSelectNext, 
    onSkip, 
    onFinish 
}) {
    const shouldReduceMotion = useReducedMotion();
    
    const remainingOptions = measurementOptions.filter(
        (opt) => !completedKeys.includes(opt.key) && !skippedKeys.includes(opt.key)
    );

    const completedOptions = measurementOptions.filter((opt) => completedKeys.includes(opt.key));

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl"
        >
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black md:text-5xl" style={{ color: "var(--color-primary)" }}>
                    Great job!
                </h1>
                
                {completedOptions.length > 0 && (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
                        <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
                            You have completed:
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {completedOptions.map((opt) => (
                                <span 
                                    key={opt.key}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                                    style={{
                                        backgroundColor: "color-mix(in srgb, var(--color-success) 10%, var(--color-card))",
                                        borderColor: "color-mix(in srgb, var(--color-success) 25%, transparent)",
                                        color: "var(--color-success)",
                                    }}
                                >
                                    <Check size={14} />
                                    {opt.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {remainingOptions.length > 0 ? (
                <>
                    <h2 className="mb-6 text-center text-xl font-bold" style={{ color: "var(--color-text)" }}>
                        What would you like to measure next?
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {remainingOptions.map((item) => {
                            const Icon = item.icon;
                            const unavailable = !isMeasurementAvailable(item.key);

                            return (
                                <div
                                    key={item.key}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border p-5 transition-all duration-300"
                                    style={{
                                        backgroundColor: "var(--color-card)",
                                        borderColor: "var(--color-border)",
                                    }}
                                >
                                    <div>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                                                style={{ backgroundColor: "var(--color-surface)" }}
                                            >
                                                <Icon size={26} style={{ color: "var(--color-primary)" }} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black leading-snug">{item.title}</h3>
                                                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                                                    {unavailable ? "Not available" : item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            disabled={unavailable}
                                            onClick={() => onSelectNext(item.key)}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 hk-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                                        >
                                            {unavailable ? "Not Connected" : "Start"}
                                            {!unavailable && <ArrowRight size={16} />}
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => onSkip(item.key)}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-all hk-soft-hover"
                                            style={{
                                                borderColor: "var(--color-border)",
                                                color: "var(--color-muted)",
                                            }}
                                        >
                                            <XCircle size={16} />
                                            Skip for Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={onFinish}
                            className="text-sm font-bold underline underline-offset-4 transition-colors hover:text-[var(--color-primary)]"
                            style={{ color: "var(--color-muted)" }}
                        >
                            Skip all remaining and view summary
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center">
                    <p className="mb-6 text-lg" style={{ color: "var(--color-muted)" }}>
                        You have finished all available health checks!
                    </p>
                    <button
                        type="button"
                        onClick={onFinish}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-black transition-all duration-300 hk-primary-hover"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}
                    >
                        View Health Summary
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
