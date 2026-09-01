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
    <div
      className="fz-floating-auth-backdrop"
      onClick={() => onGoHome && onGoHome()}
      role="dialog"
      aria-modal="true"
    >
      {/* ── CARD FLOTANTE CON EFECTO GLASS Y FONDO DESVANECIDO ── */}
      <div
        className="fz-floating-auth-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de Cerrar Flotante */}
        {onGoHome && (
          <button
            type="button"
            className="fz-btn-modal-close-corner"
            onClick={onGoHome}
            title="Cerrar y volver al inicio"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        )}

        {/* Cabecera de la Tarjeta Flotante */}
        <div className="fz-floating-card-header">
          <div className="fz-brand-avatar-box" style={{ background: "transparent", border: "none", boxShadow: "none", width: "auto", height: "auto" }}>
            <img
              src="/logo-futbolzone.png"
              alt="Logo FutbolZone"
              style={{ width: "70px", height: "70px", objectFit: "contain" }}
            />
          </div>
          <span className="fz-brand-pill-tag">FutbolZone ADSO III</span>
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para acceder a tus reservas</p>
        </div>

        <div className="fz-floating-card-body">
          {/* Accesos Rápidos 1-Clic */}
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
                  title={mostrarContrasena ? "Ocultar" : "Ver"}
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