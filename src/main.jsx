import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"
import { AuthProvider } from "./lib/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
    <link rel="icon" type="image/png" href="/logo.ico" />
      <App />
    </BrowserRouter>
  </AuthProvider>
)