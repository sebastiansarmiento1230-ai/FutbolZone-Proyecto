import { useState, type ChangeEvent, type FormEvent } from "react";
import "./Login.css";
import { api, setAuthToken, setStoredUser } from "../services/api";
import RecuperarPasswordModal from "./RecuperarPasswordModal";
import Icons from "./Icons";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister?: () => void;
  onGoHome?: () => void;
}

function Login({ onLoginSuccess, onSwitchToRegister, onGoHome }: LoginProps) {
  const [correo, setCorreo] = useState<string>("");
  const [contrasena, setContrasena] = useState<string>("");
  const [mostrarContrasena, setMostrarContrasena] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState<boolean>(false);

  const manejarCorreo = (e: ChangeEvent<HTMLInputElement>) => setCorreo(e.target.value);
  const manejarContrasena = (e: ChangeEvent<HTMLInputElement>) => setContrasena(e.target.value);

  const setDemoUser = (email: string, pass: string) => {
    setCorreo(email);
    setContrasena(pass);
    setMensaje(null);
  };

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena.trim()) {
      setMensaje({ texto: "Por favor completa todos los campos requeridos.", tipo: "error" });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      const res = await api.login(correo, contrasena);
      if (res.success && res.data?.access_token) {
        setAuthToken(res.data.access_token);
        setStoredUser(res.data.usuario);
        setMensaje({ texto: "¡Bienvenido de nuevo! Iniciando sesión...", tipo: "exito" });
        setTimeout(() => onLoginSuccess(res.data.usuario), 600);
      } else {
        setMensaje({
          texto: res.message || "Credenciales incorrectas. Verifica tu correo y clave.",
          tipo: "error",
        });
      }
    } catch (err: any) {
      setMensaje({
        texto: err.message || "No se pudo conectar con el servidor.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fz-pro-auth-layout">
      {/* ── COLUMNA IZQUIERDA: SHOWCASE CORPORATIVO ── */}
      <div className="fz-pro-auth-banner">
        <div className="fz-banner-mesh-bg"></div>
        <div className="fz-banner-glow-spot glow-1"></div>
        <div className="fz-banner-glow-spot glow-2"></div>

        <div className="fz-banner-top">
          {onGoHome && (
            <button type="button" className="fz-btn-back-pill" onClick={onGoHome} title="Volver al Inicio">
              <Icons.ArrowLeft size={16} />
              <span>Volver al inicio</span>
            </button>
          )}
          <div className="fz-banner-logo-badge">
            <Icons.Ball size={20} color="#10b981" />
            <span>FutbolZone ADSO</span>
          </div>
        </div>

        <div className="fz-banner-center">
          <span className="fz-tag-pill">⚡ Experiencia Deportiva Digital</span>
          <h1 className="fz-banner-title">
            Tu cancha sintética <br />
            <span className="fz-text-gradient">a un solo clic.</span>
          </h1>
          <p className="fz-banner-desc">
            Gestiona reservas en tiempo real, compite en torneos oficiales y organiza tus partidos sin esperas ni llamadas.
          </p>

          <div className="fz-banner-features-grid">
            <div className="fz-feature-item">
              <div className="fz-feature-icon-box">
                <Icons.Calendar size={18} color="#10b981" />
              </div>
              <div>
                <h4>Reserva en Vivo</h4>
                <p>Disponibilidad 24/7 sin solapamientos</p>
              </div>
            </div>

            <div className="fz-feature-item">
              <div className="fz-feature-icon-box">
                <Icons.Lightbulb size={18} color="#10b981" />
              </div>
              <div>
                <h4>Iluminación LED</h4>
                <p>Canchas 5, 7 y 11 profesionales</p>
              </div>
            </div>

            <div className="fz-feature-item">
              <div className="fz-feature-icon-box">
                <Icons.Shield size={18} color="#10b981" />
              </div>
              <div>
                <h4>Seguridad JWT</h4>
                <p>Acceso cifrado y seguro para tus datos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="fz-banner-footer">
          <div className="fz-social-proof">
            <div className="fz-stars-row">
              <Icons.Star size={14} color="#f59e0b" />
              <Icons.Star size={14} color="#f59e0b" />
              <Icons.Star size={14} color="#f59e0b" />
              <Icons.Star size={14} color="#f59e0b" />
              <Icons.Star size={14} color="#f59e0b" />
            </div>
            <span><strong>4.9/5</strong> · Más de 2.500 partidos jugados</span>
          </div>
        </div>
      </div>

      {/* ── COLUMNA DERECHA: FORMULARIO ELEGANTE ── */}
      <div className="fz-pro-auth-card-side">
        <div className="fz-pro-card">
          {/* Header del Formulario */}
          <div className="fz-pro-card-header">
            <div className="fz-brand-avatar-box">
              <Icons.Ball size={28} color="#ffffff" />
            </div>
            <h2>Iniciar Sesión</h2>
            <p>Ingresa a tu cuenta para continuar en FutbolZone</p>
          </div>

          {/* Acceso Rápido 1-Clic para Demostración */}
          <div className="fz-pro-demo-section">
            <div className="fz-demo-header-label">
              <Icons.Sparkles size={14} color="#10b981" />
              <span>Accesos rápidos de demostración:</span>
            </div>
            <div className="fz-demo-pills-row">
              <button
                type="button"
                className="fz-demo-pill admin"
                onClick={() => setDemoUser("admin@futbolzone.com", "admin123")}
              >
                👑 <span>Administrador</span>
              </button>
              <button
                type="button"
                className="fz-demo-pill cliente"
                onClick={() => setDemoUser("cliente@futbolzone.com", "cliente123")}
              >
                👤 <span>Cliente</span>
              </button>
            </div>
          </div>

          <div className="fz-divider-text">
            <span>o ingresa con tu correo</span>
          </div>

          {/* Formulario */}
          <form onSubmit={manejarEnvio} className="fz-pro-form">
            <div className="fz-pro-field">
              <label htmlFor="login-email">Correo Electrónico *</label>
              <div className="fz-input-icon-wrapper">
                <span className="fz-field-icon">
                  <Icons.Mail size={18} color="#64748b" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={correo}
                  onChange={manejarCorreo}
                  placeholder="ejemplo@futbolzone.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="fz-pro-field">
              <div className="fz-field-label-row">
                <label htmlFor="login-password">Contraseña *</label>
                <button
                  type="button"
                  className="fz-btn-forgot"
                  onClick={() => setMostrarModalRecuperar(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="fz-input-icon-wrapper">
                <span className="fz-field-icon">
                  <Icons.Lock size={18} color="#64748b" />
                </span>
                <input
                  id="login-password"
                  type={mostrarContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={manejarContrasena}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="fz-btn-eye"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  title={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
                  aria-label="Alternar visibilidad de contraseña"
                >
                  {mostrarContrasena ? (
                    <Icons.EyeOff size={18} color="#64748b" />
                  ) : (
                    <Icons.Eye size={18} color="#64748b" />
                  )}
                </button>
              </div>
            </div>

            {mensaje && (
              <div className={`fz-pro-alert ${mensaje.tipo}`} role="alert">
                <span className="fz-alert-icon">
                  {mensaje.tipo === "exito" ? <Icons.Check size={16} /> : "⚠️"}
                </span>
                <span>{mensaje.texto}</span>
              </div>
            )}

            <button type="submit" className="fz-btn-submit-gradient" disabled={cargando}>
              {cargando ? (
                <span className="fz-spinner-row">
                  <span className="fz-spinner"></span>
                  <span>Verificando credenciales...</span>
                </span>
              ) : (
                <span>Ingresar a mi Cuenta ➔</span>
              )}
            </button>
          </form>

          {onSwitchToRegister && (
            <div className="fz-pro-card-footer">
              <p>
                ¿Aún no tienes cuenta?{" "}
                <button type="button" className="fz-link-action" onClick={onSwitchToRegister}>
                  Regístrate gratis aquí
                </button>
              </p>
            </div>
          )}

          <div className="fz-security-badge-footer">
            <Icons.Shield size={14} color="#10b981" />
            <span>Conexión cifrada SSL · FutbolZone SENA ADSO III</span>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación con PIN */}
      {mostrarModalRecuperar && (
        <RecuperarPasswordModal
          emailInicial={correo}
          onClose={() => setMostrarModalRecuperar(false)}
          onSuccessLogin={() => setMostrarModalRecuperar(false)}
        />
      )}
    </div>
  );
}

export default Login;