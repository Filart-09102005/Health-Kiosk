import { useEffect, useState } from "react";

const healthTips = [
    "Stand in front of the kiosk before scanning your barcode.",
    "Keep your hand steady during sensor readings.",
    "Review your result before printing your summary.",
    "Ask the clinic staff if a reading looks unusual.",
];

const featureSlides = [
    {
        label: "Heart Rate",
        value: "BPM",
        guide: "Place your finger on the oximeter and keep your hand still.",
        accent: "#ef4444",
        line: "M4 40h95l16-26 22 48 24-38 28 16h327",
    },
    {
        label: "SpO2",
        value: "Oxygen",
        guide: "Keep your finger inside the sensor until the reading stabilizes.",
        accent: "#2563eb",
        line: "M4 38h88c26 0 26-18 52-18s26 36 52 36 26-18 52-18h268",
    },
    {
        label: "Weight",
        value: "KG",
        guide: "Step on the platform, stand straight, and avoid moving.",
        accent: "#16a34a",
        line: "M4 42h84l28-24h80l26 24h294",
    },
    {
        label: "Height",
        value: "CM",
        guide: "Stand upright under the sensor with your feet flat.",
        accent: "#7c3aed",
        line: "M4 46h110v-28h48v28h48v-28h48v28h258",
    },
    {
        label: "Body Temperature",
        value: "TEMP",
        guide: "Face the kiosk and stay still during the contactless scan.",
        accent: "#f59e0b",
        line: "M4 44h118c18 0 24-22 42-22s24 22 42 22h310",
    },
];

function Clock() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="text-right">
            <p className="text-xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
            <p className="text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
        </div>
    );
}

function HeartMark() {
    return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
            <rect width="42" height="42" rx="14" fill="url(#idleLogoGradient)" />
            <path
                d="M21 31s-10-6.1-10-13a5.6 5.6 0 0 1 10-3.5A5.6 5.6 0 0 1 31 18c0 6.9-10 13-10 13Z"
                fill="white"
            />
            <defs>
                <linearGradient id="idleLogoGradient" x1="6" y1="4" x2="37" y2="39" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function PulseLine({ slide }) {
    return (
        <svg className="h-16 w-full max-w-xl" viewBox="0 0 520 72" fill="none" aria-hidden="true">
            <path
                className="idle-pulse-line"
                d={slide.line}
                stroke={slide.accent}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d={slide.line}
                stroke="color-mix(in srgb, var(--color-primary) 22%, var(--color-border))"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
            />
        </svg>
    );
}

export default function Idle({ navigate }) {
    const [tipIndex, setTipIndex] = useState(0);
    const [slideIndex, setSlideIndex] = useState(0);
    const slide = featureSlides[slideIndex];

    useEffect(() => {
        const timer = window.setInterval(() => {
            setTipIndex((current) => (current + 1) % healthTips.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setSlideIndex((current) => (current + 1) % featureSlides.length);
        }, 4200);

        return () => window.clearInterval(timer);
    }, []);

    const openManually = () => {
        if (typeof navigate === "function") {
            navigate();
        }
    };

    return (
        <>
            <style>{`
                body, html {
                    overflow: hidden;
                    height: 100%;
                }

                @keyframes idlePulseDraw {
                    from {
                        stroke-dashoffset: 640;
                    }

                    to {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes idleSoftFloat {
                    0%, 100% {
                        transform: translateY(0);
                    }

                    50% {
                        transform: translateY(-8px);
                    }
                }

                .idle-pulse-line {
                    stroke-dasharray: 640;
                    animation: idlePulseDraw 2.8s ease-in-out infinite;
                }

                .idle-center-mark {
                    animation: idleSoftFloat 3.4s ease-in-out infinite;
                }

                .idle-feature-slide {
                    animation: idleFeatureIn 360ms ease-out;
                }

                @keyframes idleFeatureIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .idle-status-pill {
                    background: color-mix(in srgb, var(--color-card) 86%, transparent);
                    border-color: color-mix(in srgb, var(--color-primary) 16%, var(--color-border));
                    color: var(--color-text);
                }
            `}</style>

            <section
                className="relative flex h-screen w-screen overflow-hidden"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                onClick={openManually}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        openManually();
                    }
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent 42%, color-mix(in srgb, var(--color-primary-hover) 7%, transparent))",
                    }}
                />
                <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary) 42%, transparent), transparent)" }}
                />

                <div className="relative z-10 flex min-h-0 w-full flex-col px-8 py-6">
                    <header className="flex shrink-0 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HeartMark />
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: "var(--color-primary)" }}>Health Kiosk</p>
                                <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>Student and Teacher Access</p>
                            </div>
                        </div>

                        <Clock />
                    </header>

                    <main className="flex flex-1 items-center justify-center">
                        <div key={slide.label} className="idle-feature-slide mx-auto flex w-full max-w-5xl flex-col items-center text-center">
                            <div
                                className="idle-center-mark mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] text-white shadow-2xl"
                                style={{ backgroundColor: slide.accent, boxShadow: `0 26px 70px ${slide.accent}33` }}
                            >
                                <span className="text-2xl font-black tracking-tight">{slide.value}</span>
                            </div>

                            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em]" style={{ color: "var(--color-primary)" }}>
                                Guided health check
                            </p>

                            <h1 className="max-w-4xl text-6xl font-black leading-[1.02] tracking-tight" style={{ color: "var(--color-text)" }}>
                                {slide.label}
                            </h1>

                            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8" style={{ color: "var(--color-muted)" }}>
                                {slide.guide}
                            </p>

                            <div className="mt-10 flex w-full justify-center">
                                <PulseLine slide={slide} />
                            </div>

                            <div className="mt-7 flex items-center justify-center gap-2" onClick={(event) => event.stopPropagation()}>
                                {featureSlides.map((item, index) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        aria-label={`Show ${item.label}`}
                                        onClick={() => setSlideIndex(index)}
                                        className="h-2.5 rounded-full transition-all"
                                        style={{
                                            width: index === slideIndex ? "2rem" : "0.65rem",
                                            backgroundColor: index === slideIndex ? item.accent : "color-mix(in srgb, var(--color-muted) 34%, transparent)",
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                                {["Scan barcode first", "Follow guided steps", "Save final result"].map((item) => (
                                    <span
                                        key={item}
                                        className="idle-status-pill inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-sm"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </main>

                    <footer className="flex shrink-0 items-center justify-between gap-5 border-t pt-5" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 16%, var(--color-border))" }}>
                        <p className="text-sm font-bold" style={{ color: "var(--color-muted)" }}>{healthTips[tipIndex]}</p>
                        <p className="whitespace-nowrap text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--color-primary)" }}>
                            Tap anywhere to continue manually
                        </p>
                    </footer>
                </div>
            </section>
        </>
    );
}
