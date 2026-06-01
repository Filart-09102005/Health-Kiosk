import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ASSISTANT_PROMPTS, ASSISTANT_STORAGE_KEY } from "../constants/assistantPrompts";
import { canUseSpeechSynthesis, speakAssistantText, stopAssistantSpeech } from "../services/speechService";

const AssistantContext = createContext(null);

function readInitialAssistantState() {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(ASSISTANT_STORAGE_KEY) === "on";
}

export function AssistantProvider({ children }) {
    const [enabled, setEnabled] = useState(readInitialAssistantState);
    const speechSupported = canUseSpeechSynthesis();

    useEffect(() => {
        window.localStorage.setItem(ASSISTANT_STORAGE_KEY, enabled ? "on" : "off");
    }, [enabled]);

    const speak = useCallback(
        (promptOrText, options = {}) => {
            const text = ASSISTANT_PROMPTS[promptOrText] || promptOrText;

            if (!options.force && !enabled) return false;

            return speakAssistantText(text, options);
        },
        [enabled],
    );

    const enableAssistant = useCallback(() => {
        setEnabled(true);
        speakAssistantText(ASSISTANT_PROMPTS.enabled);
    }, []);

    const disableAssistant = useCallback(() => {
        stopAssistantSpeech();
        setEnabled(false);
        speakAssistantText(ASSISTANT_PROMPTS.disabled);
    }, []);

    const toggleAssistant = useCallback(() => {
        if (enabled) {
            disableAssistant();
        } else {
            enableAssistant();
        }
    }, [disableAssistant, enableAssistant, enabled]);

    const setAssistantEnabled = useCallback(
        (nextEnabled) => {
            if (nextEnabled) {
                enableAssistant();
            } else {
                disableAssistant();
            }
        },
        [disableAssistant, enableAssistant],
    );

    const value = useMemo(
        () => ({
            enabled,
            speechSupported,
            speak,
            stop: stopAssistantSpeech,
            setEnabled: setAssistantEnabled,
            toggleAssistant,
        }),
        [enabled, setAssistantEnabled, speak, speechSupported, toggleAssistant],
    );

    return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
    const context = useContext(AssistantContext);

    if (!context) {
        throw new Error("useAssistant must be used inside AssistantProvider.");
    }

    return context;
}
