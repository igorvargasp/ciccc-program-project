import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "react-hot-toast"; // <--- 1. Importe o Toaster aqui
import App from "./App";
import { queryClient } from "./lib/queryClient";
import i18n from "./lib/i18n";
import { useAppStore } from "./store/app";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// Restore lang preference before render
const savedLang = localStorage.getItem("sfh-lang");
if (savedLang) i18n.changeLanguage(savedLang);

// Restore auth token into Zustand store
const savedToken = localStorage.getItem("sfh-token");
if (savedToken) useAppStore.getState().setToken(savedToken);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                style: {
                  background: "var(--surface, #18181b)",
                  color: "var(--foreground, #fff)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "13px",
                },
              }}
            />
            <App />
          </AuthProvider>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
