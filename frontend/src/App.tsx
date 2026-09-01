import { useState, useEffect } from "react";
import "./App.css";

import Navegacion from "./components/Navegacion";
import Login from "./components/Login";
import Registro from "./components/Registro";
import AcordeonCanchas from "./components/AcordeonCanchas";
import Canchas from "./components/Canchas";
import ReservaCancha from "./components/ReservaCancha";
import DashboardAdmin from "./components/DashboardAdmin";
import DashboardCliente from "./components/DashboardCliente";
import WhatsappFloat from "./components/WhatsappFloat";
import NotificacionesPill from "./components/NotificacionesPill";
import UbicacionMapa from "./components/UbicacionMapa";
import AnuncioBanner from "./components/AnuncioBanner";
import TablonRetos from "./components/TablonRetos";
import ThemeJoystick from "./components/ThemeJoystick";
import Icons from "./components/Icons";
import { getStoredUser, removeAuthToken } from "./services/api";

type VistaActual = "landing" | "login" | "registro" | "reserva" | "admin_dashboard" | "client_dashboard";

function App() {
  const [vista, setVista] = useState<VistaActual>("landing");
  const [usuario, setUsuario] = useState<any | null>(null);
  const [canchaParaReservar, setCanchaParaReservar] = useState<any | null>(null);

  // Estado del Anuncio Global del Admin
  const [anuncioGlobal, setAnuncioGlobal] = useState<{ titulo: string; mensaje: string; activo: boolean } | null>({
    titulo: "PROMO NOCTURNA",
    mensaje: "Aprovecha 20% de descuento en partidos nocturnos ingresando el cupón FUTBOL2026",
    activo: true,
  });

  // Estado del Tema (Modo Claro / Oscuro)
  const [tema, setTema] = useState<"claro" | "oscuro">(() => {
    return (localStorage.getItem("futbolzone_tema") as "claro" | "oscuro") || "claro";
  });

  // Estado del Modo de Visualización (Computador / Celular)
  const [modoDispositivo, setModoDispositivo] = useState<"computador" | "celular">("computador");

  useEffect(() => {
    const userGuardado = getStoredUser();
    if (userGuardado) {
      setUsuario(userGuardado);
    }
  }, []);

  useEffect(() => {
    if (tema === "oscuro") {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [tema]);

  const toggleTema = () => {
    const nuevoTema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevoTema);
    localStorage.setItem("futbolzone_tema", nuevoTema);
  };

  const setTemaManual = (nuevoTema: "claro" | "oscuro") => {
    setTema(nuevoTema);
    localStorage.setItem("futbolzone_tema", nuevoTema);
  };

  const manejarLoginExitoso = (user: any) => {
    setUsuario(user);
    if (canchaParaReservar) {
      setVista("reserva");
    } else if (user.rol === "admin") {
      setVista("admin_dashboard");
    } else {
      setVista("client_dashboard");
    }
  };

  const cerrarSesion = () => {
    removeAuthToken();
    setUsuario(null);
    setCanchaParaReservar(null);
    setVista("landing");
  };

  const irADashboard = () => {
    if (!usuario) return;
    if (usuario.rol === "admin") setVista("admin_dashboard");
    else setVista("client_dashboard");
  };

  // Página independiente de Configuración de Reserva
  if (vista === "reserva" && canchaParaReservar) {
    return (
      <ReservaCancha
        cancha={canchaParaReservar}
        onGoBack={() => {
          setCanchaParaReservar(null);
          setVista("landing");
        }}
        onReservationCreated={() => {
          setCanchaParaReservar(null);
          setVista("client_dashboard");
        }}
        onRequireLogin={() => setVista("login")}
      />
    );
  }

  // Dashboard de Admin
  if (vista === "admin_dashboard" && usuario?.rol === "admin") {
    return (
      <DashboardAdmin
        onLogout={cerrarSesion}
        onPublicarAnuncio={(nuevoAnuncio) => setAnuncioGlobal(nuevoAnuncio)}
      />
    );
  }

  // Dashboard de Cliente
  if (vista === "client_dashboard" && usuario) {
    return (
      <DashboardCliente
        usuario={usuario}
        onLogout={cerrarSesion}
        onGoToBooking={() => setVista("landing")}
      />
    );
  }

  return (
    <div className={`app-device-wrapper ${tema === "oscuro" ? "dark-mode" : ""} ${modoDispositivo === "celular" ? "sim-mobile-active" : "sim-desktop-active"}`}>
      {/* Marco de celular interactivo (si está en modo celular) */}
      <div className="fz-screen-viewport">
        {modoDispositivo === "celular" && (
          <div className="fz-phone-top-notch">
            <div className="fz-phone-camera-dot" />
            <div className="fz-phone-speaker-bar" />
          </div>
        )}

        <div className={`app-main-wrapper ${tema === "oscuro" ? "dark-mode" : ""} ${vista === "login" || vista === "registro" ? "fz-bg-faded-active" : ""}`}>
          {/* ANUNCIO GLOBAL DEL ADMIN */}
          <AnuncioBanner anuncio={anuncioGlobal} />

          {/* HEADER */}
          <header className="header-zone">
            <div className="logo" onClick={() => setVista("landing")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.Ball size={26} color="#10b981" />
              <h1 style={{ margin: 0 }}>Futbol<span>Zone</span></h1>
            </div>

            <Navegacion
              usuario={usuario}
              onNavigateToDashboard={irADashboard}
            />

        <div className="header-buttons" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Campanita de Notificaciones */}
          <NotificacionesPill onNavigate={(vistaDestino) => setVista(vistaDestino as VistaActual)} />

          {usuario ? (
            <div className="user-session-pill">
              <span className="user-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icons.User size={15} color="#10b981" />
                {usuario.rol === "admin" ? `Admin: ${usuario.nombre}` : usuario.nombre}
              </span>
              <button className="btn btn-panel" onClick={irADashboard}>
                {usuario.rol === "admin" ? "Dashboard" : "Mis Reservas"}
              </button>
              <button className="btn btn-logout-sm" onClick={cerrarSesion} title="Cerrar Sesión">
                <Icons.Lock size={13} />
              </button>
            </div>
          ) : (
            <>
              <button className="btn btn-login" onClick={() => setVista("login")}>
                Iniciar Sesión
              </button>

              <button className="btn btn-register" onClick={() => setVista("registro")}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* BANNER PRINCIPAL */}
      <main>
        <section id="inicio" className="banner">
          <div className="banner-content">
            <span className="banner-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icons.Ball size={14} color="#10b981" />
              Gestión Deportiva & Reservas en Línea
            </span>
            <h2>Reserva Tu Cancha Sintética En Tiempo Real</h2>
            <p>
              Canchas de Fútbol 5, 7 y 11 con iluminación LED, césped sintético de alta calidad y vestuarios de primera.
            </p>
            <div className="banner-cta-group">
              <a href="#canchas" className="btn-primary-hero">
                Reservar Turno Ahora
              </a>
              {usuario && (
                <button className="btn-secondary-hero" onClick={irADashboard}>
                  Ver Mi Panel
                </button>
              )}
            </div>
          </div>
        </section>

        {/* BARRA DE ESTADÍSTICAS RÁPIDAS */}
        <div className="hero-stats-bar">
          <div className="hero-stat-item">
            <div className="hero-stat-num">3 <span>Canchas</span></div>
            <div className="hero-stat-desc">Fútbol 5, 7 y 11 Profesionales</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-num">100% <span>LED</span></div>
            <div className="hero-stat-desc">Iluminación Nocturna de Estadio</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-num">⚡ <span>En Vivo</span></div>
            <div className="hero-stat-desc">Reserva Inmediata sin Esperas</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-num">4.9 <span>★</span></div>
            <div className="hero-stat-desc">Satisfacción de Nuestros Jugadores</div>
          </div>
        </div>

        {/* ACORDEÓN DE IMÁGENES */}
        <AcordeonCanchas />

        {/* CANCHAS CON FILTRO RÁPIDO Y ESTRELLAS */}
        <Canchas
          onSelectCancha={(cancha) => {
            setCanchaParaReservar(cancha);
            setVista("reserva");
          }}
        />

        {/* TABLÓN DE RETOS / BUSCADOR DE JUGADORES */}
        <TablonRetos onRequireLogin={() => setVista("login")} />

        {/* INNOVACIÓN TECNOLÓGICA & ARQUITECTURA DEL SOFTWARE (SENA ADSO III) */}
        <section id="caracteristicas" className="section quienes-section">
          <div className="section-container">
            <span className="section-badge"><Icons.Code size={14} /> Proyecto Formativo · SENA ADSO III Trimestre</span>
            <h2>Innovación Tecnológica & Arquitectura del Software</h2>
            <p className="quienes-intro">
              <strong>FutbolZone</strong> es una plataforma tecnológica integral desarrollada con arquitectura Full-Stack moderna para digitalizar la administración de complejos deportivos, reservas en tiempo real, analítica ejecutiva y comunidad de jugadores.
            </p>

            {/* BADGES DEL STACK TECNOLÓGICO */}
            <div className="fz-tech-stack-row">
              <span className="fz-tech-badge"><Icons.Zap size={13} /> FastAPI (Python 3.14)</span>
              <span className="fz-tech-badge"><Icons.Code size={13} /> React + TypeScript</span>
              <span className="fz-tech-badge"><Icons.Zap size={13} /> Vite Build System</span>
              <span className="fz-tech-badge"><Icons.Shield size={13} /> JWT & Bcrypt Cifrado</span>
              <span className="fz-tech-badge"><Icons.Mail size={13} /> SMTP Real (OTP Gmail)</span>
              <span className="fz-tech-badge"><Icons.FileSpreadsheet size={13} /> SheetJS Excel (.xlsx)</span>
              <span className="fz-tech-badge"><Icons.Database size={13} /> SQLAlchemy ORM</span>
            </div>

            <div className="quienes-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: "28px" }}>
              <div className="quienes-card">
                <div className="quienes-icon">
                  <Icons.Clock size={24} color="#059669" />
                </div>
                <h3>Motor de Turnos en Vivo</h3>
                <p>
                  Algoritmo inteligente de validación horaria que previene solapamientos y calcula liquidaciones dinámicas según la jornada y duración de la reserva.
                </p>
              </div>

              <div className="quienes-card">
                <div className="quienes-icon">
                  <Icons.QrCode size={24} color="#059669" />
                </div>
                <h3>Tickets QR Imprimibles</h3>
                <p>
                  Generación instantánea de tickets de reserva digitales listos para imprimir o guardar en PDF con código QR de acceso rápido a la cancha.
                </p>
              </div>

              <div className="quienes-card">
                <div className="quienes-icon">
                  <Icons.Chart size={24} color="#059669" />
                </div>
                <h3>Reportes Nativos en Excel</h3>
                <p>
                  Exportación ejecutiva en formato <code>.xlsx</code> con fórmulas de recaudación, historial de jugadores y tablas de posiciones de torneos.
                </p>
              </div>

              <div className="quienes-card">
                <div className="quienes-icon">
                  <Icons.Lock size={24} color="#059669" />
                </div>
                <h3>Seguridad OTP por Correo</h3>
                <p>
                  Restablecimiento seguro de contraseñas mediante PIN criptográfico de 6 dígitos con vigencia de 15 minutos conectado a servidores SMTP reales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS CON IMÁGENES */}
        <section id="beneficios" className="section beneficios-section">
          <div className="section-container">
            <h2>Instalaciones & Beneficios</h2>
            <div className="beneficios-grid">
              <div className="beneficio-card">
                <img
                  src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=500&q=80"
                  alt="Iluminación LED Nocturna"
                  className="beneficio-img"
                />
                <div className="beneficio-card-content">
                  <h3>Iluminación LED Profesional</h3>
                  <p>Juega de noche con iluminación de foco LED de estadio sin sombras.</p>
                </div>
              </div>

              <div className="beneficio-card">
                <img
                  src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=500&q=80"
                  alt="Césped Sintético"
                  className="beneficio-img"
                />
                <div className="beneficio-card-content">
                  <h3>Césped Sintético Premium</h3>
                  <p>Canchas con amortiguación y fibra sintética de alta tecnología anti-impacto.</p>
                </div>
              </div>

              <div className="beneficio-card">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80"
                  alt="Vestuarios & Duchas"
                  className="beneficio-img"
                />
                <div className="beneficio-card-content">
                  <h3>Vestuarios & Duchas</h3>
                  <p>Espacios impecables y cómodos para refrescarte después de cada partido.</p>
                </div>
              </div>

              <div className="beneficio-card">
                <img
                  src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=500&q=80"
                  alt="Parqueadero Vigilado"
                  className="beneficio-img"
                />
                <div className="beneficio-card-content">
                  <h3>Parqueadero Vigilado</h3>
                  <p>Estacionamiento privado y seguro durante todo el tiempo de tu estadía.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UBICACIÓN Y MAPA GOOGLE MAPS */}
        <UbicacionMapa />
      </main>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <WhatsappFloat />

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <p>© 2026 FutbolZone · Sistema de Gestión Deportiva.</p>
          <p>Proyecto Formativo SENA ADSO III Trimestre · Nicolas Felipe Paz Ortiz</p>
        </div>
      </footer>
    </div>

    {/* MODAL FLOTANTE DE LOGIN CON FONDO DESVANECIDO */}
    {vista === "login" && (
      <Login
        onLoginSuccess={manejarLoginExitoso}
        onSwitchToRegister={() => setVista("registro")}
        onGoHome={() => setVista("landing")}
      />
    )}

    {/* MODAL FLOTANTE DE REGISTRO CON FONDO DESVANECIDO */}
    {vista === "registro" && (
      <Registro
        onRegisterSuccess={() => setVista("login")}
        onSwitchToLogin={() => setVista("login")}
        onGoHome={() => setVista("landing")}
      />
    )}

    {/* Barra inferior del marco de celular (si está activo) */}
    {modoDispositivo === "celular" && (
      <div className="fz-phone-bottom-notch">
        <div className="fz-phone-home-indicator" />
      </div>
    )}
  </div>

  {/* 🕹️ PANEL LATERAL ARCADE CLÁSICO (3 BOTONES: TEMA JOYSTICK + MODO PC + MODO MÓVIL) */}
  <ThemeJoystick
    tema={tema}
    onToggleTema={toggleTema}
    onSetTema={setTemaManual}
    modoDispositivo={modoDispositivo}
    onCambiarModoDispositivo={setModoDispositivo}
  />
</div>
  );
}

export default App;