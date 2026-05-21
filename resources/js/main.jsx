import React from "react";
import ReactDOM from "react-dom/client";
import "./bootstrap";
import App from "./app";
import "../css/app.css";

ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
