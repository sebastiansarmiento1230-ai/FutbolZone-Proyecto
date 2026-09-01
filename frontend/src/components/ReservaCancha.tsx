import { useState, useEffect } from "react";
import "./ReservaCancha.css";
import { api, getStoredUser } from "../services/api";
import { notificarAdmin, notificarCliente } from "../services/notifications";

interface ReservaCanchaProps {
  cancha: any;
  onGoBack: () => void;
  onReservationCreated: () => void;
  onRequireLogin: () => void;
}

function ReservaCancha({ cancha, onGoBack, onReservationCreated, onRequireLogin }: ReservaCanchaProps) {
  const capInicial = cancha?.capacidad_jugadores || cancha?.capacidad || 10;
  const precioHora = Number(cancha?.precio_hora || 50000);

  const [usuario, setUsuario] = useState<any | null>(null);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);
  const [numJugadores, setNumJugadores] = useState<number>(capInicial);
  const [duracionHoras, setDuracionHoras] = useState<number>(1);
  const [incluyeBalonPetos, setIncluyeBalonPetos] = useState<boolean>(false);
  const [incluyeArbitro, setIncluyeArbitro] = useState<boolean>(false);
  const [metodoPago, setMetodoPago] = useState<"nequi" | "daviplata" | "tarjeta" | "efectivo">("nequi");
  const [referenciaPago, setReferenciaPago] = useState<string>("");

  // Cupones de descuento
  const [cuponInput, setCuponInput] = useState<string>("");
  const [descuentoPct, setDescuentoPct] = useState<number>(0);
  const [cuponAplicado, setCuponAplicado] = useState<string | null>(null);
  const [mensajeCupon, setMensajeCupon] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  // Bloques de horario
  const [filtroJornada, setFiltroJornada] = useState<"todas" | "manana" | "tarde" | "noche">("todas");
  const [disponibilidad, setDisponibilidad] = useState<{ disponibles: any[]; ocupados: any[] }>({
    disponibles: [],
    ocupados: [],
  });
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<any | null>(null);
  const [aceptaCondicionesCancha, setAceptaCondicionesCancha] = useState<boolean>(false);
  const [mostrarModalReglamento, setMostrarModalReglamento] = useState<boolean>(false);
  const [cargandoDisp, setCargandoDisp] = useState<boolean>(false);
  const [reservando, setReservando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUsuario(u);
    const cId = cancha?.id || 1;
    cargarDisponibilidad(cId, fecha);
  }, [cancha, fecha]);

  const cargarDisponibilidad = async (canchaId: number, fechaSeleccionada: string) => {
    setCargandoDisp(true);
    try {
      const res = await api.obtenerDisponibilidad(canchaId, fechaSeleccionada);
      if (res.success && res.data && Array.isArray(res.data.disponibles) && res.data.disponibles.length > 0) {
        setDisponibilidad({
          disponibles: res.data.disponibles,
          ocupados: res.data.ocupados || [],
        });
      } else {
        const defaultDisp = Array.from({ length: 16 }, (_, i) => {
          const h1 = (i + 6).toString().padStart(2, "0") + ":00:00";
          const h2 = (i + 7).toString().padStart(2, "0") + ":00:00";
          return { inicio: h1, fin: h2 };
        });
        setDisponibilidad({ disponibles: defaultDisp, ocupados: [] });
      }
    } catch {
      const defaultDisp = Array.from({ length: 16 }, (_, i) => {
        const h1 = (i + 6).toString().padStart(2, "0") + ":00:00";
        const h2 = (i + 7).toString().padStart(2, "0") + ":00:00";
        return { inicio: h1, fin: h2 };
      });
      setDisponibilidad({ disponibles: defaultDisp, ocupados: [] });
    } finally {
      setCargandoDisp(false);
    }
  };

  const aplicarCupon = (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = cuponInput.trim().toUpperCase();
    if (codigo === "SENA20" || codigo === "SENA") {
      setDescuentoPct(20);
      setCuponAplicado("SENA20 (20% OFF)");
      setMensajeCupon({ texto: "¡Cupón aplicado! 20% de descuento concedido.", tipo: "exito" });
    } else if (codigo === "FUTBOL10" || codigo === "PROMO10") {
      setDescuentoPct(10);
      setCuponAplicado("FUTBOL10 (10% OFF)");
      setMensajeCupon({ texto: "¡Cupón aplicado! 10% de descuento concedido.", tipo: "exito" });
    } else {
      setDescuentoPct(0);
      setCuponAplicado(null);
      setMensajeCupon({ texto: "Cupón inválido. Prueba con 'SENA20' o 'FUTBOL10'.", tipo: "error" });
    }
  };

  // Cálculo del total
  const costoBase = precioHora * duracionHoras;
  const costoBalonPetos = incluyeBalonPetos ? 15000 : 0;
  const costoArbitro = incluyeArbitro ? 30000 : 0;
  const subtotal = costoBase + costoBalonPetos + costoArbitro;
  const montoDescuento = Math.round((subtotal * descuentoPct) / 100);
  const totalPagar = subtotal - montoDescuento;

  const confirmarReserva = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para completar tu reserva.");
      onRequireLogin();
      return;
    }

    if (!bloqueSeleccionado) {
      setMensaje({ texto: "Por favor selecciona un horario para tu partido.", tipo: "error" });
      return;
    }

    if (!aceptaCondicionesCancha) {
      setMensaje({
        texto: "Debes aceptar el reglamento y las condiciones de uso de la cancha para continuar.",
        tipo: "error",
      });
      return;
    }

    // Calcular hora de fin según la duración
    const hInicioNum = parseInt(bloqueSeleccionado.inicio.split(":")[0], 10);
    const hFinCalculada = (hInicioNum + duracionHoras).toString().padStart(2, "0") + ":00:00";

    setReservando(true);
    setMensaje(null);

    try {
      const res = await api.crearReserva({
        cancha_id: cancha.id,
        fecha: fecha,
        hora_inicio: bloqueSeleccionado.inicio,
        hora_fin: hFinCalculada,
        precio_total: totalPagar,
        incluye_kit: incluyeBalonPetos,
        incluye_arbitro: incluyeArbitro,
        descuento: montoDescuento,
        notas: `Pago: ${metodoPago.toUpperCase()} ${referenciaPago ? `(Ref: ${referenciaPago})` : ''} | Jugadores: ${numJugadores} | Kit: ${incluyeBalonPetos ? 'Sí (+$15.000)' : 'No'} | Árbitro: ${incluyeArbitro ? 'Sí (+$30.000)' : 'No'} | Cupón: ${cuponAplicado || 'Ninguno'}`
      });

      if (res.success) {
        // Notificar en el buzón del cliente
        notificarCliente(usuario?.id, {
          titulo: "Reserva Creada Exitosamente",
          mensaje: `Has agendado ${cancha?.nombre || "Cancha Central"} para el ${fecha} (${bloqueSeleccionado.inicio.substring(0, 5)} - ${hFinCalculada.substring(0, 5)}). Total a pagar: $${totalPagar.toLocaleString("es-CO")} COP.`,
          tipo: "reserva",
          accionVista: "client_dashboard",
        });

        // Notificar en el buzón del administrador
        notificarAdmin({
          titulo: "Nueva Reserva Registrada",
          mensaje: `${usuario?.nombre || "Cliente"} ha reservado ${cancha?.nombre || "Cancha Central"} para el ${fecha} (${bloqueSeleccionado.inicio.substring(0, 5)}). Liquidación: $${totalPagar.toLocaleString("es-CO")} COP.`,
          tipo: "reserva",
          accionVista: "admin_dashboard",
        });

        setMensaje({
          texto: "¡Reserva realizada con éxito! Redirigiendo a tu panel...",
          tipo: "exito",
        });
        setTimeout(() => {
          onReservationCreated();
        }, 1200);
      } else {
        setMensaje({ texto: res.message || "No se pudo crear la reserva.", tipo: "error" });
      }
    } catch (err: any) {
      setMensaje({ texto: err.message || "Error al procesar la reserva.", tipo: "error" });
    } finally {
      setReservando(false);
    }
  };

  // Filtrado de bloques
  const bloquesFiltrados = disponibilidad.disponibles.filter((bloque) => {
    const hora = parseInt(bloque.inicio.split(":")[0], 10);
    if (filtroJornada === "manana") return hora >= 6 && hora < 12;
    if (filtroJornada === "tarde") return hora >= 12 && hora < 18;
    if (filtroJornada === "noche") return hora >= 18 && hora <= 23;
    return true;
  });

  return (
    <section className="fz-reserva-layout">
      <div className="fz-reserva-container">
        {/* Cabecera Curva con Detalles de la Cancha */}
        <div className="fz-reserva-header-card">
          <button type="button" className="fz-btn-back-clean" onClick={onGoBack}>
            ← Volver a Canchas
          </button>

          <div className="fz-reserva-title-box">
            <span className="fz-badge-cancha-tag">{cancha?.tipo || "Fútbol Sintético"}</span>
            <h2>{cancha?.nombre || "Cancha Central"}</h2>
            <p>{cancha?.descripcion || "Cancha sintética profesional con iluminación LED y vestuarios."}</p>
          </div>

          <div className="fz-reserva-header-stats">
            <div className="fz-hstat">
              <span>Tarifa Base</span>
              <strong>${precioHora.toLocaleString("es-CO")} / h</strong>
            </div>
            <div className="fz-hstat">
              <span>Capacidad Recomendada</span>
              <strong>{capInicial} Jugadores</strong>
            </div>
            <div className="fz-hstat">
              <span>Ubicación de la Sede</span>
              <strong style={{ fontSize: "13px" }}>{cancha?.direccion || (cancha?.nombre?.includes("Norte") ? "Cra. 15 # 104-20, Sede Norte" : cancha?.nombre?.includes("Sur") ? "Av. Boyacá # 45-12 Sur, Sede Sur" : "Calle 63 # 28-45, Sede Central")}</strong>
            </div>
            <div className="fz-hstat">
              <span>Iluminación</span>
              <strong>Estadio LED Nocturna</strong>
            </div>
          </div>
        </div>

        {/* Grid de Configuración de Reserva */}
        <div className="fz-reserva-body-grid">
          {/* Columna Izquierda: Opciones y Horarios */}
          <div className="fz-reserva-left-col">
            {/* Paso 1: Selección de Fecha */}
            <div className="fz-booking-card">
              <div className="fz-step-header">
                <span className="fz-step-num">1</span>
                <div>
                  <h3>Selecciona la Fecha del Partido</h3>
                  <p>Escoge el día en que deseas jugar</p>
                </div>
              </div>

              <div className="fz-date-input-wrap">
                <input
                  type="date"
                  value={fecha}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFecha(e.target.value)}
                  className="fz-input-date"
                />
              </div>
            </div>

            {/* Paso 2: Selección de Horario */}
            <div className="fz-booking-card">
              <div className="fz-step-header">
                <span className="fz-step-num">2</span>
                <div>
                  <h3>Selecciona el Horario de Inicio</h3>
                  <p>Turnos disponibles para el {fecha}</p>
                </div>
              </div>

              {/* Filtro de Jornada */}
              <div className="fz-jornada-pills">
                <button
                  type="button"
                  className={`fz-jornada-pill ${filtroJornada === "todas" ? "active" : ""}`}
                  onClick={() => setFiltroJornada("todas")}
                >
                  Todos ({disponibilidad.disponibles.length})
                </button>
                <button
                  type="button"
                  className={`fz-jornada-pill ${filtroJornada === "manana" ? "active" : ""}`}
                  onClick={() => setFiltroJornada("manana")}
                >
                  ☀️ Mañana (6am - 12pm)
                </button>
                <button
                  type="button"
                  className={`fz-jornada-pill ${filtroJornada === "tarde" ? "active" : ""}`}
                  onClick={() => setFiltroJornada("tarde")}
                >
                  🌤️ Tarde (12pm - 6pm)
                </button>
                <button
                  type="button"
                  className={`fz-jornada-pill ${filtroJornada === "noche" ? "active" : ""}`}
                  onClick={() => setFiltroJornada("noche")}
                >
                  🌙 Noche (6pm - 11pm)
                </button>
              </div>

              {cargandoDisp ? (
                <div className="fz-loading-slots">🔄 Consultando turnos en tiempo real...</div>
              ) : bloquesFiltrados.length === 0 ? (
                <div className="fz-no-slots">No hay turnos disponibles en esta jornada. Prueba con otro día.</div>
              ) : (
                <div className="fz-slots-grid">
                  {bloquesFiltrados.map((bloque, idx) => {
                    const isSelected = bloqueSeleccionado?.inicio === bloque.inicio;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`fz-slot-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => setBloqueSeleccionado(bloque)}
                      >
                        <span className="fz-slot-time">{bloque.inicio.substring(0, 5)}</span>
                        <span className="fz-slot-label">{isSelected ? "✓ Seleccionado" : "Disponible"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paso 3: Duración y Jugadores */}
            <div className="fz-booking-card">
              <div className="fz-step-header">
                <span className="fz-step-num">3</span>
                <div>
                  <h3>Duración y Jugadores</h3>
                  <p>Personaliza el tiempo y cantidad de deportistas</p>
                </div>
              </div>

              <div className="fz-custom-row">
                <div className="fz-custom-item">
                  <label>Duración del Encuentro:</label>
                  <div className="fz-duration-selector">
                    {[1, 2, 3].map((h) => (
                      <button
                        key={h}
                        type="button"
                        className={`fz-duration-btn ${duracionHoras === h ? "active" : ""}`}
                        onClick={() => setDuracionHoras(h)}
                      >
                        {h} {h === 1 ? "Hora" : "Horas"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fz-custom-item">
                  <label>Número de Jugadores:</label>
                  <div className="fz-players-control">
                    <button
                      type="button"
                      className="fz-counter-btn"
                      onClick={() => setNumJugadores(Math.max(4, numJugadores - 1))}
                    >
                      -
                    </button>
                    <span className="fz-players-val">{numJugadores} jugadores</span>
                    <button
                      type="button"
                      className="fz-counter-btn"
                      onClick={() => setNumJugadores(Math.min(22, numJugadores + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 4: Servicios Adicionales */}
            <div className="fz-booking-card">
              <div className="fz-step-header">
                <span className="fz-step-num">4</span>
                <div>
                  <h3>Kits & Servicios Opcionales</h3>
                  <p>Equipamiento complementario para tu partido</p>
                </div>
              </div>

              <div className="fz-addons-list">
                <label className={`fz-addon-card ${incluyeBalonPetos ? "checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={incluyeBalonPetos}
                    onChange={(e) => setIncluyeBalonPetos(e.target.checked)}
                  />
                  <div className="fz-addon-info">
                    <strong>⚽ Kit de Balón Profesional + 10 Petos / Chalecos</strong>
                    <p>Balón de alta resistencia con 2 colores de petos diferenciados.</p>
                  </div>
                  <span className="fz-addon-price">+$15.000 COP</span>
                </label>

                <label className={`fz-addon-card ${incluyeArbitro ? "checked" : ""}`} style={{ marginTop: "10px" }}>
                  <input
                    type="checkbox"
                    checked={incluyeArbitro}
                    onChange={(e) => setIncluyeArbitro(e.target.checked)}
                  />
                  <div className="fz-addon-info">
                    <strong>🏁 Árbitro Federado Oficial</strong>
                    <p>Juez certificado con silbato, cronómetro y tarjetas para torneos o retos.</p>
                  </div>
                  <span className="fz-addon-price">+$30.000 COP</span>
                </label>
              </div>
            </div>

            {/* Paso 5: Forma de Pago */}
            <div className="fz-booking-card">
              <div className="fz-step-header">
                <span className="fz-step-num">5</span>
                <div>
                  <h3>Selecciona la Forma de Pago</h3>
                  <p>Elige tu método de pago preferido para confirmar</p>
                </div>
              </div>

              <div className="fz-payment-methods-grid">
                <label className={`fz-pay-method-card ${metodoPago === "nequi" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="nequi"
                    checked={metodoPago === "nequi"}
                    onChange={() => setMetodoPago("nequi")}
                  />
                  <div className="fz-pay-method-content">
                    <span className="fz-pay-icon">📱</span>
                    <strong>Nequi</strong>
                    <span className="fz-pay-hint">Transferencia inmediata</span>
                  </div>
                </label>

                <label className={`fz-pay-method-card ${metodoPago === "daviplata" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="daviplata"
                    checked={metodoPago === "daviplata"}
                    onChange={() => setMetodoPago("daviplata")}
                  />
                  <div className="fz-pay-method-content">
                    <span className="fz-pay-icon">📲</span>
                    <strong>Daviplata</strong>
                    <span className="fz-pay-hint">Transferencia rápida</span>
                  </div>
                </label>

                <label className={`fz-pay-method-card ${metodoPago === "tarjeta" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="tarjeta"
                    checked={metodoPago === "tarjeta"}
                    onChange={() => setMetodoPago("tarjeta")}
                  />
                  <div className="fz-pay-method-content">
                    <span className="fz-pay-icon">💳</span>
                    <strong>Tarjeta Débito/Crédito</strong>
                    <span className="fz-pay-hint">Pago seguro online</span>
                  </div>
                </label>

                <label className={`fz-pay-method-card ${metodoPago === "efectivo" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value="efectivo"
                    checked={metodoPago === "efectivo"}
                    onChange={() => setMetodoPago("efectivo")}
                  />
                  <div className="fz-pay-method-content">
                    <span className="fz-pay-icon">💵</span>
                    <strong>Pago en Recepción</strong>
                    <span className="fz-pay-hint">Paga en taquilla antes de jugar</span>
                  </div>
                </label>
              </div>

              {(metodoPago === "nequi" || metodoPago === "daviplata") && (
                <div className="fz-pay-transfer-box">
                  <div className="fz-pay-account-info">
                    <strong>Número para transferir:</strong> {metodoPago === "nequi" ? "📱 300 123 4567 (FutbolZone)" : "📲 310 987 6543 (FutbolZone S.A.S)"}
                  </div>
                  <input
                    type="text"
                    className="fz-input-ref"
                    placeholder="Número de comprobante o referencia (Opcional)"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Reserva y Liquidación */}
          <div className="fz-reserva-right-col">
            <div className="fz-receipt-card">
              <h3 className="fz-receipt-title">📋 Resumen de tu Reserva</h3>
              <p className="fz-receipt-sub">Liquidación detallada del encuentro</p>

              <div className="fz-receipt-lines">
                <div className="fz-rline">
                  <span>Cancha:</span>
                  <strong>{cancha?.nombre || "Cancha Central"}</strong>
                </div>
                <div className="fz-rline">
                  <span>Sede:</span>
                  <strong style={{ fontSize: "11.5px", color: "#334155", textAlign: "right" }}>
                    📍 {cancha?.direccion || (cancha?.nombre?.includes("Norte") ? "Cra. 15 # 104-20 (Sede Norte)" : cancha?.nombre?.includes("Sur") ? "Av. Boyacá # 45-12 Sur (Sede Sur)" : "Calle 63 # 28-45 (Sede Central)")}
                  </strong>
                </div>
                <div className="fz-rline">
                  <span>Fecha:</span>
                  <strong>{fecha}</strong>
                </div>
                <div className="fz-rline">
                  <span>Horario:</span>
                  <strong>
                    {bloqueSeleccionado ? `${bloqueSeleccionado.inicio.substring(0, 5)} (${duracionHoras}h)` : "Por seleccionar"}
                  </strong>
                </div>
                <div className="fz-rline">
                  <span>Método de Pago:</span>
                  <strong style={{ textTransform: "capitalize", color: "#059669" }}>
                    {metodoPago === "nequi" && "📱 Nequi"}
                    {metodoPago === "daviplata" && "📲 Daviplata"}
                    {metodoPago === "tarjeta" && "💳 Tarjeta Débito/Crédito"}
                    {metodoPago === "efectivo" && "💵 Efectivo en Taquilla"}
                  </strong>
                </div>
                <div className="fz-rline">
                  <span>Jugadores:</span>
                  <strong>{numJugadores} participantes</strong>
                </div>

                <div className="fz-rdivider"></div>

                <div className="fz-rline">
                  <span>Tarifa Cancha ({duracionHoras}h):</span>
                  <span>${costoBase.toLocaleString("es-CO")}</span>
                </div>

                {incluyeBalonPetos && (
                  <div className="fz-rline">
                    <span>Kit Balón + Petos:</span>
                    <span>+$15.000</span>
                  </div>
                )}

                {incluyeArbitro && (
                  <div className="fz-rline">
                    <span>Árbitro Oficial:</span>
                    <span>+$30.000</span>
                  </div>
                )}

                {descuentoPct > 0 && (
                  <div className="fz-rline fz-discount-line">
                    <span>Descuento ({cuponAplicado}):</span>
                    <span>-${montoDescuento.toLocaleString("es-CO")}</span>
                  </div>
                )}

                <div className="fz-rdivider"></div>

                <div className="fz-rtotal-box">
                  <span>Total a Pagar:</span>
                  <div className="fz-rtotal-val">${totalPagar.toLocaleString("es-CO")} COP</div>
                </div>
              </div>

              {/* Formulario de Cupón */}
              <form onSubmit={aplicarCupon} className="fz-coupon-form">
                <div className="fz-coupon-input-group">
                  <input
                    type="text"
                    placeholder="Código de cupón (ej: SENA20)"
                    value={cuponInput}
                    onChange={(e) => setCuponInput(e.target.value)}
                  />
                  <button type="submit" className="fz-btn-apply-coupon">Aplicar</button>
                </div>
                {mensajeCupon && (
                  <div className={`fz-coupon-msg ${mensajeCupon.tipo}`}>
                    {mensajeCupon.texto}
                  </div>
                )}
              </form>

              {/* Checkbox de Condiciones de Uso de la Cancha */}
              <div className="fz-booking-terms-box">
                <label className="fz-booking-terms-label">
                  <input
                    type="checkbox"
                    checked={aceptaCondicionesCancha}
                    onChange={(e) => setAceptaCondicionesCancha(e.target.checked)}
                  />
                  <span>
                    Acepto el{" "}
                    <button
                      type="button"
                      className="fz-link-terms-button"
                      onClick={() => setMostrarModalReglamento(true)}
                    >
                      Reglamento Oficial y Condiciones de Uso
                    </button>{" "}
                    de la cancha sintética. *
                  </span>
                </label>
              </div>

              {mensaje && (
                <div className={`fz-booking-alert ${mensaje.tipo}`}>
                  {mensaje.tipo === "exito" ? "✅" : "⚠️"} {mensaje.texto}
                </div>
              )}

              <button
                type="button"
                className="fz-btn-confirm-booking"
                disabled={reservando || !bloqueSeleccionado || !aceptaCondicionesCancha}
                onClick={confirmarReserva}
              >
                {reservando ? "Confirmando Turno..." : "⚽ Confirmar y Reservar Ahora"}
              </button>

              <p className="fz-booking-note">
                🔒 Cancelación flexible hasta 2 horas antes de tu partido desde tu panel de usuario.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 MODAL DE REGLAMENTO Y CONDICIONES DE USO DE LA CANCHA */}
      {mostrarModalReglamento && (
        <div className="fz-modal-backdrop-terms" onClick={() => setMostrarModalReglamento(false)}>
          <div className="fz-modal-content-terms" onClick={(e) => e.stopPropagation()}>
            <div className="fz-modal-terms-header">
              <div className="fz-modal-terms-icon" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "#10b981" }}>
                ⚽
              </div>
              <div>
                <h3>Reglamento Oficial y Condiciones de Uso</h3>
                <p>Complejo Deportivo FutbolZone — Normas de Convivencia y Seguridad</p>
              </div>
              <button
                type="button"
                className="fz-modal-btn-close"
                onClick={() => setMostrarModalReglamento(false)}
              >
                ✕
              </button>
            </div>

            <div className="fz-modal-terms-body">
              <h4>👟 1. Calzado Adecuado Obligatorio</h4>
              <p>
                Para proteger el césped sintético y evitar lesiones, solo se permite el uso de <strong>calzado de torretas (TF)</strong> o <strong>suela de goma plana (IC)</strong>. Está estrictamente prohibido el uso de guayos con taches metálicos o de aluminio.
              </p>

              <h4>⏰ 2. Puntualidad en el Horario Agendado</h4>
              <p>
                El turno de juego comienza y finaliza puntualmente en los horarios registrados. Se recomienda llegar con <strong>15 minutos de anticipación</strong> para alistamiento en vestuarios.
              </p>

              <h4>🚫 3. Prohibiciones en el Campo de Juego</h4>
              <ul>
                <li>Prohibido ingresar con bebidas alcohólicas, chicles, alimentos o envases de vidrio al césped.</li>
                <li>Prohibido fumar o portar sustancias psicoactivas dentro de las instalaciones.</li>
                <li>Cero tolerancia a actos de violencia verbal o física. El equipo causante será sancionado y expulsado.</li>
              </ul>

              <h4>🔄 4. Política de Cancelación y Reembolsos</h4>
              <p>
                Puedes cancelar o reprogramar tu reserva sin costo alguno hasta con <strong>2 horas de anticipación</strong> desde tu panel de <em>Mis Reservas</em>.
              </p>

              <h4>🛡️ 5. Cuidado de Instalaciones e Implementos</h4>
              <p>
                Los usuarios son responsables del cuidado de los balones, petos y graderías suministradas durante el encuentro.
              </p>
            </div>

            <div className="fz-modal-terms-footer">
              <button
                type="button"
                className="fz-btn-accept-terms"
                onClick={() => {
                  setAceptaCondicionesCancha(true);
                  setMostrarModalReglamento(false);
                }}
              >
                Aceptar Condiciones y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ReservaCancha;
