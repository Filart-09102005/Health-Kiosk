import { useState, useEffect, useRef } from "react";

const slides = [
  {
    id: 0,
    tag: "WELCOME",
    headline: "Your Health Check\nStarts Here",
    desc: "Fast, accurate, and contactless health assessment for every student — results in minutes.",
    cta: "Scan Barcode to Begin",
    accent: "#2563EB",
    accentLight: "#EFF6FF",
    visual: <WelcomeVisual />,
  },
  {
    id: 1,
    tag: "VITAL SIGNS",
    headline: "Monitor Your\nVital Signs",
    desc: "Get accurate health readings in just a few minutes using our advanced biosensors.",
    features: [
      { icon: "❤️", label: "Heart Rate" },
      { icon: "🫁", label: "SpO₂ Level" },
      { icon: "🌡", label: "Body Temp" },
    ],
    accent: "#0EA5E9",
    accentLight: "#F0F9FF",
    visual: <VitalsVisual />,
  },
  {
    id: 2,
    tag: "BODY METRICS",
    headline: "Automatic Height &\nWeight Measurement",
    desc: "Instant measurements with real-time BMI analysis and personalized health insights.",
    features: [
      { icon: "📏", label: "Height Detection" },
      { icon: "⚖", label: "Weight Measurement" },
      { icon: "📊", label: "BMI Computation" },
    ],
    accent: "#06B6D4",
    accentLight: "#ECFEFF",
    visual: <BodyVisual />,
  },
  {
    id: 3,
    tag: "HEALTH REPORT",
    headline: "Receive Your\nHealth Summary",
    desc: "Print and review your complete health assessment with historical trend analysis.",
    features: [
      { icon: "📄", label: "Health Report" },
      { icon: "🖨", label: "Receipt Printing" },
      { icon: "📈", label: "Historical Records" },
    ],
    accent: "#8B5CF6",
    accentLight: "#F5F3FF",
    visual: <ReportVisual />,
  },
];

const tips = [
  "💡 Stay hydrated — drink 8 glasses of water daily",
  "💡 Exercise regularly for at least 30 minutes a day",
  "💡 Get 8–10 hours of sleep every night",
  "💡 Monitor your health with regular check-ups",
  "💡 Maintain a healthy weight through balanced diet",
  "💡 Eat nutritious meals rich in vitamins and minerals",
  "💡 Wash your hands frequently to prevent illness",
  "💡 Limit screen time and take breaks every hour",
];

function WelcomeVisual() {
  const [beat, setBeat] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setBeat(b => !b), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 60% 40%, rgba(37,99,235,0.18) 0%, transparent 70%)",
      }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%",
          background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: beat ? "0 0 0 24px rgba(37,99,235,0.12), 0 0 0 48px rgba(37,99,235,0.06)" : "0 0 0 0px rgba(37,99,235,0)",
          transition: "box-shadow 0.6s ease",
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <path d="M36 58C36 58 12 44 12 26C12 18.27 18.27 12 26 12C30.42 12 34.35 14.18 36 17.5C37.65 14.18 41.58 12 46 12C53.73 12 60 18.27 60 26C60 44 36 58 36 58Z" fill="white" fillOpacity="0.95"/>
          </svg>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {["🔬", "🩺", "💊", "🧬"].map((e, i) => (
            <div key={i} style={{
              width: 52, height: 52, borderRadius: 16,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(37,99,235,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              animation: `float ${1.4 + i * 0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`,
            }}>{e}</div>
          ))}
        </div>
        <HeartbeatLine color="#2563EB" />
      </div>
    </div>
  );
}

function VitalsVisual() {
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.6);
  useEffect(() => {
    const t = setInterval(() => {
      setBpm(Math.floor(70 + Math.random() * 10));
      setSpo2(Math.floor(97 + Math.random() * 3));
      setTemp(+(36.4 + Math.random() * 0.6).toFixed(1));
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", padding: "0 8px" }}>
      <HeartbeatLine color="#EF4444" animated />
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "BPM", value: bpm, color: "#EF4444", icon: "❤️", unit: "" },
          { label: "SpO₂", value: spo2, color: "#0EA5E9", icon: "🫁", unit: "%" },
          { label: "Temp", value: temp, color: "#F59E0B", icon: "🌡", unit: "°C" },
        ].map(m => (
          <div key={m.label} style={{
            flex: 1, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
            borderRadius: 16, padding: "16px 12px", textAlign: "center",
            border: `1.5px solid ${m.color}22`,
            boxShadow: `0 4px 20px ${m.color}15`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1, fontFamily: "'Outfit', sans-serif", letterSpacing: -1 }}>
              {m.value}{m.unit}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyVisual() {
  const [bmi, setBmi] = useState(21.4);
  useEffect(() => {
    const t = setInterval(() => setBmi(+(19 + Math.random() * 7).toFixed(1)), 3000);
    return () => clearInterval(t);
  }, []);
  const bmiColor = bmi < 18.5 ? "#0EA5E9" : bmi < 25 ? "#22C55E" : bmi < 30 ? "#F59E0B" : "#EF4444";
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", alignItems: "center" }}>
      <div style={{
        width: "100%", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderRadius: 20, padding: "20px 24px",
        border: "1.5px solid rgba(6,182,212,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>BMI Index</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: bmiColor, lineHeight: 1, fontFamily: "'Outfit', sans-serif", letterSpacing: -2, transition: "color 0.5s" }}>{bmi}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: bmiColor + "22", color: bmiColor, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: `1px solid ${bmiColor}44` }}>{bmiLabel}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Real-time analysis</div>
          </div>
        </div>
        <BmiBar value={bmi} />
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        {[{ icon: "📏", label: "Height", val: "165 cm" }, { icon: "⚖", label: "Weight", val: "58 kg" }].map(m => (
          <div key={m.label} style={{
            flex: 1, background: "rgba(255,255,255,0.75)", borderRadius: 14, padding: "14px",
            border: "1px solid rgba(6,182,212,0.15)", textAlign: "center",
          }}>
            <div style={{ fontSize: 20 }}>{m.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", fontFamily: "'Outfit', sans-serif" }}>{m.val}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BmiBar({ value }) {
  const pct = Math.min(Math.max((value - 10) / 30 * 100, 0), 100);
  return (
    <div style={{ position: "relative", height: 8, borderRadius: 8, overflow: "hidden", background: "linear-gradient(90deg, #0EA5E9 0%, #22C55E 33%, #F59E0B 66%, #EF4444 100%)" }}>
      <div style={{
        position: "absolute", top: -4, left: `${pct}%`, width: 16, height: 16,
        background: "white", borderRadius: "50%", border: "3px solid #0F172A",
        transform: "translateX(-50%)", transition: "left 0.8s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function ReportVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
        borderRadius: 20, padding: "18px 20px",
        border: "1.5px solid rgba(139,92,246,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#8B5CF6" }}>SMCBI Health Report</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>May 30, 2026 · 08:00 AM</div>
          </div>
          <div style={{ background: "#22C55E22", color: "#16A34A", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ NORMAL</div>
        </div>
        {[
          { label: "Heart Rate", value: "74 bpm", bar: 0.62 },
          { label: "SpO₂", value: "98%", bar: 0.98 },
          { label: "Temperature", value: "36.5°C", bar: 0.73 },
          { label: "BMI", value: "21.4", bar: 0.54 },
        ].map(row => (
          <div key={row.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#475569" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{row.value}</span>
            </div>
            <div style={{ height: 4, background: "#F1F5F9", borderRadius: 4 }}>
              <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #8B5CF6, #06B6D4)", width: `${row.bar * 100}%`, transition: "width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "rgba(139,92,246,0.1)", borderRadius: 12, padding: "10px", textAlign: "center", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div style={{ fontSize: 18 }}>🖨</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>Print Receipt</div>
        </div>
        <div style={{ flex: 1, background: "rgba(6,182,212,0.1)", borderRadius: 12, padding: "10px", textAlign: "center", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div style={{ fontSize: 18 }}>📈</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0891B2" }}>View History</div>
        </div>
      </div>
    </div>
  );
}

function HeartbeatLine({ color = "#EF4444", animated = false }) {
  const points = "0,30 30,30 40,10 50,50 60,5 70,40 80,30 160,30";
  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg width="100%" height="50" viewBox="0 0 200 60" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={animated ? { strokeDasharray: 300, strokeDashoffset: 0, animation: "dash 2s linear infinite" } : {}} />
      </svg>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: -0.5, fontFamily: "'Outfit', sans-serif" }}>{timeStr}</div>
      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{dateStr}</div>
    </div>
  );
}

function Ticker() {
  const text = tips.join("   ·   ") + "   ·   ";
  return (
    <div style={{ overflow: "hidden", background: "linear-gradient(90deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06))", borderTop: "1px solid rgba(37,99,235,0.1)", padding: "10px 0" }}>
      <div style={{ display: "flex", animation: "ticker 40s linear infinite", whiteSpace: "nowrap" }}>
        {[text, text].map((t, i) => (
          <span key={i} style={{ fontSize: 13, color: "#334155", fontWeight: 500, paddingRight: 0 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Idle() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animDir, setAnimDir] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = (next, dir = 1) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setAnimDir(dir);
    setPrev(current);
    setCurrent(next);
    setTimeout(() => { setPrev(null); setIsTransitioning(false); }, 600);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % slides.length;
        goTo(next, 1);
        return c;
      });
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [isTransitioning]);

  const slide = slides[current];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { overflow: hidden; height: 100%; }
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes dash {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .dot { cursor: pointer; transition: all 0.3s; }
        .dot:hover { transform: scale(1.3); }
      `}</style>

      <div style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        background: "linear-gradient(145deg, #EFF6FF 0%, #F0F9FF 40%, #ECFEFF 100%)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        {/* Ambient background orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(37,99,235,0.08)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: 0, left: -60, width: 350, height: 350, borderRadius: "50%", background: "rgba(6,182,212,0.07)", filter: "blur(50px)" }} />
          <div style={{ position: "absolute", top: "40%", right: "20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(139,92,246,0.05)", filter: "blur(40px)" }} />
        </div>

        {/* TOP NAV */}
        <header style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 32px",
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(37,99,235,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M13 21C13 21 4 15.5 4 9.5C4 6.46 6.46 4 9.5 4C11.2 4 12.72 4.9 13 6.2C13.28 4.9 14.8 4 16.5 4C19.54 4 22 6.46 22 9.5C22 15.5 13 21 13 21Z" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", fontFamily: "'Outfit', sans-serif", letterSpacing: -0.3 }}>SMCBI Health Kiosk</div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>School Health Monitoring System</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 20, padding: "6px 14px",
            }}>
              <div style={{ position: "relative", width: 10, height: 10 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22C55E" }} />
                <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid #22C55E", animation: "pulse-ring 1.5s ease-out infinite" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>Voice Guide Active</span>
            </div>
            <Clock />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: "flex", padding: "20px 28px 16px", gap: 20, position: "relative", zIndex: 1, overflow: "hidden" }}>

          {/* HERO CAROUSEL */}
          <div style={{
            flex: 1, position: "relative", borderRadius: 28, overflow: "hidden",
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 8px 40px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Slide content */}
            <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
              {/* Left panel */}
              <div style={{
                width: "52%", padding: "40px 44px",
                display: "flex", flexDirection: "column", justifyContent: "center",
                animation: isTransitioning ? "slideInRight 0.55s cubic-bezier(0.22,1,0.36,1)" : "none",
                animationFillMode: "both",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: slide.accent + "18", borderRadius: 20, padding: "5px 14px",
                  marginBottom: 20, alignSelf: "flex-start",
                  border: `1px solid ${slide.accent}30`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: slide.accent }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: slide.accent, letterSpacing: 2, textTransform: "uppercase" }}>{slide.tag}</span>
                </div>

                <h1 style={{
                  fontSize: 46, fontWeight: 900, color: "#0F172A", lineHeight: 1.08,
                  fontFamily: "'Outfit', sans-serif", letterSpacing: -2,
                  marginBottom: 16,
                }}>
                  {slide.headline.split("\n").map((l, i) => <span key={i} style={{ display: "block" }}>{l}</span>)}
                </h1>

                <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.65, marginBottom: 28, maxWidth: 380 }}>
                  {slide.desc}
                </p>

                {slide.features && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
                    {slide.features.map(f => (
                      <div key={f.label} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,0.9)",
                        border: `1px solid ${slide.accent}20`,
                        borderRadius: 12, padding: "8px 14px",
                        boxShadow: `0 2px 8px ${slide.accent}10`,
                      }}>
                        <span style={{ fontSize: 18 }}>{f.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.cta && (
                  <div style={{ marginTop: 4 }}>
                    <button style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: `linear-gradient(135deg, ${slide.accent} 0%, #06B6D4 100%)`,
                      color: "white", border: "none", borderRadius: 16,
                      padding: "16px 28px", fontSize: 16, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                      boxShadow: `0 8px 24px ${slide.accent}40`,
                      letterSpacing: 0.2,
                    }}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <rect x="2" y="2" width="8" height="8" rx="2" fill="white" fillOpacity="0.9"/>
                        <rect x="12" y="2" width="8" height="8" rx="2" fill="white" fillOpacity="0.9"/>
                        <rect x="2" y="12" width="8" height="8" rx="2" fill="white" fillOpacity="0.9"/>
                        <rect x="14" y="14" width="4" height="4" rx="1" fill="white"/>
                        <rect x="12" y="12" width="4" height="4" rx="1" fill="white" fillOpacity="0.5"/>
                        <rect x="18" y="12" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5"/>
                        <rect x="12" y="18" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5"/>
                      </svg>
                      {slide.cta}
                    </button>
                    <button style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "transparent", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)",
                      borderRadius: 14, padding: "12px 20px", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", marginLeft: 12, fontFamily: "'DM Sans', sans-serif",
                    }}>
                      ✉ Login with Email
                    </button>
                  </div>
                )}
              </div>

              {/* Right visual panel */}
              <div style={{
                flex: 1,
                background: `linear-gradient(145deg, ${slide.accentLight} 0%, rgba(255,255,255,0.4) 100%)`,
                borderLeft: "1px solid rgba(255,255,255,0.7)",
                padding: "32px 28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                animation: isTransitioning ? "slideInRight 0.65s cubic-bezier(0.22,1,0.36,1) 0.08s" : "none",
                animationFillMode: "both",
              }}>
                {/* Decorative grid */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `radial-gradient(circle, ${slide.accent}15 1px, transparent 1px)`,
                  backgroundSize: "28px 28px",
                }} />
                <div style={{ position: "relative", width: "100%", maxHeight: 320 }}>
                  {slides[current].visual}
                </div>
              </div>
            </div>

            {/* Slide indicators + nav */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 40px",
              borderTop: "1px solid rgba(37,99,235,0.08)",
              background: "rgba(255,255,255,0.5)",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {slides.map((s, i) => (
                  <button key={i} className="dot" onClick={() => goTo(i, i > current ? 1 : -1)} style={{
                    width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                    background: i === current ? slide.accent : "rgba(37,99,235,0.2)",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => goTo((current - 1 + slides.length) % slides.length, -1)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "1.5px solid rgba(37,99,235,0.2)",
                  background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 16,
                }}>‹</button>
                <button onClick={() => goTo((current + 1) % slides.length, 1)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: slide.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16,
                }}>›</button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Status card */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
              borderRadius: 20, padding: "18px 18px",
              border: "1px solid rgba(37,99,235,0.12)",
              boxShadow: "0 4px 20px rgba(37,99,235,0.07)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Kiosk Status</div>
              {[
                { label: "Barcode Scanner", ok: true },
                { label: "Vital Sensor", ok: true },
                { label: "Height Sensor", ok: true },
                { label: "Thermal Camera", ok: true },
                { label: "Receipt Printer", ok: true },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{s.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.ok ? "#22C55E" : "#EF4444" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.ok ? "#16A34A" : "#DC2626" }}>{s.ok ? "Online" : "Error"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick features */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
              borderRadius: 20, padding: "18px 18px", flex: 1,
              border: "1px solid rgba(37,99,235,0.12)",
              boxShadow: "0 4px 20px rgba(37,99,235,0.07)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>This Kiosk</div>
              {[
                { icon: "❤️", label: "Heart Rate & SpO₂", color: "#EF4444" },
                { icon: "🌡", label: "Body Temperature", color: "#F59E0B" },
                { icon: "📏", label: "Height & Weight", color: "#06B6D4" },
                { icon: "📊", label: "BMI Analysis", color: "#2563EB" },
                { icon: "🖨", label: "Print Summary", color: "#8B5CF6" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: f.color + "15",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                  }}>{f.icon}</div>
                  <span style={{ fontSize: 12, color: "#334155", fontWeight: 500, lineHeight: 1.3 }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA barcode area */}
            <div style={{
              borderRadius: 20, overflow: "hidden",
              background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
              padding: "18px 18px", textAlign: "center",
              boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📲</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "white", fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Ready to Scan</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>Present your student barcode to begin your health check</div>
                <div style={{ marginTop: 12, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 0", fontSize: 11, color: "white", fontWeight: 600, letterSpacing: 1 }}>
                  — OR TAP ANYWHERE —
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* TICKER */}
        <Ticker />
      </div>
    </>
  );
}