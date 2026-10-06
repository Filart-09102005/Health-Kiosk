import React from "react";
import ReactDOM from "react-dom/client";
import "./bootstrap";
import App from "./app";
import FloatingKeyboard from "./Global/FloatingKeyboard/FloatingKeyboard.jsx";
import "../css/app.css";

ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
        <App />
        {/* Mounted once, outside every layout, so its fixed positioning is
            never affected by a transformed ancestor and it applies kiosk-wide. */}
        <FloatingKeyboard />
    </React.StrictMode>
);
