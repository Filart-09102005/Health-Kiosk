export function canUseSpeechSynthesis() {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function stopAssistantSpeech() {
    if (!canUseSpeechSynthesis()) return;

    window.speechSynthesis.cancel();
}

export function speakAssistantText(text, options = {}) {
    if (!text || !canUseSpeechSynthesis()) return false;

    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = options.rate ?? 1;
    speech.pitch = options.pitch ?? 1;
    speech.volume = options.volume ?? 1;
    speech.lang = options.lang ?? "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    return true;
}
