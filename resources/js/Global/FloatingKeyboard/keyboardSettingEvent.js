// Split out from FloatingKeyboard.jsx on purpose: that file also imports
// react-simple-keyboard and its CSS as side effects, which can't be
// tree-shaken away, so anything that only needs this event name (like the
// admin Settings page) would otherwise drag the whole keyboard library into
// its own bundle just to read a string constant.

// Fired by the admin Settings page right after a successful save, so a
// toggle takes effect immediately on every open tab/kiosk screen instead of
// only after the next reload.
export const KEYBOARD_SETTING_CHANGED_EVENT = "health-kiosk:keyboard-setting-changed";
