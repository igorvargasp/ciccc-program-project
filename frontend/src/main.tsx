import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // ou o seu arquivo de estilos global
import { AuthProvider } from "./context/AuthContext.tsx"; // Importe o seu AuthProvider aqui

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
