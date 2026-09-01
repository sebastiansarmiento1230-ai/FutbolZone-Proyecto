import { useState, useCallback } from "react";
import "./ThemeJoystick.css";

interface ThemeJoystickProps {
  tema: "claro" | "oscuro";
  onToggleTema: () => void;
  onSetTema?: (tema: "claro" | "oscuro") => void;
  modoDispositivo: "computador" | "celular";
  onCambiarModoDispositivo: (modo: "computador" | "celular") => void;
}

export function ThemeJoystick({
  tema,
  onToggleTema,
  onSetTema,
  modoDispositivo,
  onCambiarModoDispositivo,
}: ThemeJoystickProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Micro-vibración háptica para celulares
  const vibrar = useCallback((ms = 15) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignorar si el navegador no permite vibración
      }
    }
  }, []);

  const manejarClickTema = () => {
    vibrar(18);
    const nuevoTema = tema === "claro" ? "oscuro" : "claro";
    if (onSetTema) {
      onSetTema(nuevoTema);
    } else {
      onToggleTema();
    }
  };

  const manejarClickDispositivo = (modo: "computador" | "celular") => {
    vibrar(14);
    onCambiarModoDispositivo(modo);
  };

  return (
    <aside
      className={`fz-floating-dock ${tema === "oscuro" ? "theme-dark" : "theme-light"}`}
      aria-label="Panel de control lateral"
    >
      <div className="fz-dock-capsule">
        {/* ── BOTÓN 1: MODO CLARO / OSCURO ── */}
        <button
          type="button"
          className={`fz-dock-btn btn-theme ${tema === "oscuro" ? "is-dark" : "is-light"}`}
          onClick={manejarClickTema}
          onMouseEnter={() => setTooltip(tema === "claro" ? "Cambiar a Modo Oscuro 🌙" : "Cambiar a Modo Claro ☀️")}
          onMouseLeave={() => setTooltip(null)}
          title={tema === "claro" ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
          aria-label={tema === "claro" ? "Activar Modo Oscuro" : "Activar Modo Claro"}
        >
          {tema === "claro" ? (
            /* Icono Sol (Modo Claro Activo) */
            <svg className="dock-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="5" strokeWidth="2" />
              <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          ) : (
            /* Icono Luna (Modo Oscuro Activo) */
            <svg className="dock-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="fz-dock-sep" />

        {/* ── BOTÓN 2: MODO COMPUTADOR ── */}
        <button
          type="button"
          className={`fz-dock-btn btn-computer ${modoDispositivo === "computador" ? "is-active" : ""}`}
          onClick={() => manejarClickDispositivo("computador")}
          onMouseEnter={() => setTooltip("Vista Computador (Escritorio)")}
          onMouseLeave={() => setTooltip(null)}
          title="Vista Computador"
          aria-label="Vista Computador"
          aria-pressed={modoDispositivo === "computador"}
        >
          <svg className="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect width="20" height="14" x="2" y="3" rx="2" strokeWidth="2" />
            <line x1="8" x2="16" y1="21" y2="21" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" x2="12" y1="17" y2="21" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── BOTÓN 3: MODO CELULAR ── */}
        <button
          type="button"
          className={`fz-dock-btn btn-mobile ${modoDispositivo === "celular" ? "is-active" : ""}`}
          onClick={() => manejarClickDispositivo("celular")}
          onMouseEnter={() => setTooltip("Vista Celular (Móvil)")}
          onMouseLeave={() => setTooltip(null)}
          title="Vista Celular"
          aria-label="Vista Celular"
          aria-pressed={modoDispositivo === "celular"}
        >
          <svg className="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" strokeWidth="2" />
            <line x1="12" x2="12.01" y1="18" y2="18" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tooltip limpio a la izquierda */}
      <div className={`fz-dock-tooltip ${tooltip ? "is-visible" : ""}`} role="status">
        {tooltip || ""}
      </div>
    </aside>
  );
}

export default ThemeJoystick;
