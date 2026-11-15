import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
// Tokens v8 primero: colores, forma, tipografía y movimiento salen solo de aquí (DISEÑO §2).
import "./estilos/tokens.css";
import "./estilos/base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
