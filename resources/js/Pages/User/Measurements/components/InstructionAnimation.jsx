import React from 'react';
import { motion } from 'framer-motion';

/**
 * InstructionAnimation
 *
 * Coded SVG animations — one per measurement type. No external media: the
 * kiosk shows these during Positioning, so they must render with no network,
 * no third-party player, and no asset pipeline.
 *
 * They all follow the same recipe: a 200x200 viewBox, shapes tinted with the
 * flow's `accent`, and a single looping motion that mimics what the person
 * should actually do.
 */

const SHELL =
    "relative w-64 h-64 mx-auto mb-8 rounded-3xl flex items-center justify-center overflow-hidden " +
    "bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-inner";

export default function InstructionAnimation({ type, accent }) {
    // ----------- Weight (step onto the platform and stand still) -----------
    if (type === "weight") {
        return (
            <div className={SHELL}>
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Person settling their weight onto the platform */}
                    <motion.g
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Head */}
                        <circle cx="100" cy="52" r="15" fill={accent} />
                        {/* Body */}
                        <rect x="90" y="72" width="20" height="46" rx="6" fill={accent} opacity="0.8" />
                        {/* Arms */}
                        <rect x="82" y="77" width="6" height="36" rx="3" fill={accent} opacity="0.6" />
                        <rect x="112" y="77" width="6" height="36" rx="3" fill={accent} opacity="0.6" />
                        {/* Legs — kept well apart so they don't read as one stem */}
                        <rect x="89" y="118" width="7" height="32" rx="3.5" fill={accent} opacity="0.6" />
                        <rect x="104" y="118" width="7" height="32" rx="3.5" fill={accent} opacity="0.6" />
                    </motion.g>

                    {/* Load-cell platform */}
                    <rect x="40" y="150" width="120" height="14" rx="6" fill={accent} opacity="0.85" />
                    <rect x="55" y="164" width="20" height="9" rx="3" fill={accent} opacity="0.45" />
                    <rect x="125" y="164" width="20" height="9" rx="3" fill={accent} opacity="0.45" />

                    {/* Readout settling on a number */}
                    <motion.g
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <rect x="70" y="178" width="60" height="16" rx="5" fill={accent} opacity="0.18" />
                        <rect x="80" y="184" width="11" height="4" rx="2" fill={accent} />
                        <rect x="95" y="184" width="11" height="4" rx="2" fill={accent} />
                        <rect x="110" y="184" width="11" height="4" rx="2" fill={accent} />
                    </motion.g>
                </svg>
            </div>
        );
    }

    // ----------- Heart Rate (slide a finger into the oximeter clip) -----------
    if (type === "heart_rate") {
        return (
            <div className={SHELL}>
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Finger easing into the clip, fingertip first */}
                    <motion.g
                        animate={{ x: [16, 0, 0, 16] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.85, 1] }}
                    >
                        <rect x="58" y="88" width="120" height="22" rx="11" fill={accent} opacity="0.32" />
                        {/* Knuckle crease */}
                        <rect x="120" y="90" width="2.5" height="18" rx="1" fill={accent} opacity="0.35" />
                    </motion.g>

                    {/* Clip jaws, drawn over the finger so they read as gripping it */}
                    <rect x="42" y="68" width="80" height="24" rx="8" fill={accent} opacity="0.9" />
                    <rect x="42" y="106" width="80" height="24" rx="8" fill={accent} opacity="0.9" />
                    {/* Hinge */}
                    <rect x="36" y="86" width="12" height="26" rx="5" fill={accent} opacity="0.7" />

                    {/* Optical sensor pulsing through the fingertip */}
                    {/* r is set as an attribute as well as animated: without a
                        starting value the first paint renders r="undefined"
                        and the browser rejects the element. */}
                    <motion.circle
                        cx="82" cy="99" r={5} fill={accent}
                        initial={{ r: 5, opacity: 0.35 }}
                        animate={{ r: [5, 8.5, 5], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* ECG trace sweeping across */}
                    <motion.path
                        d="M26,162 L58,162 L68,144 L79,180 L90,162 L118,162 L128,150 L138,174 L147,162 L176,162"
                        stroke={accent} strokeWidth="3" fill="none"
                        strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1], opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                </svg>
            </div>
        );
    }

    // ----------- Temperature (hold the gun a few cm from the forehead) -----------
    if (type === "temperature") {
        return (
            <div className={SHELL}>
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Head */}
                    <circle cx="136" cy="100" r="36" fill={accent} opacity="0.22" />
                    <circle cx="136" cy="100" r="36" stroke={accent} strokeWidth="2.5" fill="none" opacity="0.55" />
                    {/* Forehead target */}
                    <circle cx="118" cy="86" r="5" fill={accent} opacity="0.9" />

                    {/* Infrared thermometer, held steady at distance */}
                    <motion.g
                        animate={{ x: [0, -4, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Barrel */}
                        <rect x="26" y="76" width="46" height="27" rx="8" fill={accent} opacity="0.9" />
                        {/* Nozzle */}
                        <rect x="72" y="83" width="12" height="13" rx="4" fill={accent} />
                        {/* Grip */}
                        <rect x="40" y="100" width="15" height="28" rx="6" fill={accent} opacity="0.7" />
                        {/* Display */}
                        <rect x="34" y="83" width="20" height="12" rx="3" fill={accent} opacity="0.35" />
                    </motion.g>

                    {/* Infrared pulses travelling to the forehead */}
                    {[0, 0.45, 0.9].map((delay) => (
                        <motion.path
                            key={delay}
                            d="M88,80 Q97,90 88,100"
                            stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"
                            animate={{ x: [0, 22], opacity: [0, 0.85, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay, ease: "easeOut" }}
                        />
                    ))}
                </svg>
            </div>
        );
    }

    // ----------- Height (coded SVG — user's preferred design) -----------
    if (type === "height") {
        return (
            <div className={SHELL}>
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Sensor Top */}
                    <rect x="80" y="20" width="40" height="15" rx="4" fill={accent} opacity="0.8" />

                    {/* Person standing straight */}
                    <motion.g
                        initial={{ scaleY: 0.9, y: 15 }}
                        animate={{ scaleY: 1, y: 0 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        style={{ transformOrigin: 'bottom center' }}
                    >
                        {/* Head */}
                        <circle cx="100" cy="70" r="15" fill={accent} />
                        {/* Body */}
                        <rect x="90" y="90" width="20" height="50" rx="5" fill={accent} opacity="0.8" />
                        {/* Legs */}
                        <rect x="92" y="140" width="6" height="40" rx="3" fill={accent} opacity="0.6" />
                        <rect x="102" y="140" width="6" height="40" rx="3" fill={accent} opacity="0.6" />
                        {/* Arms */}
                        <rect x="82" y="95" width="6" height="40" rx="3" fill={accent} opacity="0.6" />
                        <rect x="112" y="95" width="6" height="40" rx="3" fill={accent} opacity="0.6" />
                    </motion.g>

                    {/* Ultrasonic Waves */}
                    <motion.path
                        d="M90,45 Q100,55 110,45"
                        stroke={accent} strokeWidth="2" fill="none"
                        animate={{ y: [0, 10, 20], opacity: [0.8, 0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.path
                        d="M85,55 Q100,70 115,55"
                        stroke={accent} strokeWidth="2" fill="none"
                        animate={{ y: [0, 10, 20], opacity: [0.8, 0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                </svg>
            </div>
        );
    }

    return null;
}
