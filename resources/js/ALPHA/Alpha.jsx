import { useCallback, useEffect, useMemo, useState } from "react";
import { ALPHA_SECTIONS } from "./alphaTestData";
import { loadState, overallKey, resultKey, saveState } from "./alphaStorage";

/**
 * Alpha Testing questionnaire.
 *
 * A tester records their own name and the date and time, works through each
 * test case, marks every question Pass or Fail, and adds a comment or an
 * observation where something needs attention. One submission at the end closes
 * off the whole questionnaire and opens the summary, ready to copy or export.
 *
 * Nothing here touches, stubs or shortcuts the behaviour being tested — the
 * page only records what the tester observed.
 */

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const formatDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return `${months[m - 1]} ${d}, ${y}`;
};

const formatTime = (value) => {
    if (!value) return "";
    const [h, min] = value.split(":").map(Number);
    if (Number.isNaN(h)) return value;
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(min).padStart(2, "0")} ${suffix}`;
};

export default function Alpha() {
    const [state, setState] = useState(loadState);
    const [activeSection, setActiveSection] = useState(ALPHA_SECTIONS[0].id);
    const [view, setView] = useState("test");   // test | summary
    const [copied, setCopied] = useState(false);
    const [submitPhase, setSubmitPhase] = useState(null);   // null | running | done
    const [submitProgress, setSubmitProgress] = useState(0);
    const [submittedAt, setSubmittedAt] = useState("");

    useEffect(() => saveState(state), [state]);

    const section = ALPHA_SECTIONS.find((item) => item.id === activeSection);

    const setMeta = useCallback((field, value) => {
        setState((s) => ({ ...s, meta: { ...s.meta, [field]: value } }));
    }, []);

    const setResult = useCallback((sectionId, q, patch) => {
        const key = resultKey(sectionId, q);
        setState((s) => ({ ...s, results: { ...s.results, [key]: { ...(s.results[key] || {}), ...patch } } }));
    }, []);

    const toggleStatus = useCallback((sectionId, q, status) => {
        const key = resultKey(sectionId, q);
        setState((s) => {
            const existing = s.results[key] || {};
            // Clicking the marked state again clears it, so a mis-click is undoable.
            const next = existing.status === status ? "" : status;
            return { ...s, results: { ...s.results, [key]: { ...existing, status: next } } };
        });
    }, []);

    const setOverall = useCallback((sectionId, caseId, patch) => {
        const key = overallKey(sectionId, caseId);
        setState((s) => ({ ...s, overall: { ...s.overall, [key]: { ...(s.overall[key] || {}), ...patch } } }));
    }, []);

    const resultFor = (q) => state.results[resultKey(section.id, q)] || {};
    const overallFor = (caseId) => state.overall[overallKey(section.id, caseId)] || {};

    /** Per-test-case tallies, used by the badges, the submit guard and the summary. */
    const caseStats = useMemo(() => {
        const map = {};
        ALPHA_SECTIONS.forEach((sec) => {
            sec.cases.forEach((testCase) => {
                let passed = 0, failed = 0, comments = 0;
                testCase.steps.forEach((step) => {
                    const record = state.results[resultKey(sec.id, step.q)] || {};
                    if (record.status === "pass") passed += 1;
                    if (record.status === "fail") failed += 1;
                    if ((record.comment || "").trim()) comments += 1;
                    if ((record.extra || "").trim()) comments += 1;
                });
                const overall = state.overall[overallKey(sec.id, testCase.id)] || {};
                const answered = passed + failed;
                map[`${sec.id}:${testCase.id}`] = {
                    total: testCase.steps.length,
                    passed, failed, comments, answered,
                    complete: answered === testCase.steps.length,
                    overallComment: overall.comment || "",
                };
            });
        });
        return map;
    }, [state]);

    const sectionStats = useMemo(() => {
        const map = {};
        ALPHA_SECTIONS.forEach((sec) => {
            const totals = sec.cases.reduce(
                (acc, testCase) => {
                    const s = caseStats[`${sec.id}:${testCase.id}`];
                    acc.total += s.total;
                    acc.passed += s.passed;
                    acc.failed += s.failed;
                    acc.answered += s.answered;
                    acc.complete += s.complete ? 1 : 0;
                    return acc;
                },
                { total: 0, passed: 0, failed: 0, answered: 0, complete: 0, cases: sec.cases.length },
            );
            map[sec.id] = totals;
        });
        return map;
    }, [caseStats]);

    const visibleCases = section.cases;

    /**
     * Collected comments, grouped by test case.
     *
     * Only fields that actually carry text appear. A test case contributes
     * nothing at all unless one of its questions has a comment or observation,
     * or the case itself has an overall comment.
     */
    const collected = useMemo(() => {
        const groups = [];

        ALPHA_SECTIONS.forEach((sec) => {
            sec.cases.forEach((testCase) => {
                const lines = [];

                testCase.steps.forEach((step) => {
                    const record = state.results[resultKey(sec.id, step.q)] || {};
                    const comment = (record.comment || "").trim();
                    const extra = (record.extra || "").trim();
                    if (comment) lines.push(`COMMENT ${step.q}: ${comment}`);
                    if (extra) lines.push(`COMMENT ${step.q} ADDITIONAL: ${extra}`);
                });

                const overall = (state.overall[overallKey(sec.id, testCase.id)] || {}).comment || "";
                if (lines.length === 0 && !overall.trim()) return;

                groups.push({
                    sectionTitle: sec.title,
                    indicator: `${testCase.id} — ${testCase.title}`,
                    lines,
                    overall: overall.trim(),
                });
            });
        });

        return groups;
    }, [state]);

    /** Comments for one section, as text. */
    const sectionCommentText = useCallback(
        (sectionTitle) =>
            collected
                .filter((group) => group.sectionTitle === sectionTitle)
                .map((group) => {
                    const block = [`INDICATOR: ${group.indicator}`, ""];
                    if (group.lines.length) block.push(...group.lines, "");
                    if (group.overall) {
                        block.push(`OVERALL COMMENT ${group.indicator.split(" — ")[0]}: ${group.overall}`, "");
                    }
                    return block.join("\n").trimEnd();
                })
                .join("\n\n"),
        [collected],
    );

    // One block per section, kept apart so the three areas are never merged.
    const commentSections = useMemo(
        () =>
            ALPHA_SECTIONS.map((sec) => ({
                id: sec.id,
                title: sec.title,
                text: sectionCommentText(sec.title),
            })).filter((sec) => sec.text !== ""),
        [sectionCommentText],
    );

    const commentText = useMemo(
        () => commentSections.map((sec) => sec.text).join("\n\n"),
        [commentSections],
    );

    const copyComments = async (text = commentText, key = "all") => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Clipboard API needs a secure context; the kiosk is served over plain http.
            const area = document.createElement("textarea");
            area.value = text;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
        }
        setCopied(key);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const testerReady = Boolean(state.meta.tester.trim() && state.meta.date && state.meta.time);

    /**
     * Submit the whole section in one go.
     *
     * The progress runs on a real timer rather than pretending to measure work —
     * compiling the summary is instant, and the pause exists so the tester sees
     * the questionnaire being closed off rather than a modal appearing from
     * nowhere.
     */
    const submitQuestionnaire = () => {
        if (!testerReady) {
            window.alert("Enter the tester name, testing date and testing time before submitting.");
            return;
        }

        const unanswered = t.total - t.answered;
        if (unanswered > 0) {
            const proceed = window.confirm(
                `${unanswered} of ${t.total} questions have no Pass or Fail mark yet. ` +
                "Submit anyway? The summary will show them as not run.",
            );
            if (!proceed) return;
        }

        setSubmitPhase("running");
        setSubmitProgress(0);
        setSubmittedAt(new Date().toISOString());

        const started = performance.now();
        const DURATION = 900;

        const tick = () => {
            const elapsed = performance.now() - started;
            const value = Math.min(100, (elapsed / DURATION) * 100);
            setSubmitProgress(value);

            if (value < 100) {
                window.requestAnimationFrame(tick);
            } else {
                setSubmitPhase("done");
            }
        };

        window.requestAnimationFrame(tick);
    };

    /** Back to a blank questionnaire: every answer, comment and tester detail. */
    const resetAll = () => {
        const proceed = window.confirm(
            "Reset everything to default?\n\n" +
            "This clears every Pass/Fail mark, every comment and observation, every overall comment, " +
            "and the tester details, across all sections. It cannot be undone.",
        );
        if (!proceed) return;

        // saveState stamps the current version, so none is hardcoded here.
        setState({ meta: { tester: "", date: "", time: "" }, results: {}, overall: {} });
        setSubmitPhase(null);
        setSubmitProgress(0);
        setSubmittedAt("");
    };

    // ── Export ────────────────────────────────────────────────────────────
    const exportHtml = () => {
        const rows = section.cases
            .map((testCase) => {
                const stats = caseStats[`${section.id}:${testCase.id}`];
                const head = `<tr class="case"><td colspan="9">${escapeHtml(testCase.id)} — ${escapeHtml(testCase.title)}
                    &nbsp;·&nbsp; ${stats.submitted ? "SUBMITTED" : "NOT SUBMITTED"}
                    &nbsp;·&nbsp; ${stats.passed} passed, ${stats.failed} failed</td></tr>`;

                const body = testCase.steps
                    .map((step, index) => {
                        const record = state.results[resultKey(section.id, step.q)] || {};
                        const status = record.status === "pass" ? "PASS" : record.status === "fail" ? "FAIL" : "";
                        const tone = status === "PASS" ? "pass" : status === "FAIL" ? "fail" : "";
                        return `<tr>
                            <td>${escapeHtml(step.q)}</td>
                            <td>${escapeHtml(testCase.id)}</td>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(step.action)}</td>
                            <td>${escapeHtml(step.data)}</td>
                            <td>${escapeHtml(step.expected)}</td>
                            <td class="${tone}">${status}</td>
                            <td>${escapeHtml(record.comment || "")}</td>
                            <td>${escapeHtml(record.extra || "")}</td>
                        </tr>`;
                    })
                    .join("");

                const overall = stats.overallComment
                    ? `<tr class="overall"><td colspan="9"><b>Overall Comment ${escapeHtml(testCase.id)}:</b> ${escapeHtml(stats.overallComment)}</td></tr>`
                    : "";

                return head + body + overall;
            })
            .join("");

        const summaryRows = section.cases
            .map((testCase) => {
                const s = caseStats[`${section.id}:${testCase.id}`];
                return `<tr>
                    <td>${escapeHtml(testCase.id)}</td>
                    <td>${escapeHtml(testCase.title)}</td>
                    <td>${s.submitted ? "Completed" : s.answered > 0 ? "In progress" : "Not started"}</td>
                    <td>${s.passed}</td><td>${s.failed}</td><td>${s.comments}</td>
                </tr>`;
            })
            .join("");

        const t = sectionStats[section.id];

        return `
            <html><head><meta charset="utf-8" />
            <title>Alpha Testing — ${escapeHtml(section.title)}</title>
            <style>
                body { font-family: Arial, Helvetica, sans-serif; color:#111; margin:22px; }
                h1 { font-size:17px; margin:0 0 3px; } h2 { font-size:13px; margin:20px 0 6px; }
                p.sub { margin:0 0 12px; color:#444; font-size:11px; }
                .meta { font-size:11px; margin-bottom:14px; }
                .meta span { margin-right:22px; }
                table { width:100%; border-collapse:collapse; font-size:9.5px; margin-bottom:10px; }
                th,td { border:1px solid #999; padding:4px 5px; text-align:left; vertical-align:top; }
                th { background:#eee; text-transform:uppercase; font-size:8.5px; }
                tr.case td { background:#1f3a4d; color:#fff; font-weight:bold; }
                tr.overall td { background:#eef3f6; }
                td.pass { color:#0a6b2e; font-weight:bold; } td.fail { color:#a11212; font-weight:bold; }
            </style></head><body>
                <h1>ALPHA TESTING RESULTS — ${escapeHtml(section.title.toUpperCase())}</h1>
                <p class="sub">Health Kiosk System with IoT Sensors, Data Analytics and Companion Mobile Application</p>
                <div class="meta">
                    <span><b>Tester:</b> ${escapeHtml(state.meta.tester || "____________________")}</span>
                    <span><b>Date:</b> ${escapeHtml(formatDate(state.meta.date) || "____________")}</span>
                    <span><b>Time:</b> ${escapeHtml(formatTime(state.meta.time) || "________")}</span>
                    <span><b>Questions:</b> ${t.total}</span>
                    <span><b>Passed:</b> ${t.passed}</span>
                    <span><b>Failed:</b> ${t.failed}</span>
                    <span><b>Not run:</b> ${t.total - t.answered}</span>
                </div>

                <h2>Test Case Summary</h2>
                <table><thead><tr>
                    <th style="width:52px">Test Case</th><th>Description</th>
                    <th style="width:70px">Status</th><th style="width:44px">Passed</th>
                    <th style="width:44px">Failed</th><th style="width:56px">Comments</th>
                </tr></thead><tbody>${summaryRows}</tbody></table>

                <h2>All Questions</h2>
                <table><thead><tr>
                    <th style="width:38px">Q</th><th style="width:42px">TC</th><th style="width:26px">#</th>
                    <th>Action</th><th style="width:90px">Test Data</th><th>Expected Result</th>
                    <th style="width:40px">Result</th><th style="width:130px">Comment</th>
                    <th style="width:130px">Additional Test / Observation</th>
                </tr></thead><tbody>${rows}</tbody></table>
            </body></html>`;
    };

    const downloadPdf = () => {
        const win = window.open("", "_blank");
        if (!win) {
            window.alert("Please allow pop-ups to download the PDF.");
            return;
        }
        // The popup prints itself; printing from here would block this tab.
        win.document.write(
            exportHtml().replace(
                "</body>",
                '<script>window.addEventListener("load",function(){requestAnimationFrame(function(){window.print()})})<\/script></body>',
            ),
        );
        win.document.close();
    };

    const downloadExcel = () => {
        const blob = new Blob([exportHtml()], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `alpha-testing_${section.id}_${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const exportMergedHtml = () => {
        let allSectionsHtml = "";

        ALPHA_SECTIONS.forEach((sec) => {
            const tStats = sectionStats[sec.id] || { total: 0, passed: 0, failed: 0, answered: 0 };
            
            let sectionRows = sec.cases.map((testCase) => {
                const stats = caseStats[`${sec.id}:${testCase.id}`] || { passed: 0, failed: 0 };
                
                const head = `<tr><td colspan="7"><b>${escapeHtml(testCase.id)} — ${escapeHtml(testCase.title)}</b></td></tr>`;
                
                const body = testCase.steps.map((step, index) => {
                    const record = state.results[resultKey(sec.id, step.q)] || {};
                    const passMark = "";
                    const failMark = "";
                    
                    const commentsArr = [];
                    if (record.comment) commentsArr.push(escapeHtml(record.comment));
                    if (record.extra) commentsArr.push(escapeHtml(record.extra));
                    const commentsText = commentsArr.join("<br/>");
                    
                    return `<tr>
                        <td>${escapeHtml(step.q)}</td>
                        <td>${escapeHtml(step.action)}</td>
                        <td>${escapeHtml(step.data)}</td>
                        <td>${escapeHtml(step.expected)}</td>
                        <td style="text-align: center;">${passMark}</td>
                        <td style="text-align: center;">${failMark}</td>
                        <td>${commentsText}</td>
                    </tr>`;
                }).join("");
                
                const overall = stats.overallComment
                    ? `<tr><td colspan="7"><b>Overall Comment ${escapeHtml(testCase.id)}:</b> ${escapeHtml(stats.overallComment)}</td></tr>`
                    : "";
                    
                return head + body + overall;
            }).join("");

            allSectionsHtml += `
                <h2>${escapeHtml(sec.title.toUpperCase())}</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th>Q</th>
                            <th>Action</th>
                            <th>Test Data</th>
                            <th>Expected System Response</th>
                            <th>Pass</th>
                            <th>Fail</th>
                            <th>Comment</th>
                        </tr>
                    </thead>
                    <tbody>${sectionRows}</tbody>
                </table>
                <br/>
            `;
        });

        const summaryList = ALPHA_SECTIONS.map((sec) => {
            const tStats = sectionStats[sec.id] || { total: 0, answered: 0 };
            return `<div><b>${escapeHtml(sec.title)}</b><br/>${tStats.answered}/${tStats.total}</div><br/>`;
        }).join("");

        return `
            <html><head><meta charset="utf-8" />
            <title>Alpha Testing — Merged Results</title>
            </head><body>
                <h1>ALPHA TESTING RESULTS — ALL SECTIONS</h1>
                <p>Health Kiosk System with IoT Sensors, Data Analytics and Companion Mobile Application</p>
                <div>
                    <b>Tester:</b> ${escapeHtml(state.meta.tester || "____________________")}<br/>
                    <b>Date:</b> ${escapeHtml(formatDate(state.meta.date) || "____________")}<br/>
                    <b>Time:</b> ${escapeHtml(formatTime(state.meta.time) || "________")}
                </div>
                <br/>
                <h3>Sections Summary</h3>
                ${summaryList}
                <hr/>
                ${allSectionsHtml}
            </body></html>`;
    };

    const downloadWord = () => {
        const blob = new Blob(['\ufeff', exportMergedHtml()], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `alpha-testing_merged_${new Date().toISOString().slice(0, 10)}.doc`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const previewWord = () => {
        const win = window.open("", "_blank");
        if (!win) {
            window.alert("Please allow pop-ups to preview the document.");
            return;
        }
        win.document.write(exportMergedHtml());
        win.document.close();
    };

    const t = sectionStats[section.id];
    const allComplete = section.cases.every((c) => caseStats[`${section.id}:${c.id}`].complete);

    return (
        <main className="min-h-screen px-4 py-8" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
            <div className="mx-auto max-w-[1500px]">

                {/* ── Header + tester information ── */}
                <header className="rounded-2xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                        Internal Quality Assurance
                    </p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight">Alpha Testing Questionnaire</h1>
                    <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--color-muted)" }}>
                        Enter your details, then work through every test case against the running system. One
                        submission at the end covers the whole questionnaire.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <Field label="Tester Name" required filled={Boolean(state.meta.tester.trim())}>
                            <input
                                value={state.meta.tester}
                                onChange={(e) => setMeta("tester", e.target.value)}
                                placeholder="Please enter tester name"
                                className="h-11 w-full rounded-xl border px-3 text-sm font-bold outline-none"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                        </Field>
                        <Field label="Testing Date" required filled={Boolean(state.meta.date)}>
                            <input
                                type="date"
                                value={state.meta.date}
                                onChange={(e) => setMeta("date", e.target.value)}
                                className="h-11 w-full rounded-xl border px-3 text-sm font-bold outline-none"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                        </Field>
                        <Field label="Testing Time" required filled={Boolean(state.meta.time)}>
                            <input
                                type="time"
                                value={state.meta.time}
                                onChange={(e) => setMeta("time", e.target.value)}
                                className="h-11 w-full rounded-xl border px-3 text-sm font-bold outline-none"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                        </Field>
                    </div>

                    {!testerReady && (
                        <p className="mt-3 rounded-xl border px-3 py-2 text-xs font-bold"
                           style={{ backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))", borderColor: "var(--color-warning)", color: "var(--color-text)" }}>
                            Complete all three fields before submitting a test case.
                        </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black">
                        <Stat label="Questions" value={t.total} />
                        <Stat label="Passed" value={t.passed} tone="var(--color-success)" />
                        <Stat label="Failed" value={t.failed} tone="var(--color-error)" />
                        <Stat label="Not run" value={t.total - t.answered} tone="var(--color-muted)" />
                        <Stat label="Test cases complete" value={`${t.complete}/${t.cases}`} tone="var(--color-primary)" />

                        <div className="ml-auto flex flex-wrap gap-2">
                            <button type="button" onClick={() => setView(view === "test" ? "summary" : "test")}
                                className="h-11 rounded-xl border px-4 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: view === "summary" ? "var(--color-primary)" : "var(--color-card)", borderColor: view === "summary" ? "var(--color-primary)" : "var(--color-border)", color: view === "summary" ? "var(--color-primary-content)" : "var(--color-text)" }}>
                                {view === "test" ? "View Summary" : "Back to Testing"}
                            </button>
                            <button type="button" onClick={downloadPdf} className="h-11 rounded-xl px-4 text-sm font-black transition hk-primary-hover" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-content)" }}>
                                Download PDF
                            </button>
                            <button type="button" onClick={downloadExcel} className="h-11 rounded-xl border px-4 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                Download Excel
                            </button>
                            <button type="button" onClick={previewWord} className="h-11 rounded-xl border px-4 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                Preview Word
                            </button>
                            <button type="button" onClick={downloadWord} className="h-11 rounded-xl border px-4 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                Download Word
                            </button>
                            <button type="button" onClick={resetAll} className="h-11 rounded-xl border px-4 text-sm font-black transition hk-soft-hover" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-error)" }}>
                                Reset to default
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Section tabs ── */}
                <nav className="mt-6 flex flex-wrap gap-2">
                    {ALPHA_SECTIONS.map((item) => {
                        const active = item.id === activeSection;
                        const s = sectionStats[item.id];
                        return (
                            <button key={item.id} type="button" onClick={() => setActiveSection(item.id)}
                                className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: active ? "var(--color-primary)" : "var(--color-card)", borderColor: active ? "var(--color-primary)" : "var(--color-border)", color: active ? "#fff" : "var(--color-text)" }}>
                                {item.title}
                                <span className="rounded-full px-2 py-0.5 text-[0.65rem]" style={{ backgroundColor: active ? "rgba(255,255,255,0.22)" : "var(--color-surface)", color: active ? "#fff" : "var(--color-muted)" }}>
                                    {s.answered}/{s.total}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {view === "summary" ? (
                    <Summary section={section} caseStats={caseStats} sectionStats={sectionStats} state={state} />
                ) : (
                    <>
                        <section
                            className="mt-4 overflow-hidden rounded-2xl border"
                            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                        >
                            <div className="border-b px-6 py-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-lg font-black">{section.title} — Test Cases</h2>
                                    {section.finalized ? (
                                        <span
                                            className="rounded-full border px-3 py-1 text-xs font-black"
                                            style={{
                                                backgroundColor: "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))",
                                                borderColor: "color-mix(in srgb, var(--color-success) 36%, var(--color-border))",
                                                color: "var(--color-success)",
                                            }}
                                        >
                                            Finalized
                                        </span>
                                    ) : null}
                                    <span className="text-xs font-black tabular-nums" style={{ color: "var(--color-muted)" }}>
                                        {t.answered}/{t.total} answered
                                    </span>
                                </div>
                                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                    {t.cases} test cases, numbered {section.cases[0].id} to {section.cases[t.cases - 1].id} ·
                                    {" "}{t.total} questions · one submission at the end.
                                </p>
                            </div>

                            {visibleCases.map((testCase, index) => (
                                <TestCaseBlock
                                    key={testCase.id}
                                    isFirst={index === 0}
                                    testCase={testCase}
                                    stats={caseStats[`${section.id}:${testCase.id}`]}
                                    resultFor={resultFor}
                                    overall={overallFor(testCase.id)}
                                    onStatus={(q, status) => toggleStatus(section.id, q, status)}
                                    onField={(q, patch) => setResult(section.id, q, patch)}
                                    onOverall={(patch) => setOverall(section.id, testCase.id, patch)}
                                />
                            ))}
                        </section>

                        <section className="mt-6 rounded-2xl border p-6"
                            style={{ backgroundColor: "var(--color-card)", borderColor: allComplete ? "var(--color-success)" : "var(--color-border)" }}>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black">Submit {section.title} Questionnaire</h2>
                                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                        One submission covers all {t.cases} test cases and {t.total} questions.
                                        {" "}{t.answered}/{t.total} answered
                                        {t.total - t.answered > 0 ? ` · ${t.total - t.answered} still to run` : " · ready to submit"}.
                                    </p>
                                </div>
                                <button type="button" onClick={() => submitQuestionnaire()}
                                    className="h-12 shrink-0 rounded-xl px-6 text-sm font-black transition hk-primary-hover"
                                    style={{
                                        backgroundColor: allComplete ? "var(--color-success)" : "var(--color-primary)",
                                        color: allComplete ? "var(--color-success-content)" : "var(--color-primary-content)",
                                    }}>
                                    Submit {section.title}
                                </button>
                            </div>
                        </section>
                    </>
                )}

                {submitPhase && (
                    <SubmitOverlay
                        phase={submitPhase}
                        progress={submitProgress}
                        section={section}
                        caseStats={caseStats}
                        totals={t}
                        meta={state.meta}
                        submittedAt={submittedAt}
                        commentText={sectionCommentText(section.title)}
                        onClose={() => setSubmitPhase(null)}
                    />
                )}

                {/* ── Collected comments, one block per section ── */}
                <section className="mt-8 rounded-2xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-black">Collected Comments</h2>
                            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                Kept separate per testing area, grouped by test case indicator. Only questions and
                                test cases that actually carry text appear.
                            </p>
                        </div>
                        {commentSections.length > 1 ? (
                            <button type="button" onClick={() => copyComments(commentText, "all")}
                                className="h-11 rounded-xl border px-5 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                                {copied === "all" ? "Copied all" : "Copy all sections"}
                            </button>
                        ) : null}
                    </div>

                    {commentSections.length === 0 ? (
                        <p className="mt-5 rounded-xl border p-4 text-sm font-semibold" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                            No comments recorded yet.
                        </p>
                    ) : (
                        <div className="mt-5 flex flex-col gap-5">
                            {commentSections.map((sec) => (
                                <div key={sec.id} className="rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                        <h3 className="text-sm font-black">{sec.title} — Test Cases</h3>
                                        <button type="button" onClick={() => copyComments(sec.text, sec.id)}
                                            className="h-9 rounded-lg px-4 text-xs font-black transition hk-primary-hover"
                                            style={{
                                                backgroundColor: copied === sec.id ? "var(--color-success)" : "var(--color-primary)",
                                                color: copied === sec.id ? "var(--color-success-content)" : "var(--color-primary-content)",
                                            }}>
                                            {copied === sec.id ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                    <pre className="overflow-x-auto px-4 py-4 text-sm leading-6"
                                        style={{ color: "var(--color-text)", whiteSpace: "pre-wrap" }}>{sec.text}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

/**
 * Submission overlay: a short compile animation, then the finished summary with
 * the comments ready to copy straight back to whoever is fixing them.
 */
function SubmitOverlay({ phase, progress, section, caseStats, totals, meta, submittedAt, commentText, onClose }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!commentText) return;
        try {
            await navigator.clipboard.writeText(commentText);
        } catch {
            const area = document.createElement("textarea");
            area.value = commentText;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-[9500] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(4, 8, 18, 0.7)", backdropFilter: "blur(10px)" }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="hk-slim-scroll w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border p-7 shadow-2xl"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
                {phase === "running" ? (
                    <div className="py-10 text-center">
                        <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--color-primary)" }}>
                            Submitting
                        </p>
                        <h2 className="mt-2 text-2xl font-black">Compiling {section.title} results</h2>
                        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                            Collecting every Pass and Fail mark, comment and observation.
                        </p>

                        <div className="mx-auto mt-7 h-2 w-full max-w-sm overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
                            />
                        </div>
                        <p className="mt-3 text-sm font-black tabular-nums" style={{ color: "var(--color-primary)" }}>
                            {Math.round(progress)}%
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--color-success)" }}>
                                    Submitted
                                </p>
                                <h2 className="mt-1 text-2xl font-black">{section.title} — Alpha Testing Summary</h2>
                                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                    {meta.tester || "—"} · {formatDate(meta.date) || "—"} · {formatTime(meta.time) || "—"}
                                    {submittedAt ? ` · submitted ${new Date(submittedAt).toLocaleString()}` : ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 rounded-xl border px-4 text-sm font-black transition hk-soft-hover"
                                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                            <Stat label="Questions" value={totals.total} />
                            <Stat label="Passed" value={totals.passed} tone="var(--color-success)" />
                            <Stat label="Failed" value={totals.failed} tone="var(--color-error)" />
                            <Stat label="Not run" value={totals.total - totals.answered} tone="var(--color-muted)" />
                        </div>

                        <div className="mt-6 overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
                            <table className="w-full border-collapse text-sm" style={{ minWidth: "34rem" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "var(--color-surface)" }}>
                                        <Th style={{ width: "4.5rem" }}>Test Case</Th>
                                        <Th>Description</Th>
                                        <Th style={{ width: "7rem" }}>Status</Th>
                                        <Th style={{ width: "4.5rem" }}>Passed</Th>
                                        <Th style={{ width: "4.5rem" }}>Failed</Th>
                                        <Th style={{ width: "5.5rem" }}>Comments</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.cases.map((testCase) => {
                                        const st = caseStats[`${section.id}:${testCase.id}`];
                                        const status = st.complete ? "Completed" : st.answered > 0 ? "In progress" : "Not started";
                                        return (
                                            <tr key={testCase.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                                                <Td><span className="font-black" style={{ color: "var(--color-primary)" }}>{testCase.id}</span></Td>
                                                <Td>{testCase.title}</Td>
                                                <Td>
                                                    <span style={{ color: st.complete ? "var(--color-success)" : "var(--color-muted)" }}>{status}</span>
                                                </Td>
                                                <Td><span className="tabular-nums">{st.passed}</span></Td>
                                                <Td><span className="tabular-nums" style={{ color: st.failed ? "var(--color-error)" : "var(--color-muted)" }}>{st.failed}</span></Td>
                                                <Td><span className="tabular-nums">{st.comments}</span></Td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-black">Comments to hand back</h3>
                                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                                    {section.title} only, grouped by indicator. Copy this and paste it back so each
                                    point can be fixed.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={copy}
                                disabled={!commentText}
                                className="h-11 rounded-xl px-5 text-sm font-black transition hk-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    backgroundColor: copied ? "var(--color-success)" : "var(--color-primary)",
                                    color: copied ? "var(--color-success-content)" : "var(--color-primary-content)",
                                }}
                            >
                                {copied ? "Copied" : "Copy Comments"}
                            </button>
                        </div>

                        <pre
                            className="hk-slim-scroll mt-4 max-h-72 overflow-auto rounded-xl border p-4 text-sm leading-6"
                            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)", whiteSpace: "pre-wrap" }}
                        >{commentText || `No comments were recorded for ${section.title}.`}</pre>
                    </>
                )}
            </div>
        </div>
    );
}


function Field({ label, required, filled, children }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs font-black" style={{ color: required && !filled ? "var(--color-warning)" : "var(--color-muted)" }}>
                {label}{required ? " *" : ""}
            </span>
            {children}
        </label>
    );
}

function Stat({ label, value, tone }) {
    return (
        <span className="rounded-lg border px-3 py-2"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: tone || "var(--color-text)" }}>
            {label}: {value}
        </span>
    );
}

function TestCaseBlock({ testCase, stats, resultFor, overall, onStatus, onField, onOverall, isFirst }) {
    const complete = stats.answered >= stats.total;

    return (
        <div
            className="relative"
            style={{ borderTop: isFirst ? "none" : "1px solid var(--color-border)" }}
        >
            {/* A green rail marks a finished test case now that the cards have
                been merged into one container and there is no card border left
                to carry that signal. */}
            <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: complete ? "var(--color-success)" : "transparent" }}
            />

            <div className="border-b p-5 pl-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-black">
                        <span style={{ color: "var(--color-primary)" }}>{testCase.id}</span> — {testCase.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-black">
                        <span style={{ color: "var(--color-muted)" }}>{stats.answered}/{stats.total} answered</span>
                        <span className="rounded-md px-2 py-1"
                            style={{ backgroundColor: complete ? "var(--color-success)" : "var(--color-surface)", color: complete ? "#fff" : "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                            {complete ? "Complete" : stats.answered > 0 ? "In progress" : "Not started"}
                        </span>
                    </div>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>{testCase.description}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-muted)" }}>Actor: {testCase.actor}</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm" style={{ minWidth: "66rem" }}>
                    <thead>
                        <tr style={{ backgroundColor: "var(--color-surface)" }}>
                            <Th style={{ width: "4.5rem" }}>Q</Th>
                            <Th style={{ width: "3rem" }}>Step</Th>
                            <Th>Action</Th>
                            <Th style={{ width: "10rem" }}>Test Data</Th>
                            <Th>Expected System Response</Th>
                            <Th style={{ width: "9rem" }}>Pass / Fail</Th>
                            <Th style={{ width: "12rem" }}>Comment</Th>
                            <Th style={{ width: "12rem" }}>Additional Test / Observation</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {testCase.steps.map((step, index) => {
                            const record = resultFor(step.q);
                            return (
                                <tr key={step.q} style={{ borderTop: "1px solid var(--color-border)" }}>
                                    <Td>
                                        <span className="font-black tabular-nums" style={{ color: "var(--color-primary)" }}>{step.q}</span>
                                    </Td>
                                    <Td><span className="tabular-nums">{index + 1}</span></Td>
                                    <Td>{step.action}</Td>
                                    <Td><span style={{ color: "var(--color-muted)" }}>{step.data}</span></Td>
                                    <Td>{step.expected}</Td>
                                    <Td>
                                        <div className="flex gap-1.5">
                                            <Mark active={record.status === "pass"} tone="var(--color-success)" onClick={() => onStatus(step.q, "pass")}>Pass</Mark>
                                            <Mark active={record.status === "fail"} tone="var(--color-error)" onClick={() => onStatus(step.q, "fail")}>Fail</Mark>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Box value={record.comment || ""} placeholder={`Comment for ${step.q}`}
                                            onChange={(value) => onField(step.q, { comment: value })} />
                                    </Td>
                                    <Td>
                                        <Box value={record.extra || ""} placeholder="Own test or observation" accent
                                            onChange={(value) => onField(step.q, { extra: value })} />
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border-t p-5 pl-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <label className="text-xs font-black" style={{ color: "var(--color-muted)" }}>
                    Overall Comment — {testCase.id}
                </label>
                <textarea
                    rows={2}
                    value={overall.comment || ""}
                    onChange={(event) => onOverall({ comment: event.target.value })}
                    placeholder={`Overall observation about ${testCase.id} as a whole`}
                    className="mt-2 w-full rounded-xl border p-3 text-sm font-semibold outline-none"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)", resize: "vertical" }}
                />

                {!complete && (
                    <p className="mt-3 text-xs font-bold" style={{ color: "var(--color-muted)" }}>
                        {stats.total - stats.answered} question(s) in {testCase.id} still need a Pass or Fail mark.
                    </p>
                )}
            </div>
        </div>
    );
}

function Summary({ section, caseStats, sectionStats, state }) {
    const t = sectionStats[section.id];

    return (
        <div className="mt-4 flex flex-col gap-6">
            <section className="rounded-2xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <h2 className="text-2xl font-black">{section.title} — Overall Alpha Test Summary</h2>

                <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm font-bold">
                    <p><span style={{ color: "var(--color-muted)" }}>Tester Name:</span> {state.meta.tester || "—"}</p>
                    <p><span style={{ color: "var(--color-muted)" }}>Testing Date:</span> {formatDate(state.meta.date) || "—"}</p>
                    <p><span style={{ color: "var(--color-muted)" }}>Testing Time:</span> {formatTime(state.meta.time) || "—"}</p>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-sm" style={{ minWidth: "40rem" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--color-surface)" }}>
                                <Th style={{ width: "5rem" }}>Test Case</Th><Th>Description</Th>
                                <Th style={{ width: "8rem" }}>Status</Th>
                                <Th style={{ width: "5rem" }}>Passed</Th><Th style={{ width: "5rem" }}>Failed</Th>
                                <Th style={{ width: "6rem" }}>Comments</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {section.cases.map((testCase) => {
                                const s = caseStats[`${section.id}:${testCase.id}`];
                                const status = s.complete ? "Completed" : s.answered > 0 ? "In progress" : "Not started";
                                return (
                                    <tr key={testCase.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                                        <Td><span className="font-black" style={{ color: "var(--color-primary)" }}>{testCase.id}</span></Td>
                                        <Td>{testCase.title}</Td>
                                        <Td>
                                            <span className="rounded-md px-2 py-1 text-xs font-black"
                                                style={{ backgroundColor: s.complete ? "color-mix(in srgb, var(--color-success) 15%, transparent)" : "var(--color-surface)", color: s.complete ? "var(--color-success)" : "var(--color-muted)" }}>
                                                {status}
                                            </span>
                                        </Td>
                                        <Td><span className="tabular-nums font-black" style={{ color: "var(--color-success)" }}>{s.passed}</span></Td>
                                        <Td><span className="tabular-nums font-black" style={{ color: s.failed ? "var(--color-error)" : "var(--color-muted)" }}>{s.failed}</span></Td>
                                        <Td><span className="tabular-nums">{s.comments}</span></Td>
                                    </tr>
                                );
                            })}
                            <tr style={{ borderTop: "2px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                                <Td><span className="font-black">Total</span></Td>
                                <Td><span className="font-black">{t.cases} test cases · {t.total} questions</span></Td>
                                <Td><span className="font-black">{t.complete}/{t.cases} complete</span></Td>
                                <Td><span className="font-black tabular-nums">{t.passed}</span></Td>
                                <Td><span className="font-black tabular-nums">{t.failed}</span></Td>
                                <Td><span className="font-black tabular-nums">{t.total - t.answered} not run</span></Td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="border-b p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <h3 className="text-base font-black">Every Question</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                        The full record for documentation — result, comment and observation for each question.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm" style={{ minWidth: "70rem" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--color-surface)" }}>
                                <Th style={{ width: "4.5rem" }}>Q</Th><Th style={{ width: "4rem" }}>TC</Th>
                                <Th>Action</Th><Th>Expected Result</Th>
                                <Th style={{ width: "5rem" }}>Result</Th>
                                <Th style={{ width: "12rem" }}>Comment</Th>
                                <Th style={{ width: "12rem" }}>Additional Test / Observation</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {section.cases.flatMap((testCase) =>
                                testCase.steps.map((step) => {
                                    const record = state.results[resultKey(section.id, step.q)] || {};
                                    return (
                                        <tr key={step.q} style={{ borderTop: "1px solid var(--color-border)" }}>
                                            <Td>
                                                <span className="font-black tabular-nums" style={{ color: "var(--color-primary)" }}>{step.q}</span>
                                            </Td>
                                            <Td><span className="font-bold">{testCase.id}</span></Td>
                                            <Td>{step.action}</Td>
                                            <Td>{step.expected}</Td>
                                            <Td>
                                                <span className="font-black" style={{ color: record.status === "pass" ? "var(--color-success)" : record.status === "fail" ? "var(--color-error)" : "var(--color-muted)" }}>
                                                    {record.status === "pass" ? "PASS" : record.status === "fail" ? "FAIL" : "—"}
                                                </span>
                                            </Td>
                                            <Td>{record.comment || <span style={{ color: "var(--color-muted)" }}>—</span>}</Td>
                                            <Td>{record.extra || <span style={{ color: "var(--color-muted)" }}>—</span>}</Td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Th({ children, style }) {
    return (
        <th className="px-3 py-2.5 text-left text-[0.65rem] font-black uppercase tracking-[0.08em]"
            style={{ color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)", ...style }}>
            {children}
        </th>
    );
}

function Td({ children }) {
    return <td className="px-3 py-3 align-top leading-6">{children}</td>;
}

function Mark({ active, tone, onClick, children }) {
    return (
        <button type="button" onClick={onClick}
            className="rounded-lg border px-3 py-1.5 text-xs font-black transition"
            style={{ backgroundColor: active ? tone : "var(--color-surface)", borderColor: active ? tone : "var(--color-border)", color: active ? "#fff" : "var(--color-muted)" }}>
            {children}
        </button>
    );
}

function Box({ value, placeholder, onChange, accent }) {
    return (
        <textarea
            rows={2}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border p-2 text-xs font-semibold outline-none"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: accent ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))" : "var(--color-border)",
                color: "var(--color-text)",
                resize: "vertical",
            }}
        />
    );
}
