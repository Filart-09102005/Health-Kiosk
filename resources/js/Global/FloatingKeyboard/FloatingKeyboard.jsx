import { useCallback, useEffect, useRef, useState } from "react";
import { GripHorizontal, RotateCcw, X } from "lucide-react";
import Keyboard from "react-simple-keyboard";
import { authService } from "../../Pages/Auth/services/authService";
import { KEYBOARD_SETTING_CHANGED_EVENT } from "./keyboardSettingEvent";
import "react-simple-keyboard/build/css/index.css";
import "./floating-keyboard.css";

// Kiosk-wide on-screen keyboard. Mounted once at the root of the app (see
// main.jsx) and needs no props: it watches every focus change in the
// document itself, so any text field anywhere - login, register,
// measurements, admin forms - gets it for free. A field opts out with
// `data-no-kiosk-keyboard` (readOnly/disabled fields, like the barcode
// scanner buffer, are already skipped automatically).
//
// The panel itself can be dragged by its header and resized from its corner
// handle - kiosk staff can park it wherever suits the screen and the app
// then keeps whatever field is being typed into clear of it, scrolling the
// field or, failing that, relocating the panel so nothing is ever hidden
// behind it.
const TEXT_INPUT_TYPES = new Set(["text", "email", "password", "tel", "search", "url", "number"]);
const NUMERIC_INPUT_TYPES = new Set(["number", "tel"]);

const NUMERIC_LAYOUT = {
    default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}", "{enter}"],
};

const STORAGE_KEY = "health-kiosk-keyboard-layout";
const EDGE_MARGIN = 8;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;
const MAX_WIDTH = 1040;
const MAX_HEIGHT = 560;
const DEFAULT_WIDTH = 760;
const DEFAULT_HEIGHT = 300;

function isKioskTextField(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (typeof el.closest === "function" && el.closest("[data-no-kiosk-keyboard]")) return false;

    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") return TEXT_INPUT_TYPES.has((el.type || "text").toLowerCase());

    return !!el.isContentEditable;
}

function getFieldValue(el) {
    return el.isContentEditable ? el.textContent : el.value;
}

// Writes through React's controlled-input value tracker so the field's own
// onChange fires exactly as if the character had been typed. Setting
// `element.value` directly is invisible to React - it patches the native
// setter to tell real input apart from a script assigning the property.
function setFieldValue(el, value) {
    if (el.isContentEditable) {
        el.textContent = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return;
    }

    const prototype = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor.set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
}

function findScrollParent(el) {
    let node = el.parentElement;

    while (node) {
        const style = window.getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }

    return document.scrollingElement || document.documentElement;
}

function scrollNodeBy(node, amount) {
    if (node === document.scrollingElement || node === document.documentElement) {
        window.scrollBy({ top: amount, behavior: "smooth" });
    } else {
        node.scrollBy({ top: amount, behavior: "smooth" });
    }
}

function rectsOverlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

// Keeps the panel fully on screen - after a browser resize, an orientation
// flip, or a drag/resize that would otherwise push it past the edge.
function clampLayout(layout) {
    const width = Math.min(Math.max(layout.width, MIN_WIDTH), Math.min(MAX_WIDTH, window.innerWidth - EDGE_MARGIN * 2));
    const height = Math.min(Math.max(layout.height, MIN_HEIGHT), Math.min(MAX_HEIGHT, window.innerHeight - EDGE_MARGIN * 2));
    const maxLeft = Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN);
    const maxTop = Math.max(EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN);

    return {
        width,
        height,
        left: Math.min(Math.max(layout.left, EDGE_MARGIN), maxLeft),
        top: Math.min(Math.max(layout.top, EDGE_MARGIN), maxTop),
    };
}

function defaultLayout() {
    const width = Math.min(DEFAULT_WIDTH, window.innerWidth - EDGE_MARGIN * 2);
    const height = Math.min(DEFAULT_HEIGHT, window.innerHeight - EDGE_MARGIN * 2);

    return {
        width,
        height,
        left: Math.max(EDGE_MARGIN, (window.innerWidth - width) / 2),
        top: window.innerHeight - height - EDGE_MARGIN,
    };
}

function loadStoredLayout() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        const isValid = ["left", "top", "width", "height"].every((key) => typeof parsed[key] === "number");

        return isValid ? parsed : null;
    } catch {
        // Storage blocked (private browsing) or the saved value is corrupt -
        // either way, fall back to the default dock position.
        return null;
    }
}

function persistLayout(layout) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
        // Nothing to do if storage isn't available - the panel just resets
        // to the default spot next load instead of remembering it.
    }
}

export default function FloatingKeyboard() {
    const [activeInput, setActiveInput] = useState(null);
    const [visible, setVisible] = useState(false);
    const [layoutName, setLayoutName] = useState("default");
    const [layout, setLayout] = useState(() => clampLayout(loadStoredLayout() || defaultLayout()));
    // Admin side and user/kiosk side are separately switchable - a back
    // office desk and a touchscreen kiosk station are different machines
    // with different needs. Defaults to both-on so the keyboard behaves
    // exactly as before while the real preference is still loading (and if
    // the request fails - a network hiccup shouldn't take the keyboard away).
    const [keyboardEnabled, setKeyboardEnabled] = useState({ admin: true, user: true });

    const keyboardRef = useRef(null);
    const wrapperRef = useRef(null);
    const activeInputRef = useRef(null);
    const visibleRef = useRef(false);
    const layoutRef = useRef(layout);
    const keyboardEnabledRef = useRef(keyboardEnabled);
    const hideTimeoutRef = useRef(null);
    const dragStateRef = useRef(null);
    const resizeStateRef = useRef(null);

    activeInputRef.current = activeInput;
    visibleRef.current = visible;
    layoutRef.current = layout;
    keyboardEnabledRef.current = keyboardEnabled;

    // Read fresh at the moment it matters (focus, or a live setting change)
    // rather than cached, so client-side navigation between /admin and the
    // kiosk/user pages is picked up without needing a full reload.
    const isEnabledForCurrentPage = () => (
        window.location.pathname.startsWith("/admin")
            ? keyboardEnabledRef.current.admin
            : keyboardEnabledRef.current.user
    );

    const isNumeric = activeInput ? NUMERIC_INPUT_TYPES.has((activeInput.type || "").toLowerCase()) : false;

    // Makes sure whatever field is currently focused is never left hidden
    // behind the panel. Tried in order: (1) do nothing if there's no overlap,
    // (2) scroll the field clear - this keeps the panel exactly where the
    // person dragged it, (3) if the field still can't be scrolled into view
    // (e.g. it sits in a fixed panel that doesn't scroll), move the keyboard
    // itself to whichever half of the screen the field isn't in.
    const ensureFieldVisible = useCallback(() => {
        requestAnimationFrame(() => {
            const el = activeInputRef.current;
            const wrapper = wrapperRef.current;
            if (!el || !wrapper || !visibleRef.current || !document.body.contains(el)) return;

            const keyboardRect = wrapper.getBoundingClientRect();
            const fieldRect = el.getBoundingClientRect();
            if (!rectsOverlap(keyboardRect, fieldRect)) return;

            const margin = 12;
            const scrollParent = findScrollParent(el);
            let delta = 0;

            if (fieldRect.bottom > keyboardRect.top && keyboardRect.top - margin >= fieldRect.height) {
                // Room above the panel - scroll the field up just clear of it.
                delta = fieldRect.bottom - keyboardRect.top + margin;
            } else if (fieldRect.top < keyboardRect.bottom) {
                // Otherwise scroll it down clear of the panel's bottom edge.
                delta = fieldRect.top - keyboardRect.bottom - margin;
            }

            if (delta !== 0) {
                scrollNodeBy(scrollParent, delta);
            }

            setTimeout(() => {
                if (activeInputRef.current !== el) return;

                const settledFieldRect = el.getBoundingClientRect();
                if (!rectsOverlap(wrapper.getBoundingClientRect(), settledFieldRect)) return;

                setLayout((current) => {
                    const fieldCenterY = settledFieldRect.top + settledFieldRect.height / 2;
                    const fieldCenterX = settledFieldRect.left + settledFieldRect.width / 2;

                    const relocated = {
                        ...current,
                        top: fieldCenterY > window.innerHeight / 2
                            ? EDGE_MARGIN
                            : window.innerHeight - current.height - EDGE_MARGIN,
                    };

                    const stillOverlapsVertically = !(
                        settledFieldRect.bottom <= relocated.top ||
                        settledFieldRect.top >= relocated.top + relocated.height
                    );

                    if (stillOverlapsVertically) {
                        relocated.left = fieldCenterX > window.innerWidth / 2
                            ? EDGE_MARGIN
                            : window.innerWidth - relocated.width - EDGE_MARGIN;
                    }

                    const next = clampLayout(relocated);
                    persistLayout(next);
                    return next;
                });
            }, 260);
        });
    }, []);

    // Loads the admin's on/off preferences (see Admin Settings > Kiosk
    // Preferences) and keeps them live: Settings.jsx fires
    // KEYBOARD_SETTING_CHANGED_EVENT right after a successful save, so
    // switching either one off hides the keyboard immediately on whatever
    // matching screen is currently open, without needing a reload.
    useEffect(() => {
        let alive = true;

        authService.kioskKeyboardSetting()
            .then((response) => {
                if (!alive) return;
                const { admin, user } = response.data || {};
                if (typeof admin === "boolean" || typeof user === "boolean") {
                    setKeyboardEnabled((current) => ({
                        admin: typeof admin === "boolean" ? admin : current.admin,
                        user: typeof user === "boolean" ? user : current.user,
                    }));
                }
            })
            .catch(() => {
                // Leave the defaults (both enabled) in place - see the state comment.
            });

        const handleSettingChanged = (event) => {
            const { admin, user } = event.detail || {};
            if (typeof admin !== "boolean" && typeof user !== "boolean") return;

            setKeyboardEnabled((current) => ({
                admin: typeof admin === "boolean" ? admin : current.admin,
                user: typeof user === "boolean" ? user : current.user,
            }));
        };

        window.addEventListener(KEYBOARD_SETTING_CHANGED_EVENT, handleSettingChanged);

        return () => {
            alive = false;
            window.removeEventListener(KEYBOARD_SETTING_CHANGED_EVENT, handleSettingChanged);
        };
    }, []);

    // Turning off the setting that applies to the page currently open has to
    // hide an already-showing keyboard right then, not just block the next
    // focus.
    useEffect(() => {
        if (!isEnabledForCurrentPage()) {
            setVisible(false);
            setActiveInput(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyboardEnabled]);

    useEffect(() => {
        const handleFocusIn = (event) => {
            if (!isEnabledForCurrentPage()) return;

            const target = event.target;
            if (!isKioskTextField(target)) return;

            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }

            setActiveInput(target);
            setLayoutName("default");
            setVisible(true);
            keyboardRef.current?.setInput(getFieldValue(target) || "");
            ensureFieldVisible();
        };

        // The blur fires before a tap on a keyboard key has finished
        // registering, so hiding is delayed a tick and re-checked against
        // where focus actually landed instead of hiding on every keystroke.
        const handleFocusOut = () => {
            hideTimeoutRef.current = setTimeout(() => {
                const focused = document.activeElement;
                if (isKioskTextField(focused)) return;
                if (wrapperRef.current?.contains(focused)) return;

                setVisible(false);
                setActiveInput(null);
            }, 0);
        };

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);

        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [ensureFieldVisible]);

    // Keeps the on-screen buffer in sync when the field's value changes from
    // outside a keypress - a barcode scanner, a "clear" button, or a field's
    // own formatting (LoginForm lower-cases and strips characters as you type).
    useEffect(() => {
        if (!activeInput) return undefined;

        const syncFromField = () => keyboardRef.current?.setInput(getFieldValue(activeInput) || "");
        activeInput.addEventListener("input", syncFromField);

        return () => activeInput.removeEventListener("input", syncFromField);
    }, [activeInput]);

    // A rotated device or a resized browser window can leave the panel
    // off-screen or covering the field in a new way - both are re-checked.
    useEffect(() => {
        const handleWindowResize = () => {
            setLayout((current) => clampLayout(current));
            ensureFieldVisible();
        };

        window.addEventListener("resize", handleWindowResize);
        return () => window.removeEventListener("resize", handleWindowResize);
    }, [ensureFieldVisible]);

    const handleChange = useCallback((input) => {
        const el = activeInputRef.current;
        if (!el) return;
        setFieldValue(el, input);
    }, []);

    const handleKeyPress = useCallback((button) => {
        if (button === "{shift}" || button === "{lock}") {
            setLayoutName((current) => (current === "default" ? "shift" : "default"));
            return;
        }

        if (button === "{enter}") {
            const el = activeInputRef.current;
            if (!el) return;

            const form = el.form;
            if (form) {
                if (typeof form.requestSubmit === "function") {
                    form.requestSubmit();
                } else {
                    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                }
            }

            el.blur();
            setVisible(false);
        }
    }, []);

    const handleClose = useCallback((event) => {
        event.stopPropagation();
        activeInputRef.current?.blur();
        setVisible(false);
    }, []);

    const handleResetLayout = useCallback((event) => {
        event.stopPropagation();
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Nothing to clean up if storage was never available.
        }
        setLayout(clampLayout(defaultLayout()));
        ensureFieldVisible();
    }, [ensureFieldVisible]);

    // Drag (header) and resize (corner handle) both use pointer capture on
    // the handle element itself, so the movement keeps tracking even if the
    // finger or cursor slips past the handle's own bounds mid-drag - no
    // window-level listeners to attach and tear down.
    const handleDragPointerDown = useCallback((event) => {
        if (event.target.closest("button")) return;

        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startLayout: layoutRef.current,
        };
    }, []);

    const handleDragPointerMove = useCallback((event) => {
        const state = dragStateRef.current;
        if (!state || state.pointerId !== event.pointerId) return;

        setLayout(clampLayout({
            ...state.startLayout,
            left: state.startLayout.left + (event.clientX - state.startX),
            top: state.startLayout.top + (event.clientY - state.startY),
        }));
    }, []);

    const handleDragPointerUp = useCallback((event) => {
        if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;

        dragStateRef.current = null;
        persistLayout(layoutRef.current);
        ensureFieldVisible();
    }, [ensureFieldVisible]);

    const handleResizePointerDown = useCallback((event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        resizeStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startLayout: layoutRef.current,
        };
    }, []);

    const handleResizePointerMove = useCallback((event) => {
        const state = resizeStateRef.current;
        if (!state || state.pointerId !== event.pointerId) return;

        setLayout(clampLayout({
            ...state.startLayout,
            width: state.startLayout.width + (event.clientX - state.startX),
            height: state.startLayout.height + (event.clientY - state.startY),
        }));
    }, []);

    const handleResizePointerUp = useCallback((event) => {
        if (!resizeStateRef.current || resizeStateRef.current.pointerId !== event.pointerId) return;

        resizeStateRef.current = null;
        persistLayout(layoutRef.current);
        ensureFieldVisible();
    }, [ensureFieldVisible]);

    return (
        <div
            ref={wrapperRef}
            className={`kiosk-keyboard-wrapper${visible ? " is-visible" : ""}`}
            style={{ left: layout.left, top: layout.top, width: layout.width, height: layout.height }}
            aria-hidden={!visible}
        >
            <div
                className="kiosk-keyboard-header"
                onPointerDown={handleDragPointerDown}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                onPointerCancel={handleDragPointerUp}
            >
                <span className="kiosk-keyboard-grip">
                    <GripHorizontal size={14} />
                    Keyboard
                </span>
                <div className="kiosk-keyboard-actions">
                    <button type="button" onClick={handleResetLayout} aria-label="Reset keyboard position and size">
                        <RotateCcw size={13} />
                    </button>
                    <button type="button" onClick={handleClose} aria-label="Hide keyboard">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div
                className="kiosk-keyboard-body"
                // A plain, non-focusable button div would not steal focus
                // anyway, but this stops a stray blur in browsers that treat
                // the pointer press itself as a focus-change signal.
                onMouseDown={(event) => event.preventDefault()}
            >
                <Keyboard
                    keyboardRef={(instance) => {
                        keyboardRef.current = instance;
                    }}
                    layoutName={layoutName}
                    layout={isNumeric ? NUMERIC_LAYOUT : undefined}
                    theme={`hg-theme-default kiosk-keyboard${isNumeric ? " kiosk-keyboard--numeric" : ""}`}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    preventMouseDownDefault
                    disableCaretPositioning
                />
            </div>

            <div
                className="kiosk-keyboard-resize-handle"
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                aria-hidden="true"
            />
        </div>
    );
}
