import { useState, type FormEvent } from "react";
import "./Registro.css";
import { api } from "../services/api";
import Icons from "./Icons";

interface RegistroProps {
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onGoHome?: () => void;
}

function Registro({ onRegisterSuccess, onSwitchToLogin, onGoHome }: RegistroProps) {
  const [nombre, setNombre] = useState<string>("");
  const [apellido, setApellido] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState<boolean>(false);
  const [aceptaTratamientoDatos, setAceptaTratamientoDatos] = useState<boolean>(false);
  const [mostrarModalHabeasData, setMostrarModalHabeasData] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  // Requisitos dinámicos de contraseña
  const tieneLongitud = password.length >= 8;
  const tieneNumero = /[0-9]/.test(password);
  const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const tieneMayuscula = /[A-Z]/.test(password);
  const coincidenClaves = password.length > 0 && password === confirmPassword;

  // Calcular la fortaleza de la contraseña
  const calcularFortaleza = () => {
    if (!password) return { porcentaje: 0, color: "#cbd5e1", label: "" };
    
    let puntos = 0;
    if (tieneLongitud) puntos += 25;
    if (tieneNumero) puntos += 25;
    if (tieneMayuscula) puntos += 25;
    if (tieneEspecial) puntos += 25;

    if (telefono && telefono.length >= 4 && password.includes(telefono)) {
      puntos = Math.min(puntos, 25);
    }

    if (puntos <= 25) {
      return { porcentaje: 25, color: "#ef4444", label: "Débil" };
    } else if (puntos <= 50) {
      return { porcentaje: 50, color: "#f59e0b", label: "Media" };
    } else if (puntos <= 75) {
      return { porcentaje: 75, color: "#3b82f6", label: "Buena" };
    } else {
      return { porcentaje: 100, color: "#10b981", label: "Excelente" };
    }
  };

  const fortaleza = calcularFortaleza();

  const manejarEnvio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !password || !confirmPassword) {
      setMensaje({ texto: "Por favor completa todos los campos obligatorios.", tipo: "error" });
      return;
    }

    if (!aceptaTratamientoDatos) {
      setMensaje({
        texto: "Debes autorizar el tratamiento de datos personales (Ley 1581) para completar el registro.",
        tipo: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMensaje({ texto: "Las contraseñas no coinciden. Por favor verifícalas.", tipo: "error" });
      return;
    }

    if (password.length < 8) {
      setMensaje({ texto: "La contraseña debe tener al menos 8 caracteres.", tipo: "error" });
      return;
    }

    if (!tieneEspecial) {
      setMensaje({
        texto: "La contraseña debe incluir al menos un carácter especial (ej. @, #, $, %, !).",
        tipo: "error",
      });
      return;
    }

    if (telefono && (password === telefono || password.includes(telefono))) {
      setMensaje({
        texto: "Por seguridad, la contraseña no puede contener tu número de teléfono.",
        tipo: "error",
      });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      const res = await api.registro({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefono.trim(),
        password,
      });

      if (res.success) {
        setMensaje({
          texto: "¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...",
          tipo: "exito",
        });
        setTimeout(() => {
          if (onRegisterSuccess) onRegisterSuccess();
          else if (onSwitchToLogin) onSwitchToLogin();
        }, 1200);
      } else {
        setMensaje({ texto: res.message || "Error al registrar la cuenta.", tipo: "error" });
      }
    } catch (err: any) {
      setMensaje({ texto: err.message || "Ocurrió un error al conectar con el servidor.", tipo: "error" });
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
        className="fz-floating-auth-card fz-floating-reg-wide"
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

        {/* Cabecera de la Tarjeta */}
        <div className="fz-floating-card-header">
          <div className="fz-brand-avatar-box">
            <Icons.User size={28} color="#ffffff" />
          </div>
          <span className="fz-brand-pill-tag">✨ Registro de Cliente</span>
          <h2>Crear Cuenta</h2>
          <p>Diligencia tus datos para registrarte en FutbolZone</p>
        </div>

        <div className="fz-floating-card-body">
          <form onSubmit={manejarEnvio} className="fz-pro-form">
            {/* Fila 1: Nombre y Apellido */}
            <div className="fz-pro-row-2">
              <div className="fz-pro-field">
                <label htmlFor="reg-nombre">Nombre *</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.User size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan"
                    required
                  />
                </div>
              </div>

              <div className="fz-pro-field">
                <label htmlFor="reg-apellido">Apellido *</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.User size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Correo y Teléfono */}
            <div className="fz-pro-row-2">
              <div className="fz-pro-field">
                <label htmlFor="reg-correo">Correo Electrónico *</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.Mail size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tunombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="fz-pro-field">
                <label htmlFor="reg-telefono">Teléfono / WhatsApp</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.Phone size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3001234567"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Fila 3: Contraseña y Confirmar */}
            <div className="fz-pro-row-2">
              <div className="fz-pro-field">
                <label htmlFor="reg-pass">Contraseña *</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.Lock size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-pass"
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="fz-btn-eye"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    title={mostrarPassword ? "Ocultar" : "Ver"}
                  >
                    {mostrarPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="fz-pro-field">
                <label htmlFor="reg-conf-pass">Confirmar Contraseña *</label>
                <div className="fz-input-icon-wrapper">
                  <span className="fz-field-icon">
                    <Icons.Lock size={18} color="#64748b" />
                  </span>
                  <input
                    id="reg-conf-pass"
                    type={mostrarConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="fz-btn-eye"
                    onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                    title={mostrarConfirmPassword ? "Ocultar" : "Ver"}
                  >
                    {mostrarConfirmPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Barra de Fortaleza Visual */}
            {password && (
              <div className="fz-pro-strength-box">
                <div className="fz-pro-strength-track">
                  <div
                    className="fz-pro-strength-bar"
                    style={{
                      width: `${fortaleza.porcentaje}%`,
                      backgroundColor: fortaleza.color,
                    }}
                  ></div>
                </div>
                <div className="fz-pro-strength-label-row">
                  <span>Fortaleza de clave: <strong style={{ color: fortaleza.color }}>{fortaleza.label}</strong></span>
                  {confirmPassword && (
                    <span style={{ color: coincidenClaves ? "#10b981" : "#ef4444" }}>
                      {coincidenClaves ? "✓ Coinciden" : "✕ No coinciden"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Requisitos de Seguridad */}
            <div className="fz-security-checklist">
              <span className={`fz-check-item ${tieneLongitud ? "valid" : ""}`}>
                {tieneLongitud ? "✓" : "○"} 8+ caracteres
              </span>
              <span className={`fz-check-item ${tieneNumero ? "valid" : ""}`}>
                {tieneNumero ? "✓" : "○"} Número
              </span>
              <span className={`fz-check-item ${tieneMayuscula ? "valid" : ""}`}>
                {tieneMayuscula ? "✓" : "○"} Mayúscula
              </span>
              <span className={`fz-check-item ${tieneEspecial ? "valid" : ""}`}>
                {tieneEspecial ? "✓" : "○"} Símbolo (@, #, $)
              </span>
            </div>

            {/* 📋 AUTORIZACIÓN DE TRATAMIENTO DE DATOS (HABEAS DATA - LEY 1581) */}
            <div className="fz-terms-checkbox-box">
              <label className="fz-terms-checkbox-label">
                <input
                  type="checkbox"
                  checked={aceptaTratamientoDatos}
                  onChange={(e) => setAceptaTratamientoDatos(e.target.checked)}
                  required
                />
                <span className="fz-terms-text">
                  Autorizo expresamente el{" "}
                  <button
                    type="button"
                    className="fz-link-terms-modal"
                    onClick={() => setMostrarModalHabeasData(true)}
                  >
                    Tratamiento de Datos Personales (Ley 1581 de 2012)
                  </button>{" "}
                  y acepto la Política de Privacidad de FutbolZone. *
                </span>
              </label>
            </div>

            {mensaje && (
              <div className={`fz-pro-alert ${mensaje.tipo}`} role="alert">
                <span className="fz-alert-icon">
                  {mensaje.tipo === "exito" ? <Icons.Check size={16} /> : "⚠️"}
                </span>
                <span>{mensaje.texto}</span>
              </div>
            )}

            <button
              type="submit"
              className="fz-btn-submit-gradient"
              disabled={cargando || !aceptaTratamientoDatos}
            >
              {cargando ? (
                <span className="fz-spinner-row">
                  <span className="fz-spinner"></span>
                  <span>Creando tu cuenta...</span>
                </span>
              ) : (
                <span>Crear mi Cuenta Gratis ➔</span>
              )}
            </button>
          </form>

          {onSwitchToLogin && (
            <div className="fz-pro-card-footer">
              <p>
                ¿Ya tienes una cuenta registrada?{" "}
                <button type="button" className="fz-link-action" onClick={onSwitchToLogin}>
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          )}

          <div className="fz-security-badge-footer">
            <Icons.Shield size={14} color="#10b981" />
            <span>Registro protegido por cifrado SSL · Habeas Data Ley 1581 de 2012</span>
          </div>
        </div>
      </div>

      {/* 📄 MODAL INTERACTIVO: POLÍTICA DE TRATAMIENTO DE DATOS (HABEAS DATA) */}
      {mostrarModalHabeasData && (
        <div className="fz-modal-backdrop-terms" onClick={() => setMostrarModalHabeasData(false)}>
          <div className="fz-modal-content-terms" onClick={(e) => e.stopPropagation()}>
            <div className="fz-modal-terms-header">
              <div className="fz-modal-terms-icon">
                <Icons.Shield size={24} color="#10b981" />
              </div>
              <div>
                <h3>Autorización de Tratamiento de Datos Personales</h3>
                <p>Conforme a la Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 (Colombia)</p>
              </div>
              <button
                type="button"
                className="fz-modal-btn-close"
                onClick={() => setMostrarModalHabeasData(false)}
              >
                ✕
              </button>
            </div>

            <div className="fz-modal-terms-body">
              <h4>1. Responsable del Tratamiento</h4>
              <p>
                <strong>FutbolZone S.A.S. / Proyecto Formativo SENA ADSO</strong>, en calidad de Responsable del Tratamiento de Datos Personales, garantiza la confidencialidad, seguridad y custodia de la información recolectada de los usuarios registrados.
              </p>

              <h4>2. Finalidades de la Recolección</h4>
              <p>Los datos suministrados (Nombre, Correo electrónico, Teléfono celular y Registros de reserva) serán utilizados exclusivamente para:</p>
              <ul>
                <li>Gestionar el agendamiento y disponibilidad de canchas sintéticas en tiempo real.</li>
                <li>Enviar comprobantes de reserva, alertas de confirmación y pines de seguridad vía correo electrónico (Gmail SMTP).</li>
                <li>Coordinar inscripciones a torneos deportivos y eventos del complejo.</li>
                <li>Generar reportes estadísticos agregados y auditoría de seguridad del sistema.</li>
              </ul>

              <h4>3. Derechos del Titular (Habeas Data)</h4>
              <p>
                Como titular de los datos personales, tienes derecho a <strong>conocer, actualizar, rectificar y solicitar la supresión</strong> de tu información en cualquier momento a través de tu panel de usuario o comunicándote con los administradores de la sede.
              </p>

              <h4>4. Seguridad y No Cesión a Terceros</h4>
              <p>
                FutbolZone no vende, cede ni comercializa tus datos con terceros bajo ninguna circunstancia. Todas las contraseñas se almacenan cifradas con algoritmos de hashing seguro (Bcrypt).
              </p>
            </div>

            <div className="fz-modal-terms-footer">
              <button
                type="button"
                className="fz-btn-accept-terms"
                onClick={() => {
                  setAceptaTratamientoDatos(true);
                  setMostrarModalHabeasData(false);
                }}
              >
                Entendido y Acepto los Términos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registro;