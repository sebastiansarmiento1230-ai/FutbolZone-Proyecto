import { useState, useEffect } from "react";
import "./NotificacionesPill.css";
import { getStoredUser } from "../services/api";
import { NotificacionItem } from "../services/notifications";

interface NotificacionesPillProps {
  onNavigate?: (vista: string) => void;
}

function NotificacionesPill({ onNavigate }: NotificacionesPillProps) {
  const [abierto, setAbierto] = useState<boolean>(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const usuario = getStoredUser();

  useEffect(() => {
    cargarNotificaciones();

    const handleUpdate = () => {
      cargarNotificaciones();
    };

    window.addEventListener("fz_notification_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("fz_notification_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [usuario?.id, usuario?.rol]);

  const cargarNotificaciones = () => {
    const claveStorage = usuario?.rol === "admin"
      ? "fz_notifs_admin"
      : `fz_notifs_${usuario?.id || "guest"}`;

    const guardadas = localStorage.getItem(claveStorage);

    if (guardadas) {
      try {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) {
          setNotificaciones(parsed);
          return;
        }
      } catch {
        // Fallback si hay error de parseo
      }
    }

    // Iniciales si no hay nada en storage
    let iniciales: NotificacionItem[] = [];

    if (usuario?.rol === "admin") {
      iniciales = [
        {
          id: "notif_adm_1",
          titulo: "Panel de Administración Operativo",
          mensaje: "Todas las canchas (Fútbol 5, 7 y 11) están sincronizadas con la base de datos.",
          fecha: "Hoy",
          leida: false,
          tipo: "sistema",
          accionVista: "admin_dashboard",
        },
        {
          id: "notif_adm_2",
          titulo: "Control de Turnos en Vivo",
          mensaje: "Puedes revisar, confirmar o liquidar las reservas registradas por los clientes.",
          fecha: "Hoy",
          leida: false,
          tipo: "reserva",
          accionVista: "admin_dashboard",
        },
      ];
    } else if (usuario) {
      iniciales = [
        {
          id: "notif_cli_1",
          titulo: "Bienvenido a FutbolZone",
          mensaje: `Hola ${usuario.nombre}, explora el catálogo de canchas y agenda tu turno en tiempo real.`,
          fecha: "Hoy",
          leida: false,
          tipo: "sistema",
          accionVista: "client_dashboard",
        },
        {
          id: "notif_cli_2",
          titulo: "Cupón de Descuento SENA20",
          mensaje: "Usa el cupón SENA20 para obtener 20% de descuento en tu próxima reserva.",
          fecha: "Hoy",
          leida: false,
          tipo: "promocion",
          accionVista: "landing",
        },
      ];
    } else {
      iniciales = [
        {
          id: "notif_gst_1",
          titulo: "Reserva Canchas en Tiempo Real",
          mensaje: "Canchas sintéticas de Fútbol 5, 7 y 11 disponibles con iluminación LED nocturna.",
          fecha: "Hoy",
          leida: false,
          tipo: "sistema",
          accionVista: "landing",
        },
      ];
    }

    setNotificaciones(iniciales);
    localStorage.setItem(claveStorage, JSON.stringify(iniciales));
  };

  const guardarNotifs = (nuevas: NotificacionItem[]) => {
    setNotificaciones(nuevas);
    const claveStorage = usuario?.rol === "admin"
      ? "fz_notifs_admin"
      : `fz_notifs_${usuario?.id || "guest"}`;
    localStorage.setItem(claveStorage, JSON.stringify(nuevas));
    window.dispatchEvent(new Event("fz_notification_update"));
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const marcarTodasLeidas = () => {
    const actualizadas = notificaciones.map((n) => ({ ...n, leida: true }));
    guardarNotifs(actualizadas);
  };

  const limpiarNotificaciones = () => {
    guardarNotifs([]);
  };

  const hacerClicNotif = (notif: NotificacionItem) => {
    const actualizadas = notificaciones.map((n) =>
      n.id === notif.id ? { ...n, leida: true } : n
    );
    guardarNotifs(actualizadas);
    setAbierto(false);

    if (notif.accionVista && onNavigate) {
      onNavigate(notif.accionVista);
    }
  };

  return (
    <div className="fz-notif-wrapper">
      <button
        type="button"
        className={`fz-btn-bell ${noLeidas > 0 ? "has-unread" : ""}`}
        onClick={() => setAbierto(!abierto)}
        title={`Notificaciones (${noLeidas} nuevas)`}
        aria-label="Notificaciones"
      >
        <span className="fz-bell-svg-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        {noLeidas > 0 && <span className="fz-bell-badge">{noLeidas}</span>}
      </button>

      {abierto && (
        <div className="fz-notif-dropdown">
          <div className="fz-notif-header">
            <div className="fz-notif-header-title">
              <h4>Centro de Notificaciones</h4>
              {noLeidas > 0 && <span className="fz-notif-unread-tag">{noLeidas} nuevas</span>}
            </div>
            <div className="fz-notif-header-actions">
              {noLeidas > 0 && (
                <button
                  type="button"
                  className="fz-btn-mark-all"
                  onClick={marcarTodasLeidas}
                >
                  Marcar leídas
                </button>
              )}
              <button
                type="button"
                className="fz-btn-close-notif"
                onClick={() => setAbierto(false)}
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="fz-notif-list">
            {notificaciones.length === 0 ? (
              <div className="fz-notif-empty">
                <p>No tienes notificaciones pendientes.</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  className={`fz-notif-item ${n.leida ? "leida" : "unread"}`}
                  onClick={() => hacerClicNotif(n)}
                >
                  <div className="fz-notif-item-top">
                    <span className={`fz-notif-type-tag ${n.tipo}`}>
                      {n.tipo === "reserva" && "RESERVA"}
                      {n.tipo === "sistema" && "SISTEMA"}
                      {n.tipo === "promocion" && "PROMOCIÓN"}
                      {n.tipo === "pago" && "PAGO"}
                      {n.tipo === "seguridad" && "SEGURIDAD"}
                    </span>
                    <span className="fz-notif-time">{n.fecha}</span>
                  </div>
                  <strong className="fz-notif-item-title">{n.titulo}</strong>
                  <p className="fz-notif-item-msg">{n.mensaje}</p>
                </div>
              ))
            )}
          </div>

          {notificaciones.length > 0 && (
            <div className="fz-notif-footer">
              <button
                type="button"
                className="fz-btn-clear-notifs"
                onClick={limpiarNotificaciones}
              >
                Limpiar historial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificacionesPill;
