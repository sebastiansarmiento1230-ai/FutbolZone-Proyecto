import { useState, useEffect, useRef } from "react";
import "./RecuperarPasswordModal.css";
import { api } from "../services/api";
import Icons from "./Icons";

interface RecuperarPasswordModalProps {
  emailInicial?: string;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

type PasoRecuperacion = "solicitar" | "verificar" | "exito";

function RecuperarPasswordModal({ emailInicial = "", onClose, onSuccessLogin }: RecuperarPasswordModalProps) {
  const [paso, setPaso] = useState<PasoRecuperacion>("solicitar");
  const [email, setEmail] = useState<string>(emailInicial);
  
  // PIN de 6 dígitos
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Nueva Contraseña
  const [nuevaPassword, setNuevaPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  // Estados de interfaz
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  
  // Temporizador de 15 minutos (900 segundos)
  const [segundosRestantes, setSegundosRestantes] = useState<number>(900);

  useEffect(() => {
    let timer: any;
    if (paso === "verificar" && segundosRestantes > 0) {
      timer = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paso, segundosRestantes]);

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Manejo de inputs del PIN
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...pinDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setPinDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const cleanChar = value.replace(/\D/g, "");
    const newDigits = [...pinDigits];
    newDigits[index] = cleanChar;
    setPinDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const [pinDemo, setPinDemo] = useState<string | null>(null);
  const [correoEnviadoReal, setCorreoEnviadoReal] = useState<boolean>(false);

  // Paso 1: Solicitar PIN al correo
  const handleSolicitarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setMensajeError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);
    setMensajeError(null);

    try {
      const res = await api.solicitarPinRecuperacion(email.trim());
      if (res.success) {
        setPaso("verificar");
        setSegundosRestantes(900);
        if (res.data?.pin_demo) {
          setPinDemo(res.data.pin_demo);
        }
        setCorreoEnviadoReal(Boolean(res.data?.correo_enviado_real));
      } else {
        setMensajeError(res.message || "Error al solicitar el código PIN.");
      }
    } catch (err: any) {
      setMensajeError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Validar PIN y Cambiar Contraseña
  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinCompleto = pinDigits.join("");

    if (pinCompleto.length !== 6) {
      setMensajeError("Por favor ingresa los 6 dígitos del código PIN recibido en tu correo.");
      return;
    }

    if (!nuevaPassword || nuevaPassword.length < 6) {
      setMensajeError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmPassword) {
      setMensajeError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setCargando(true);
    setMensajeError(null);

    try {
      const res = await api.cambiarPasswordConPin({
        email: email.trim(),
        pin: pinCompleto,
        nueva_password: nuevaPassword,
      });
      if (res.success) {
        setPaso("exito");
      } else {
        setMensajeError(res.message || "Error al actualizar la contraseña.");
      }
    } catch (err: any) {
      setMensajeError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Medidor de fortaleza de contraseña
  const calcularFortaleza = (pass: string) => {
    if (!pass) return { nivel: 0, texto: "", color: "#cbd5e1" };
    let score = 0;
    if (pass.length >= 6) score += 30;
    if (pass.length >= 8) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { nivel: 33, texto: "Nivel Débil", color: "#ef4444" };
    if (score < 75) return { nivel: 66, texto: "Nivel Medio", color: "#f59e0b" };
    return { nivel: 100, texto: "Nivel Seguro", color: "#10b981" };
  };

  const fortaleza = calcularFortaleza(nuevaPassword);

  return (
    <div className="fz-recovery-overlay">
      <div className="fz-recovery-card">
        {/* Botón Cerrar */}
        <button type="button" className="btn-close-recovery" onClick={onClose} title="Cerrar ventana">
          ✕
        </button>

        {/* ── PASO 1: SOLICITAR PIN ── */}
        {paso === "solicitar" && (
          <div>
            <div className="fz-recovery-header">
              <div className="fz-recovery-icon-circle">
                <Icons.Lock size={26} color="#059669" />
              </div>
              <h2>Recuperar Contraseña</h2>
              <p>
                Ingresa tu correo electrónico registrado y te enviaremos un <strong>código PIN de 6 dígitos</strong> para restablecer tu acceso.
              </p>
            </div>

            <form onSubmit={handleSolicitarPin} className="fz-recovery-form">
              <div className="fz-rec-field">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="ejemplo@futbolzone.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {mensajeError && (
                <div className="fz-rec-alert error">
                  {mensajeError}
                </div>
              )}

              <button type="submit" className="fz-btn-rec-primary" disabled={cargando}>
                {cargando ? "Enviando PIN..." : "Enviar Código PIN"}
              </button>

              <button type="button" className="fz-btn-rec-cancel" onClick={onClose}>
                Volver al Inicio de Sesión
              </button>
            </form>
          </div>
        )}

        {/* ── PASO 2: INGRESAR PIN & NUEVA CONTRASEÑA ── */}
        {paso === "verificar" && (
          <div>
            <div className="fz-recovery-header">
              <div className="fz-recovery-icon-circle">
                <Icons.Mail size={26} color="#059669" />
              </div>
              <h2>Código de Verificación</h2>
              <p>
                {correoEnviadoReal
                  ? `¡Correo enviado! Revisa la bandeja de entrada o spam de ${email}.`
                  : `Generamos tu código PIN de seguridad de 6 dígitos.`}
              </p>

              {pinDemo && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px dashed #10b981",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    margin: "12px 0 6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#6ee7b7", fontWeight: 700, textTransform: "uppercase" }}>
                    PIN de Seguridad Generado
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      letterSpacing: "6px",
                      color: "#34d399",
                      fontWeight: 900,
                      fontFamily: "monospace",
                      margin: "4px 0",
                    }}
                  >
                    {pinDemo}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    (Para recibirlo directamente en tu Gmail, ingresa tus credenciales en <code>backend/.env</code>)
                  </div>
                </div>
              )}
              
              <div className="fz-rec-timer-badge">
                Expira en: <strong>{formatearTiempo(segundosRestantes)}</strong>
              </div>
            </div>

            <form onSubmit={handleCambiarPassword} className="fz-recovery-form">
              {/* CASILLAS DE 6 DÍGITOS */}
              <div className="fz-pin-inputs-row">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="fz-pin-box-digit"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* NUEVA CONTRASEÑA */}
              <div className="fz-rec-field" style={{ marginTop: "16px" }}>
                <label>Nueva Contraseña *</label>
                <div className="fz-rec-pass-wrapper">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                {nuevaPassword && (
                  <div className="fz-strength-meter">
                    <div
                      className="fz-strength-bar"
                      style={{ width: `${fortaleza.nivel}%`, backgroundColor: fortaleza.color }}
                    ></div>
                    <span style={{ color: fortaleza.color, fontSize: "11px", fontWeight: 700 }}>
                      Fortaleza: {fortaleza.texto}
                    </span>
                  </div>
                )}
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div className="fz-rec-field">
                <label>Confirmar Nueva Contraseña *</label>
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {mensajeError && (
                <div className="fz-rec-alert error">
                  {mensajeError}
                </div>
              )}

              <button type="submit" className="fz-btn-rec-primary" disabled={cargando}>
                {cargando ? "Actualizando clave..." : "Actualizar Contraseña"}
              </button>

              <div className="fz-rec-footer-links">
                <button
                  type="button"
                  className="btn-resend-pin"
                  onClick={handleSolicitarPin}
                  disabled={cargando}
                >
                  ¿No recibiste el correo? <strong>Reenviar PIN</strong>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── PASO 3: ÉXITO ── */}
        {paso === "exito" && (
          <div className="fz-rec-success-screen">
            <div className="fz-success-checkmark-anim">
              <Icons.Check size={48} color="#10b981" />
            </div>
            <h2>Contraseña Restablecida</h2>
            <p>
              Tu contraseña para <strong>{email}</strong> ha sido actualizada exitosamente con cifrado de alta seguridad.
            </p>

            <button
              type="button"
              className="fz-btn-rec-primary"
              onClick={() => {
                onClose();
                if (onSuccessLogin) onSuccessLogin();
              }}
              style={{ marginTop: "20px" }}
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecuperarPasswordModal;
