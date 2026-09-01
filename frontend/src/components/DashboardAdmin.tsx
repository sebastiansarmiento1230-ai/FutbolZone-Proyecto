import { useState, useEffect } from "react";
import "./DashboardAdmin.css";
import * as XLSX from "xlsx";
import { api } from "../services/api";
import { notificarAdmin, notificarCliente, notificarTodosLosUsuarios } from "../services/notifications";

interface DashboardAdminProps {
  onLogout: () => void;
  onPublicarAnuncio?: (anuncio: { titulo: string; mensaje: string; activo: boolean }) => void;
}

function DashboardAdmin({ onLogout, onPublicarAnuncio }: DashboardAdminProps) {
  const [tabActiva, setTabActiva] = useState<"metricas" | "canchas" | "reservas" | "usuarios" | "empleados" | "anuncios">("metricas");
  const [canchas, setCanchas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  // Filtro de Reservas
  const [filtroEstadoReserva, setFiltroEstadoReserva] = useState<string>("todas");

  // Anuncio Global
  const [tituloAnuncio, setTituloAnuncio] = useState<string>("PROMO NOCTURNA 10% OFF");
  const [mensajeAnuncio, setMensajeAnuncio] = useState<string>("Aprovecha 10% de descuento en reservas nocturnas los jueves ingresando el cupón SENA20");
  const [anuncioActivo, setAnuncioActivo] = useState<boolean>(true);

  // Formulario de Nueva Cancha
  const [nuevaCancha, setNuevaCancha] = useState({
    nombre: "",
    tipo: "Fútbol 5",
    precio_hora: 50000,
    capacidad_jugadores: 10,
    direccion: "Calle 63 # 28-45, Sede Central (El Campín)",
    descripcion: "",
  });
  const [mostrarFormCancha, setMostrarFormCancha] = useState<boolean>(false);
  const [canchaParaEditar, setCanchaParaEditar] = useState<any | null>(null);

  // Formulario de Nuevo Empleado
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    apellido: "",
    cargo: "Coordinador de Sede",
    telefono: "",
    email: "",
  });
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState<boolean>(false);
  const [empleadoParaEditar, setEmpleadoParaEditar] = useState<any | null>(null);

  // Formulario de Nueva Reserva desde Admin
  const [mostrarFormReservaAdmin, setMostrarFormReservaAdmin] = useState<boolean>(false);
  const [nuevaReservaAdmin, setNuevaReservaAdmin] = useState({
    cancha_id: 1,
    fecha: new Date().toISOString().split("T")[0],
    hora_inicio: "18:00:00",
    hora_fin: "19:00:00",
    precio_total: 50000,
    metodo_pago: "Efectivo",
    notas: "Reserva registrada directamente por Administración",
  });

  // Modal para editar usuario
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<any | null>(null);

  // Período de Métricas
  const [periodoMetricas, setPeriodoMetricas] = useState<"semana" | "mes" | "ano">("mes");
  const [mesActual] = useState<string>("Agosto 2026");

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const mostrarAlerta = (texto: string, tipo: "exito" | "error" = "exito") => {
    setFeedbackMsg({ texto, tipo });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const [resCanchas, resReservas, resUsuarios, resEmpleados] = await Promise.all([
        api.obtenerCanchas(false),
        api.obtenerReservas(),
        api.obtenerClientes(),
        api.obtenerEmpleados ? api.obtenerEmpleados() : Promise.resolve({ success: true, data: [] }),
      ]);

      if (resCanchas.success) setCanchas(resCanchas.data || []);
      if (resReservas.success) setReservas(resReservas.data || []);
      if (resUsuarios.success) setUsuarios(resUsuarios.data || []);
      if (resEmpleados && resEmpleados.success) setEmpleados(resEmpleados.data || []);
    } catch (err) {
      console.warn("Error cargando datos de administración:", err);
    } finally {
      setCargando(false);
    }
  };

  /* ══════════════════════════════════════════
     CRUD 1: CANCHAS
     ══════════════════════════════════════════ */
  const manejarCrearCancha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.crearCancha(nuevaCancha);
      if (res.success) {
        mostrarAlerta(`¡Cancha "${nuevaCancha.nombre}" creada correctamente!`);
        setMostrarFormCancha(false);
        setNuevaCancha({
          nombre: "",
          tipo: "Fútbol 5",
          precio_hora: 50000,
          capacidad_jugadores: 10,
          direccion: "Calle 63 # 28-45, Sede Central (El Campín)",
          descripcion: "",
        });
        notificarAdmin({
          titulo: "Cancha Registrada",
          mensaje: `Se ha añadido la cancha ${nuevaCancha.nombre} (${nuevaCancha.tipo}) a la base de datos.`,
          tipo: "sistema",
        });
        window.dispatchEvent(new Event("fz_canchas_update"));
        cargarDatosAdmin();
      }
    } catch (err: any) {
      mostrarAlerta("Error al registrar cancha: " + err.message, "error");
    }
  };

  const manejarActualizarCancha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canchaParaEditar) return;
    try {
      const res = await api.actualizarCancha(canchaParaEditar.id, {
        nombre: canchaParaEditar.nombre,
        tipo: canchaParaEditar.tipo,
        precio_hora: Number(canchaParaEditar.precio_hora),
        capacidad_jugadores: Number(canchaParaEditar.capacidad_jugadores || canchaParaEditar.capacidad),
        direccion: canchaParaEditar.direccion,
        descripcion: canchaParaEditar.descripcion,
        activa: canchaParaEditar.activa !== false,
      });
      if (res.success) {
        mostrarAlerta(`Cancha "${canchaParaEditar.nombre}" actualizada con éxito.`);
        setCanchaParaEditar(null);
        window.dispatchEvent(new Event("fz_canchas_update"));
        cargarDatosAdmin();
      }
    } catch (err: any) {
      mostrarAlerta("Error actualizando cancha: " + err.message, "error");
    }
  };

  const toggleEstadoCancha = async (cancha: any) => {
    const nuevoEstado = !(cancha.activa !== false);
    try {
      await api.actualizarCancha(cancha.id, { activa: nuevoEstado });
      mostrarAlerta(`Estado de "${cancha.nombre}" cambiado a: ${nuevoEstado ? "Habilitada" : "En Mantenimiento"}`);
      window.dispatchEvent(new Event("fz_canchas_update"));
      cargarDatosAdmin();
    } catch (err: any) {
      mostrarAlerta("Error al modificar estado: " + err.message, "error");
    }
  };

  const eliminarCancha = async (id: number) => {
    if (!confirm("¿Confirma la desactivación / eliminación de esta cancha?")) return;
    try {
      await api.eliminarCancha(id);
      mostrarAlerta("Cancha eliminada / desactivada.");
      window.dispatchEvent(new Event("fz_canchas_update"));
      cargarDatosAdmin();
    } catch (err: any) {
      mostrarAlerta("Error: " + err.message, "error");
    }
  };

  /* ══════════════════════════════════════════
     CRUD 2: RESERVAS
     ══════════════════════════════════════════ */
  const manejarCrearReservaAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.crearReserva({
        cancha_id: Number(nuevaReservaAdmin.cancha_id),
        fecha: nuevaReservaAdmin.fecha,
        hora_inicio: nuevaReservaAdmin.hora_inicio,
        hora_fin: nuevaReservaAdmin.hora_fin,
        precio_total: Number(nuevaReservaAdmin.precio_total),
        notas: `Pago: ${nuevaReservaAdmin.metodo_pago.toUpperCase()} | ${nuevaReservaAdmin.notas}`,
      });
      if (res.success) {
        mostrarAlerta("¡Reserva agendada exitosamente desde Administración!");
        setMostrarFormReservaAdmin(false);
        notificarAdmin({
          titulo: "Reserva Creada por Admin",
          mensaje: `Se agendó turno en cancha ID #${nuevaReservaAdmin.cancha_id} para el ${nuevaReservaAdmin.fecha}.`,
          tipo: "reserva",
        });
        cargarDatosAdmin();
      }
    } catch (err: any) {
      mostrarAlerta("Error al agendar reserva: " + err.message, "error");
    }
  };

  const cambiarEstadoReserva = async (id: number, nuevoEstado: string) => {
    try {
      const res = await api.actualizarReserva(id, { estado: nuevoEstado });
      if (res.success) {
        const reservaModificada = reservas.find((r) => r.id === id);
        const nomCancha = reservaModificada?.cancha_nombre || "la cancha";
        const nomCliente = reservaModificada?.cliente || "Cliente";
        const fechaRes = reservaModificada?.fecha || "la fecha agendada";
        const usuarioId = reservaModificada?.usuario_id;

        if (nuevoEstado === "confirmada") {
          notificarCliente(usuarioId, {
            titulo: "Reserva Confirmada por la Sede",
            mensaje: `Tu reserva en ${nomCancha} para el ${fechaRes} ha sido CONFIRMADA. Te esperamos en la sede deportiva.`,
            tipo: "reserva",
            accionVista: "client_dashboard",
          });
          notificarAdmin({
            titulo: "Reserva Aprobada",
            mensaje: `Se ha confirmado exitosamente la reserva #${id} (${nomCliente}).`,
            tipo: "reserva",
            accionVista: "admin_dashboard",
          });
        } else if (nuevoEstado === "completada") {
          notificarCliente(usuarioId, {
            titulo: "Partido Finalizado",
            mensaje: `¡Gracias por jugar en FutbolZone! Tu partido en ${nomCancha} fue registrado como completado (+150 Puntos Zone).`,
            tipo: "reserva",
            accionVista: "client_dashboard",
          });
        } else if (nuevoEstado === "cancelada") {
          notificarCliente(usuarioId, {
            titulo: "Reserva Cancelada",
            mensaje: `Tu turno para el ${fechaRes} en ${nomCancha} fue cancelado por la administración.`,
            tipo: "reserva",
            accionVista: "client_dashboard",
          });
          notificarAdmin({
            titulo: "Reserva Cancelada",
            mensaje: `Se canceló la reserva #${id} (${nomCliente}). El horario ha quedado disponible.`,
            tipo: "reserva",
            accionVista: "admin_dashboard",
          });
        }
        mostrarAlerta(`Estado de reserva #${id} actualizado a ${nuevoEstado.toUpperCase()}.`);
      }
      cargarDatosAdmin();
    } catch (err: any) {
      mostrarAlerta("Error actualizando estado: " + err.message, "error");
    }
  };

  const cambiarMetodoPago = async (id: number, metodo: string) => {
    setReservas(reservas.map((r) => (r.id === id ? { ...r, metodo_pago: metodo } : r)));
    try {
      await api.actualizarReserva(id, { metodo_pago: metodo });
      mostrarAlerta(`Método de pago de reserva #${id} cambiado a ${metodo}.`);
    } catch {
      // guardado local fallback
    }
  };

  const exportarExcelReservas = () => {
    const dataFilas = reservasFiltradas.map((r) => {
      const metodo = r.metodo_pago || (r.notas?.includes("NEQUI") ? "Nequi" : r.notas?.includes("DAVIPLATA") ? "Daviplata" : r.notas?.includes("TARJETA") ? "Tarjeta" : "Efectivo");
      return {
        "ID": r.id,
        "Cliente": r.cliente || "Cliente",
        "Cancha": r.cancha_nombre || "Cancha Central",
        "Fecha": r.fecha,
        "Horario": `${r.hora_inicio.substring(0, 5)} - ${r.hora_fin.substring(0, 5)}`,
        "Total COP": Number(r.precio_total) || 50000,
        "Método de Pago": metodo,
        "Estado": r.estado?.toUpperCase(),
        "Detalles": r.notas || "Turno estándar",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataFilas);
    worksheet["!cols"] = [
      { wch: 8 },  // ID
      { wch: 24 }, // Cliente
      { wch: 22 }, // Cancha
      { wch: 14 }, // Fecha
      { wch: 16 }, // Horario
      { wch: 14 }, // Total COP
      { wch: 18 }, // Método de Pago
      { wch: 14 }, // Estado
      { wch: 40 }, // Notas
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas FutbolZone");
    const fechaHoy = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Reporte_Reservas_FutbolZone_${fechaHoy}.xlsx`);
  };

  /* ══════════════════════════════════════════
     CRUD 3: EMPLEADOS / PERSONAL
     ══════════════════════════════════════════ */
  const manejarCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (api.crearEmpleado) {
        const res = await api.crearEmpleado(nuevoEmpleado);
        if (res.success) {
          mostrarAlerta(`Personal ${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido} registrado exitosamente.`);
          setMostrarFormEmpleado(false);
          setNuevoEmpleado({ nombre: "", apellido: "", cargo: "Coordinador de Sede", telefono: "", email: "" });
          notificarAdmin({
            titulo: "Personal Registrado",
            mensaje: `Se ha añadido a ${nuevoEmpleado.nombre} (${nuevoEmpleado.cargo}) al staff.`,
            tipo: "sistema",
          });
          cargarDatosAdmin();
        }
      }
    } catch (err: any) {
      mostrarAlerta("Error al registrar empleado: " + err.message, "error");
    }
  };

  const manejarActualizarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoParaEditar) return;
    try {
      if (api.actualizarEmpleado) {
        const res = await api.actualizarEmpleado(empleadoParaEditar.id, {
          nombre: empleadoParaEditar.nombre,
          apellido: empleadoParaEditar.apellido,
          cargo: empleadoParaEditar.cargo,
          telefono: empleadoParaEditar.telefono,
          activo: empleadoParaEditar.activo !== false,
        });
        if (res.success) {
          mostrarAlerta(`Empleado ${empleadoParaEditar.nombre} actualizado correctamente.`);
          setEmpleadoParaEditar(null);
          cargarDatosAdmin();
        }
      }
    } catch (err: any) {
      mostrarAlerta("Error actualizando empleado: " + err.message, "error");
    }
  };

  const eliminarEmpleado = async (id: number) => {
    if (!confirm("¿Deseas dar de baja a este miembro del personal?")) return;
    try {
      if (api.eliminarEmpleado) {
        await api.eliminarEmpleado(id);
        mostrarAlerta("Empleado desactivado del sistema.");
        cargarDatosAdmin();
      }
    } catch (err: any) {
      mostrarAlerta("Error: " + err.message, "error");
    }
  };

  /* ══════════════════════════════════════════
     CRUD 4: USUARIOS / CLIENTES
     ══════════════════════════════════════════ */
  const toggleEstadoUsuario = async (u: any) => {
    const nuevoEstado = !(u.activo !== false);
    try {
      if (api.actualizarUsuario) {
        await api.actualizarUsuario(u.id, { activo: nuevoEstado });
        mostrarAlerta(`Usuario "${u.nombre}" marcado como: ${nuevoEstado ? "ACTIVO" : "INACTIVO"}`);
        cargarDatosAdmin();
      }
    } catch (err: any) {
      mostrarAlerta("Error modificando usuario: " + err.message, "error");
    }
  };

  const manejarActualizarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaEditar) return;
    try {
      if (api.actualizarUsuario) {
        const res = await api.actualizarUsuario(usuarioParaEditar.id, {
          nombre: usuarioParaEditar.nombre,
          apellido: usuarioParaEditar.apellido,
          telefono: usuarioParaEditar.telefono,
          activo: usuarioParaEditar.activo !== false,
        });
        if (res.success) {
          mostrarAlerta(`Cliente "${usuarioParaEditar.nombre}" actualizado.`);
          setUsuarioParaEditar(null);
          cargarDatosAdmin();
        }
      }
    } catch (err: any) {
      mostrarAlerta("Error: " + err.message, "error");
    }
  };

  /* ══════════════════════════════════════════
     CRUD 5: ANUNCIOS Y COMUNICADOS
     ══════════════════════════════════════════ */
  const guardarAnuncioGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (onPublicarAnuncio) {
      onPublicarAnuncio({
        titulo: tituloAnuncio,
        mensaje: mensajeAnuncio,
        activo: anuncioActivo,
      });
      notificarTodosLosUsuarios({
        titulo: `Comunicado: ${tituloAnuncio}`,
        mensaje: mensajeAnuncio,
        tipo: "promocion",
      });
      mostrarAlerta("El comunicado ha sido actualizado y publicado en toda la plataforma.");
    }
  };

  // Cálculos de métricas
  let totalIngresos = reservas
    .filter((r) => r.estado === "confirmada" || r.estado === "completada")
    .reduce((sum, r) => sum + (Number(r.precio_total) || 50000), 0);

  let totalReservasCount = reservas.length;
  const canchasActivasCount = canchas.filter((c) => c.activa !== false).length;
  let porcentajeOcupacion = canchasActivasCount > 0 ? Math.min(100, Math.round((totalReservasCount * 18) / (canchasActivasCount * 30) * 100)) || 68 : 68;
  let subtituloPeriodo = "+18.4% vs mes anterior";
  let datosBarras = [
    { label: "ENE", v1: 35, v2: 65 },
    { label: "FEB", v1: 45, v2: 55 },
    { label: "MAR", v1: 30, v2: 70 },
    { label: "ABR", v1: 60, v2: 40 },
    { label: "MAY", v1: 75, v2: 25 },
    { label: "JUN", v1: 85, v2: 15 },
    { label: "JUL", v1: 50, v2: 50 },
    { label: "AGO", v1: 90, v2: 10 },
    { label: "SEP", v1: 65, v2: 35 },
  ];

  if (periodoMetricas === "semana") {
    totalIngresos = Math.round(totalIngresos * 0.28) || 350000;
    totalReservasCount = Math.max(4, Math.round(totalReservasCount * 0.35));
    porcentajeOcupacion = 84;
    subtituloPeriodo = "+6.2% vs semana anterior";
    datosBarras = [
      { label: "LUN", v1: 55, v2: 45 },
      { label: "MAR", v1: 65, v2: 35 },
      { label: "MIÉ", v1: 70, v2: 30 },
      { label: "JUE", v1: 85, v2: 15 },
      { label: "VIE", v1: 95, v2: 5 },
      { label: "SÁB", v1: 100, v2: 0 },
      { label: "DOM", v1: 90, v2: 10 },
    ];
  } else if (periodoMetricas === "ano") {
    totalIngresos = Math.round(totalIngresos * 5.8) || 7250000;
    totalReservasCount = Math.max(120, totalReservasCount * 6);
    porcentajeOcupacion = 76;
    subtituloPeriodo = "+34.8% crecimiento anual";
    datosBarras = [
      { label: "2023", v1: 40, v2: 60 },
      { label: "2024", v1: 65, v2: 35 },
      { label: "2025", v1: 82, v2: 18 },
      { label: "2026", v1: 94, v2: 6 },
    ];
  }

  // Filtrado de reservas
  const reservasFiltradas = reservas.filter((r) => {
    if (filtroEstadoReserva === "todas") return true;
    return r.estado === filtroEstadoReserva;
  });

  return (
    <div className="fz-dashboard-layout">
      {/* ── BARRA LATERAL (SIDEBAR CORPORATIVO) ── */}
      <aside className="fz-sidebar">
        <div className="fz-sidebar-user">
          <div className="fz-avatar-halo" style={{ background: "transparent", boxShadow: "none", width: "auto", height: "auto", display: "flex", justifyContent: "center" }}>
            <img
              src="/logo-futbolzone.png"
              alt="Logo FutbolZone"
              className="fz-brand-logo-emblem"
              style={{ width: "68px", height: "68px" }}
            />
          </div>
          <h3 className="fz-user-name" style={{ marginTop: "10px" }}>ADMINISTRACIÓN</h3>
          <p className="fz-user-email">admin@futbolzone.com</p>
          <span className="fz-user-badge">ROL ADMINISTRADOR</span>
        </div>

        <nav className="fz-nav-menu">
          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "metricas" ? "active" : ""}`}
            onClick={() => setTabActiva("metricas")}
          >
            <span className="fz-nav-label">Métricas y Rendimiento</span>
          </button>

          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "canchas" ? "active" : ""}`}
            onClick={() => setTabActiva("canchas")}
          >
            <span className="fz-nav-label">Gestión Canchas ({canchas.length})</span>
          </button>

          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "reservas" ? "active" : ""}`}
            onClick={() => setTabActiva("reservas")}
          >
            <span className="fz-nav-label">Control Reservas ({reservas.length})</span>
          </button>

          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "usuarios" ? "active" : ""}`}
            onClick={() => setTabActiva("usuarios")}
          >
            <span className="fz-nav-label">Directorio Clientes ({usuarios.length})</span>
          </button>

          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "empleados" ? "active" : ""}`}
            onClick={() => setTabActiva("empleados")}
          >
            <span className="fz-nav-label">Personal y Staff ({empleados.length})</span>
          </button>

          <button
            type="button"
            className={`fz-nav-item ${tabActiva === "anuncios" ? "active" : ""}`}
            onClick={() => setTabActiva("anuncios")}
          >
            <span className="fz-nav-label">Comunicados en Vivo</span>
          </button>
        </nav>

        <div className="fz-sidebar-footer">
          <button type="button" className="fz-logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── ÁREA DE CONTENIDO PRINCIPAL ── */}
      <main className="fz-main-content">
        {/* Cabecera Superior */}
        <header className="fz-top-header">
          <div>
            <div className="fz-breadcrumb">Panel de Control › FutbolZone ADSO III</div>
            <h1 className="fz-main-title">
              {tabActiva === "metricas" && "Métricas y Rendimiento Operativo"}
              {tabActiva === "canchas" && "Gestión de Canchas Sintéticas"}
              {tabActiva === "reservas" && "Control y Liquidación de Reservas"}
              {tabActiva === "usuarios" && "Directorio de Clientes Registrados"}
              {tabActiva === "empleados" && "Equipo y Personal de Sede"}
              {tabActiva === "anuncios" && "Comunicados y Anuncios de la Sede"}
            </h1>
            {cargando && <div className="fz-sync-status">Sincronizando base de datos en tiempo real...</div>}
          </div>

          <div className="fz-header-actions">
            {tabActiva === "canchas" && (
              <button
                type="button"
                className="fz-btn-primary"
                onClick={() => setMostrarFormCancha(!mostrarFormCancha)}
              >
                {mostrarFormCancha ? "✕ Cancelar" : "+ Registrar Cancha"}
              </button>
            )}

            {tabActiva === "reservas" && (
              <button
                type="button"
                className="fz-btn-primary"
                onClick={() => setMostrarFormReservaAdmin(!mostrarFormReservaAdmin)}
              >
                {mostrarFormReservaAdmin ? "✕ Cancelar" : "+ Crear Reserva"}
              </button>
            )}

            {tabActiva === "empleados" && (
              <button
                type="button"
                className="fz-btn-primary"
                onClick={() => setMostrarFormEmpleado(!mostrarFormEmpleado)}
              >
                {mostrarFormEmpleado ? "✕ Cancelar" : "+ Registrar Personal"}
              </button>
            )}

            <button type="button" className="fz-btn-refresh" onClick={cargarDatosAdmin} title="Recargar datos">
              Actualizar Datos
            </button>
          </div>
        </header>

        {feedbackMsg && (
          <div className={`fz-client-banner-alert ${feedbackMsg.tipo === "error" ? "error" : ""}`} style={{ marginBottom: "20px" }}>
            <span>{feedbackMsg.texto}</span>
          </div>
        )}

        {/* ── VISTA 1: MÉTRICAS Y DASHBOARD EJECUTIVO ── */}
        {tabActiva === "metricas" && (
          <div className="fz-dashboard-view">
            <div className="fz-time-filter-container">
              <span className="fz-time-label">Período de Análisis:</span>
              <div className="fz-time-pills">
                <button
                  type="button"
                  className={`fz-time-pill ${periodoMetricas === "semana" ? "active" : ""}`}
                  onClick={() => setPeriodoMetricas("semana")}
                >
                  Semanal
                </button>
                <button
                  type="button"
                  className={`fz-time-pill ${periodoMetricas === "mes" ? "active" : ""}`}
                  onClick={() => setPeriodoMetricas("mes")}
                >
                  Mensual ({mesActual})
                </button>
                <button
                  type="button"
                  className={`fz-time-pill ${periodoMetricas === "ano" ? "active" : ""}`}
                  onClick={() => setPeriodoMetricas("ano")}
                >
                  Anual (2026)
                </button>
              </div>
            </div>

            {/* Tarjetas KPI */}
            <div className="fz-kpi-grid">
              <div className="fz-kpi-card fz-kpi-highlight">
                <div className="fz-kpi-top">
                  <span className="fz-kpi-label">TOTAL RECAUDADO</span>
                  <span className="fz-kpi-badge-pill">{subtituloPeriodo}</span>
                </div>
                <div className="fz-kpi-value">${totalIngresos.toLocaleString("es-CO")} COP</div>
                <div className="fz-kpi-sub">Ingresos netos por turnos y adicionales</div>
              </div>

              <div className="fz-kpi-card">
                <div className="fz-kpi-top">
                  <span className="fz-kpi-label">TOTAL RESERVAS</span>
                  <span className="fz-kpi-badge-neutral">OPERATIVO</span>
                </div>
                <div className="fz-kpi-value">{totalReservasCount}</div>
                <div className="fz-kpi-sub">Partidos agendados en el rango seleccionado</div>
              </div>

              <div className="fz-kpi-card">
                <div className="fz-kpi-top">
                  <span className="fz-kpi-label">CANCHAS HABILITADAS</span>
                  <span className="fz-kpi-badge-success">100% ACTIVAS</span>
                </div>
                <div className="fz-kpi-value">{canchasActivasCount}</div>
                <div className="fz-kpi-sub">Fútbol 5, Fútbol 7 y Fútbol 11 operativas</div>
              </div>

              <div className="fz-kpi-card">
                <div className="fz-kpi-top">
                  <span className="fz-kpi-label">CLIENTES REGISTRADOS</span>
                  <span className="fz-kpi-badge-neutral">VERIFICADOS</span>
                </div>
                <div className="fz-kpi-value">{usuarios.length}</div>
                <div className="fz-kpi-sub">4.9 / 5.0 índice de satisfacción promedio</div>
              </div>
            </div>

            {/* Gráficos Ejecutivos */}
            <div className="fz-charts-grid">
              <div className="fz-charts-left">
                <div className="fz-widget-card">
                  <div className="fz-widget-header">
                    <div>
                      <h3 className="fz-widget-title">
                        {periodoMetricas === "semana" && "Actividad Diaria de la Semana"}
                        {periodoMetricas === "mes" && "Rendimiento Mensual de Reservas"}
                        {periodoMetricas === "ano" && "Historial y Proyección Anual"}
                      </h3>
                      <p className="fz-widget-subtitle">Comparativa de horas reservadas vs capacidad disponible</p>
                    </div>
                    <div className="fz-chart-legend">
                      <span className="legend-item"><span className="legend-dot green"></span> Horas Reservadas</span>
                      <span className="legend-item"><span className="legend-dot gold"></span> Capacidad Libre</span>
                      <button type="button" className="fz-btn-sm" onClick={() => setTabActiva("reservas")}>Ver Listado</button>
                    </div>
                  </div>

                  <div className="fz-bar-chart-container">
                    <div className="fz-chart-bars">
                      {datosBarras.map((item, idx) => (
                        <div key={idx} className="fz-bar-group">
                          <div className="fz-bars-pair">
                            <div
                              className="fz-bar-fill primary"
                              style={{ height: `${item.v1}%` }}
                              title={`${item.label}: ${item.v1}% ocupación`}
                            ></div>
                            <div
                              className="fz-bar-fill accent"
                              style={{ height: `${item.v2 * 0.7}%` }}
                              title={`${item.label}: ${item.v2}% disponible`}
                            ></div>
                          </div>
                          <span className="fz-bar-label">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="fz-widget-card fz-wave-calendar-card">
                  <div className="fz-wave-section">
                    <h4 className="fz-section-title">Distribución de Horarios Pico</h4>
                    <p className="fz-widget-subtitle">Curva de afluencia: Mañana, Tarde y Franja Nocturna</p>
                    
                    <div className="fz-wave-svg-wrap">
                      <svg viewBox="0 0 500 140" className="fz-wave-svg" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="waveGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="waveGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,120 Q60,40 130,80 T260,30 T390,90 T500,60 L500,140 L0,140 Z"
                          fill="url(#waveGoldGrad)"
                        />
                        <path
                          d="M0,120 Q60,40 130,80 T260,30 T390,90 T500,60"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                        />
                        <path
                          d="M0,130 Q70,90 140,40 T280,70 T400,20 T500,45 L500,140 L0,140 Z"
                          fill="url(#waveGreenGrad)"
                        />
                        <path
                          d="M0,130 Q70,90 140,40 T280,70 T400,20 T500,45"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="fz-calendar-section">
                    <div className="fz-calendar-header">
                      <span>{mesActual}</span>
                      <span className="fz-cal-badge">Disponibilidad en Vivo</span>
                    </div>
                    <div className="fz-calendar-grid">
                      {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                        <span key={i} className="fz-cal-head">{d}</span>
                      ))}
                      {[
                        "", "", "", 1, 2, 3, 4,
                        5, 6, 7, 8, 9, 10, 11,
                        12, 13, 14, 15, 16, 17, 18,
                        19, 20, 21, 22, 23, 24, 25,
                        26, 27, 28, 29, 30, 31, ""
                      ].map((dia, idx) => (
                        <span
                          key={idx}
                          className={`fz-cal-cell ${dia === 28 ? "today" : ""} ${[7, 14, 21, 28].includes(Number(dia)) ? "booked" : ""}`}
                        >
                          {dia}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="fz-charts-right">
                <div className="fz-widget-card fz-donut-widget">
                  <h3 className="fz-widget-title">Ocupación de Canchas</h3>
                  <p className="fz-widget-subtitle">Capacidad global utilizada</p>

                  <div className="fz-donut-circle-wrap">
                    <svg viewBox="0 0 160 160" className="fz-donut-svg">
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        className="fz-donut-bg"
                        strokeWidth="14"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        className="fz-donut-val green"
                        strokeWidth="14"
                        strokeDasharray="377"
                        strokeDashoffset={`${377 - (377 * porcentajeOcupacion) / 100}`}
                      />
                    </svg>
                    <div className="fz-donut-center-text">
                      <span className="fz-donut-percent">{porcentajeOcupacion}%</span>
                      <span className="fz-donut-sub">Ocupación</span>
                    </div>
                  </div>

                  <div className="fz-donut-list">
                    <div className="fz-donut-item">
                      <div className="fz-donut-item-left">
                        <span className="fz-dot green"></span>
                        <span>Fútbol 5 (Cancha Central)</span>
                      </div>
                      <strong>55%</strong>
                    </div>

                    <div className="fz-donut-item">
                      <div className="fz-donut-item-left">
                        <span className="fz-dot gold"></span>
                        <span>Fútbol 7 (Cancha Norte)</span>
                      </div>
                      <strong>30%</strong>
                    </div>

                    <div className="fz-donut-item">
                      <div className="fz-donut-item-left">
                        <span className="fz-dot dark"></span>
                        <span>Fútbol 11 (Cancha Sur)</span>
                      </div>
                      <strong>15%</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="fz-btn-block-action"
                    onClick={() => setTabActiva("canchas")}
                  >
                    Administrar Canchas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VISTA 2: GESTIÓN DE CANCHAS (CRUD COMPLETO) ── */}
        {tabActiva === "canchas" && (
          <div className="fz-subview-card">
            {/* Formulario Crear */}
            {mostrarFormCancha && (
              <form onSubmit={manejarCrearCancha} className="fz-form-inline">
                <h3>Registrar Nueva Cancha Sintética</h3>
                <div className="fz-form-grid">
                  <div className="fz-field">
                    <label>Nombre de la Cancha *</label>
                    <input
                      type="text"
                      placeholder="Ej. Cancha Los Campeones"
                      value={nuevaCancha.nombre}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Tipo de Cancha *</label>
                    <select
                      value={nuevaCancha.tipo}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, tipo: e.target.value })}
                    >
                      <option value="Fútbol 5">Fútbol 5</option>
                      <option value="Fútbol 7">Fútbol 7</option>
                      <option value="Fútbol 11">Fútbol 11</option>
                    </select>
                  </div>

                  <div className="fz-field">
                    <label>Precio por Hora (COP) *</label>
                    <input
                      type="number"
                      value={nuevaCancha.precio_hora}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, precio_hora: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Capacidad de Jugadores</label>
                    <input
                      type="number"
                      value={nuevaCancha.capacidad_jugadores}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, capacidad_jugadores: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="fz-field" style={{ marginTop: "12px" }}>
                  <label>Dirección / Ubicación Física</label>
                  <input
                    type="text"
                    placeholder="Calle 63 # 28-45, Sede Central"
                    value={nuevaCancha.direccion}
                    onChange={(e) => setNuevaCancha({ ...nuevaCancha, direccion: e.target.value })}
                  />
                </div>

                <div className="fz-field" style={{ marginTop: "12px" }}>
                  <label>Descripción de Características</label>
                  <textarea
                    rows={2}
                    placeholder="Césped sintético monofilamento, iluminación LED nocturna..."
                    value={nuevaCancha.descripcion}
                    onChange={(e) => setNuevaCancha({ ...nuevaCancha, descripcion: e.target.value })}
                  />
                </div>

                <div className="fz-form-actions">
                  <button type="submit" className="fz-btn-primary">Guardar Registro</button>
                  <button type="button" className="fz-btn-outline" onClick={() => setMostrarFormCancha(false)}>Cancelar</button>
                </div>
              </form>
            )}

            {/* Modal Editar Cancha */}
            {canchaParaEditar && (
              <div className="fz-floating-auth-backdrop" onClick={() => setCanchaParaEditar(null)}>
                <div className="fz-floating-auth-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
                  <div className="fz-floating-card-header">
                    <button type="button" className="fz-btn-modal-close-corner" onClick={() => setCanchaParaEditar(null)}>✕</button>
                    <h2>Editar Cancha: {canchaParaEditar.nombre}</h2>
                    <p>Actualiza la tarifa, dirección y especificaciones técnicas</p>
                  </div>
                  <div className="fz-floating-card-body">
                    <form onSubmit={manejarActualizarCancha} className="fz-pro-form">
                      <div className="fz-pro-row-2">
                        <div className="fz-pro-field">
                          <label>Nombre de la Cancha *</label>
                          <input
                            type="text"
                            value={canchaParaEditar.nombre}
                            onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="fz-pro-field">
                          <label>Tipo de Cancha *</label>
                          <select
                            value={canchaParaEditar.tipo}
                            onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, tipo: e.target.value })}
                          >
                            <option value="Fútbol 5">Fútbol 5</option>
                            <option value="Fútbol 7">Fútbol 7</option>
                            <option value="Fútbol 11">Fútbol 11</option>
                          </select>
                        </div>
                      </div>

                      <div className="fz-pro-row-2">
                        <div className="fz-pro-field">
                          <label>Precio por Hora (COP) *</label>
                          <input
                            type="number"
                            value={canchaParaEditar.precio_hora}
                            onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, precio_hora: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="fz-pro-field">
                          <label>Capacidad Jugadores</label>
                          <input
                            type="number"
                            value={canchaParaEditar.capacidad_jugadores || canchaParaEditar.capacidad || 10}
                            onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, capacidad_jugadores: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="fz-pro-field">
                        <label>Dirección / Sede Física</label>
                        <input
                          type="text"
                          value={canchaParaEditar.direccion || ""}
                          onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, direccion: e.target.value })}
                        />
                      </div>

                      <div className="fz-pro-field">
                        <label>Descripción</label>
                        <textarea
                          rows={2}
                          value={canchaParaEditar.descripcion || ""}
                          onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, descripcion: e.target.value })}
                        />
                      </div>

                      <div className="fz-checkbox-row" style={{ margin: "10px 0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={canchaParaEditar.activa !== false}
                            onChange={(e) => setCanchaParaEditar({ ...canchaParaEditar, activa: e.target.checked })}
                          />
                          <span>Cancha Habilitada y disponible para reservas</span>
                        </label>
                      </div>

                      <div className="fz-form-actions">
                        <button type="submit" className="fz-btn-submit-gradient">Guardar Cambios</button>
                        <button type="button" className="fz-btn-outline" onClick={() => setCanchaParaEditar(null)}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Listado de Canchas */}
            <div className="fz-canchas-grid-cards">
              {canchas.map((c) => (
                <div key={c.id} className="fz-cancha-card">
                  <div className="fz-cancha-badge">{c.tipo}</div>
                  <h4>{c.nombre}</h4>
                  <div className="fz-cancha-address">📍 {c.direccion || "Calle 63 # 28-45, Sede Central"}</div>
                  <p className="fz-cancha-desc">{c.descripcion || "Cancha sintética profesional con césped certificado."}</p>
                  
                  <div className="fz-cancha-meta">
                    <div>
                      <span className="fz-meta-label">Tarifa / Hora:</span>
                      <strong>${Number(c.precio_hora).toLocaleString("es-CO")} COP</strong>
                    </div>
                    <div>
                      <span className="fz-meta-label">Capacidad:</span>
                      <strong>{c.capacidad_jugadores || c.capacidad || 10} jugadores</strong>
                    </div>
                  </div>

                  <div className="fz-cancha-footer" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={`fz-btn-toggle-cancha ${c.activa !== false ? "activa" : "inactiva"}`}
                      onClick={() => toggleEstadoCancha(c)}
                    >
                      {c.activa !== false ? "Habilitada" : "Mantenimiento"}
                    </button>
                    <button
                      type="button"
                      className="fz-btn-sm"
                      onClick={() => setCanchaParaEditar(c)}
                      title="Editar información de la cancha"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="fz-btn-danger-sm"
                      onClick={() => eliminarCancha(c.id)}
                      title="Eliminar cancha"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VISTA 3: GESTIÓN DE RESERVAS (CRUD COMPLETO) ── */}
        {tabActiva === "reservas" && (
          <div className="fz-subview-card">
            {/* Formulario Crear Reserva desde Admin */}
            {mostrarFormReservaAdmin && (
              <form onSubmit={manejarCrearReservaAdmin} className="fz-form-inline">
                <h3>Agendar Nueva Reserva Manual (Taquilla / Administración)</h3>
                <div className="fz-form-grid">
                  <div className="fz-field">
                    <label>Cancha *</label>
                    <select
                      value={nuevaReservaAdmin.cancha_id}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, cancha_id: Number(e.target.value) })}
                    >
                      {canchas.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} ({c.tipo}) - ${Number(c.precio_hora).toLocaleString("es-CO")}</option>
                      ))}
                    </select>
                  </div>

                  <div className="fz-field">
                    <label>Fecha del Encuentro *</label>
                    <input
                      type="date"
                      value={nuevaReservaAdmin.fecha}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, fecha: e.target.value })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Hora Inicio *</label>
                    <input
                      type="time"
                      value={nuevaReservaAdmin.hora_inicio.substring(0, 5)}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, hora_inicio: `${e.target.value}:00` })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Hora Fin *</label>
                    <input
                      type="time"
                      value={nuevaReservaAdmin.hora_fin.substring(0, 5)}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, hora_fin: `${e.target.value}:00` })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Total Liquidado (COP) *</label>
                    <input
                      type="number"
                      value={nuevaReservaAdmin.precio_total}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, precio_total: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="fz-field">
                    <label>Método de Pago *</label>
                    <select
                      value={nuevaReservaAdmin.metodo_pago}
                      onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, metodo_pago: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo en Taquilla</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="fz-field" style={{ marginTop: "12px" }}>
                  <label>Notas / Detalles del Cliente</label>
                  <input
                    type="text"
                    value={nuevaReservaAdmin.notas}
                    onChange={(e) => setNuevaReservaAdmin({ ...nuevaReservaAdmin, notas: e.target.value })}
                  />
                </div>

                <div className="fz-form-actions">
                  <button type="submit" className="fz-btn-primary">Guardar Reserva</button>
                  <button type="button" className="fz-btn-outline" onClick={() => setMostrarFormReservaAdmin(false)}>Cancelar</button>
                </div>
              </form>
            )}

            <div className="fz-table-filters">
              <div className="fz-filters-left">
                <span className="fz-filter-title">Estado:</span>
                <button
                  type="button"
                  className={`fz-filter-pill ${filtroEstadoReserva === "todas" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReserva("todas")}
                >
                  Todas ({reservas.length})
                </button>
                <button
                  type="button"
                  className={`fz-filter-pill ${filtroEstadoReserva === "pendiente" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReserva("pendiente")}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  className={`fz-filter-pill ${filtroEstadoReserva === "confirmada" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReserva("confirmada")}
                >
                  Confirmadas
                </button>
                <button
                  type="button"
                  className={`fz-filter-pill ${filtroEstadoReserva === "completada" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReserva("completada")}
                >
                  Completadas
                </button>
                <button
                  type="button"
                  className={`fz-filter-pill ${filtroEstadoReserva === "cancelada" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReserva("cancelada")}
                >
                  Canceladas
                </button>
              </div>

              <div className="fz-table-export-actions">
                <button
                  type="button"
                  className="fz-btn-export-excel"
                  onClick={exportarExcelReservas}
                  title="Descargar informe en archivo Excel (.xlsx)"
                >
                  Exportar a Excel (.xlsx)
                </button>
              </div>
            </div>

            <div className="fz-table-responsive">
              <table className="fz-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Cancha</th>
                    <th>Fecha & Horario</th>
                    <th>Total Liquidado</th>
                    <th>Método de Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "35px", color: "#64748b" }}>
                        No hay reservas registradas en este estado.
                      </td>
                    </tr>
                  ) : (
                    reservasFiltradas.map((r) => {
                      const metodoDetectado = r.metodo_pago || (r.notas?.includes("NEQUI") ? "Nequi" : r.notas?.includes("DAVIPLATA") ? "Daviplata" : r.notas?.includes("TARJETA") ? "Tarjeta" : "Efectivo");
                      return (
                        <tr key={r.id}>
                          <td><strong>#{r.id}</strong></td>
                          <td>
                            <strong>{r.cliente || "Cliente"}</strong>
                            {r.notas && <div className="fz-row-notes">{r.notas}</div>}
                          </td>
                          <td><span className="fz-cancha-tag">{r.cancha_nombre || "Cancha Central"}</span></td>
                          <td>
                            {r.fecha}
                            <div className="fz-time-sub">{r.hora_inicio.substring(0, 5)} - {r.hora_fin.substring(0, 5)}</div>
                          </td>
                          <td><strong>${(Number(r.precio_total) || 50000).toLocaleString("es-CO")} COP</strong></td>
                          <td>
                            <select
                              className="fz-select-sm"
                              value={metodoDetectado}
                              onChange={(e) => cambiarMetodoPago(r.id, e.target.value)}
                            >
                              <option value="Efectivo">Efectivo en Taquilla</option>
                              <option value="Nequi">Nequi</option>
                              <option value="Daviplata">Daviplata</option>
                              <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                            </select>
                          </td>
                          <td>
                            <span className={`fz-badge-status ${r.estado}`}>
                              {r.estado === "confirmada" && "CONFIRMADA"}
                              {r.estado === "pendiente" && "PENDIENTE"}
                              {r.estado === "completada" && "COMPLETADA"}
                              {r.estado === "cancelada" && "CANCELADA"}
                              {!["confirmada", "pendiente", "completada", "cancelada"].includes(r.estado) && r.estado?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="fz-action-btns">
                              {r.estado === "pendiente" && (
                                <button
                                  type="button"
                                  className="fz-btn-action-confirm"
                                  onClick={() => cambiarEstadoReserva(r.id, "confirmada")}
                                >
                                  Confirmar
                                </button>
                              )}
                              {r.estado === "confirmada" && (
                                <button
                                  type="button"
                                  className="fz-btn-action-complete"
                                  onClick={() => cambiarEstadoReserva(r.id, "completada")}
                                >
                                  Completar
                                </button>
                              )}
                              {r.estado !== "cancelada" && r.estado !== "completada" && (
                                <button
                                  type="button"
                                  className="fz-btn-action-cancel"
                                  onClick={() => {
                                    if (confirm("¿Deseas cancelar esta reserva y liberar el horario?")) {
                                      cambiarEstadoReserva(r.id, "cancelada");
                                    }
                                  }}
                                >
                                  Cancelar
                                </button>
                              )}
                              {r.estado === "cancelada" && (
                                <button
                                  type="button"
                                  className="fz-btn-action-confirm"
                                  onClick={() => cambiarEstadoReserva(r.id, "confirmada")}
                                >
                                  Reabrir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VISTA 4: DIRECTO DE CLIENTES (CRUD COMPLETO) ── */}
        {tabActiva === "usuarios" && (
          <div className="fz-subview-card">
            {usuarioParaEditar && (
              <div className="fz-floating-auth-backdrop" onClick={() => setUsuarioParaEditar(null)}>
                <div className="fz-floating-auth-card" onClick={(e) => e.stopPropagation()}>
                  <div className="fz-floating-card-header">
                    <button type="button" className="fz-btn-modal-close-corner" onClick={() => setUsuarioParaEditar(null)}>✕</button>
                    <h2>Modificar Cliente: {usuarioParaEditar.nombre}</h2>
                    <p>Actualiza datos del cliente o modifica su estado de acceso</p>
                  </div>
                  <div className="fz-floating-card-body">
                    <form onSubmit={manejarActualizarUsuario} className="fz-pro-form">
                      <div className="fz-pro-row-2">
                        <div className="fz-pro-field">
                          <label>Nombre *</label>
                          <input
                            type="text"
                            value={usuarioParaEditar.nombre}
                            onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="fz-pro-field">
                          <label>Apellido *</label>
                          <input
                            type="text"
                            value={usuarioParaEditar.apellido || ""}
                            onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, apellido: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="fz-pro-field">
                        <label>Teléfono</label>
                        <input
                          type="tel"
                          value={usuarioParaEditar.telefono || ""}
                          onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, telefono: e.target.value })}
                        />
                      </div>

                      <div className="fz-checkbox-row" style={{ margin: "10px 0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={usuarioParaEditar.activo !== false}
                            onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, activo: e.target.checked })}
                          />
                          <span>Cuenta activa y habilitada para reservas</span>
                        </label>
                      </div>

                      <div className="fz-form-actions">
                        <button type="submit" className="fz-btn-submit-gradient">Guardar Cambios</button>
                        <button type="button" className="fz-btn-outline" onClick={() => setUsuarioParaEditar(null)}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="fz-table-responsive">
              <table className="fz-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Teléfono</th>
                    <th>Total Reservas</th>
                    <th>Estado de Cuenta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.nombre} {u.apellido}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.telefono || "No registrado"}</td>
                      <td><span className="fz-count-badge">{u.total_reservas || 0} partidos</span></td>
                      <td>
                        <span className={`fz-status-pill ${u.activo !== false ? "active" : "inactive"}`}>
                          {u.activo !== false ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td>
                        <div className="fz-action-btns">
                          <button
                            type="button"
                            className="fz-btn-sm"
                            onClick={() => setUsuarioParaEditar(u)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={u.activo !== false ? "fz-btn-action-cancel" : "fz-btn-action-confirm"}
                            onClick={() => toggleEstadoUsuario(u)}
                          >
                            {u.activo !== false ? "Desactivar" : "Reactivar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VISTA 5: EMPLEADOS / PERSONAL (CRUD COMPLETO) ── */}
        {tabActiva === "empleados" && (
          <div className="fz-subview-card">
            {/* Formulario Crear Empleado */}
            {mostrarFormEmpleado && (
              <form onSubmit={manejarCrearEmpleado} className="fz-form-inline">
                <h3>Registrar Nuevo Personal de Sede</h3>
                <div className="fz-form-grid">
                  <div className="fz-field">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={nuevoEmpleado.nombre}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="fz-field">
                    <label>Apellido *</label>
                    <input
                      type="text"
                      value={nuevoEmpleado.apellido}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, apellido: e.target.value })}
                      required
                    />
                  </div>
                  <div className="fz-field">
                    <label>Cargo / Función *</label>
                    <input
                      type="text"
                      value={nuevoEmpleado.cargo}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cargo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="fz-field">
                    <label>Correo Electrónico *</label>
                    <input
                      type="email"
                      value={nuevoEmpleado.email}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="fz-field">
                    <label>Teléfono de Contacto</label>
                    <input
                      type="tel"
                      value={nuevoEmpleado.telefono}
                      onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })}
                    />
                  </div>
                </div>
                <div className="fz-form-actions">
                  <button type="submit" className="fz-btn-primary">Guardar Personal</button>
                  <button type="button" className="fz-btn-outline" onClick={() => setMostrarFormEmpleado(false)}>Cancelar</button>
                </div>
              </form>
            )}

            {/* Modal Editar Empleado */}
            {empleadoParaEditar && (
              <div className="fz-floating-auth-backdrop" onClick={() => setEmpleadoParaEditar(null)}>
                <div className="fz-floating-auth-card" onClick={(e) => e.stopPropagation()}>
                  <div className="fz-floating-card-header">
                    <button type="button" className="fz-btn-modal-close-corner" onClick={() => setEmpleadoParaEditar(null)}>✕</button>
                    <h2>Editar Personal: {empleadoParaEditar.nombre}</h2>
                    <p>Actualiza la función y datos de contacto</p>
                  </div>
                  <div className="fz-floating-card-body">
                    <form onSubmit={manejarActualizarEmpleado} className="fz-pro-form">
                      <div className="fz-pro-row-2">
                        <div className="fz-pro-field">
                          <label>Nombre *</label>
                          <input
                            type="text"
                            value={empleadoParaEditar.nombre}
                            onChange={(e) => setEmpleadoParaEditar({ ...empleadoParaEditar, nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="fz-pro-field">
                          <label>Apellido *</label>
                          <input
                            type="text"
                            value={empleadoParaEditar.apellido}
                            onChange={(e) => setEmpleadoParaEditar({ ...empleadoParaEditar, apellido: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="fz-pro-field">
                        <label>Cargo / Rol *</label>
                        <input
                          type="text"
                          value={empleadoParaEditar.cargo}
                          onChange={(e) => setEmpleadoParaEditar({ ...empleadoParaEditar, cargo: e.target.value })}
                          required
                        />
                      </div>

                      <div className="fz-pro-field">
                        <label>Teléfono</label>
                        <input
                          type="tel"
                          value={empleadoParaEditar.telefono || ""}
                          onChange={(e) => setEmpleadoParaEditar({ ...empleadoParaEditar, telefono: e.target.value })}
                        />
                      </div>

                      <div className="fz-form-actions">
                        <button type="submit" className="fz-btn-submit-gradient">Guardar Cambios</button>
                        <button type="button" className="fz-btn-outline" onClick={() => setEmpleadoParaEditar(null)}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Listado de Empleados */}
            <div className="fz-canchas-grid-cards">
              {empleados.map((emp) => (
                <div key={emp.id} className="fz-cancha-card">
                  <div className="fz-cancha-badge">Staff Operativo</div>
                  <h4>{emp.nombre} {emp.apellido}</h4>
                  <p className="fz-cancha-desc">Cargo: <strong>{emp.cargo}</strong></p>
                  <div className="fz-cancha-meta">
                    <div>
                      <span className="fz-meta-label">Teléfono:</span>
                      <strong>{emp.telefono || "3001234567"}</strong>
                    </div>
                    <div>
                      <span className="fz-meta-label">Correo:</span>
                      <strong>{emp.email || "staff@futbolzone.com"}</strong>
                    </div>
                  </div>

                  <div className="fz-cancha-footer" style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="fz-btn-sm"
                      onClick={() => setEmpleadoParaEditar(emp)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="fz-btn-danger-sm"
                      onClick={() => eliminarEmpleado(emp.id)}
                    >
                      Dar de Baja
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VISTA 6: COMUNICADOS EN VIVO (CRUD) ── */}
        {tabActiva === "anuncios" && (
          <div className="fz-subview-card">
            <form onSubmit={guardarAnuncioGlobal} className="fz-form-inline">
              <h3>Publicar / Modificar Comunicado en Vivo</h3>
              <p className="fz-form-subtitle">
                Este mensaje se desplegará en la barra superior de la plataforma para todos los usuarios.
              </p>

              <div className="fz-field">
                <label>Título del Comunicado *</label>
                <input
                  type="text"
                  value={tituloAnuncio}
                  onChange={(e) => setTituloAnuncio(e.target.value)}
                  required
                />
              </div>

              <div className="fz-field" style={{ marginTop: "12px" }}>
                <label>Mensaje Detallado *</label>
                <textarea
                  rows={3}
                  value={mensajeAnuncio}
                  onChange={(e) => setMensajeAnuncio(e.target.value)}
                  required
                />
              </div>

              <div className="fz-checkbox-row" style={{ marginTop: "15px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={anuncioActivo}
                    onChange={(e) => setAnuncioActivo(e.target.checked)}
                  />
                  <span>Mostrar de inmediato en el banner de la plataforma</span>
                </label>
              </div>

              <div className="fz-form-actions">
                <button type="submit" className="fz-btn-primary">Publicar Comunicado</button>
                <button
                  type="button"
                  className="fz-btn-outline"
                  onClick={() => {
                    setAnuncioActivo(false);
                    if (onPublicarAnuncio) onPublicarAnuncio({ titulo: "", mensaje: "", activo: false });
                    mostrarAlerta("Comunicado retirado de la plataforma.");
                  }}
                >
                  Desactivar Comunicado
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardAdmin;
