export interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: "reserva" | "sistema" | "promocion" | "pago" | "seguridad";
  accionVista?: "landing" | "admin_dashboard" | "client_dashboard" | "reserva";
}

const getFechaHoraActual = (): string => {
  const ahora = new Date();
  const horas = ahora.getHours().toString().padStart(2, "0");
  const minutos = ahora.getMinutes().toString().padStart(2, "0");
  return `Hoy, ${horas}:${minutos}`;
};

/**
 * Agrega una notificación al buzón del Administrador
 */
export const notificarAdmin = (notif: {
  titulo: string;
  mensaje: string;
  tipo?: "reserva" | "sistema" | "promocion" | "pago" | "seguridad";
  accionVista?: "landing" | "admin_dashboard" | "client_dashboard" | "reserva";
}) => {
  try {
    const claveAdmin = "fz_notifs_admin";
    const claveAdminId = "fz_notifs_1"; // ID común del admin

    const nueva: NotificacionItem = {
      id: `notif_adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      fecha: getFechaHoraActual(),
      leida: false,
      tipo: notif.tipo || "reserva",
      accionVista: notif.accionVista || "admin_dashboard",
    };

    [claveAdmin, claveAdminId].forEach((clave) => {
      const prev = localStorage.getItem(clave);
      let lista: NotificacionItem[] = prev ? JSON.parse(prev) : [];
      lista = [nueva, ...lista.slice(0, 30)]; // Guardar las últimas 30
      localStorage.setItem(clave, JSON.stringify(lista));
    });

    window.dispatchEvent(new Event("fz_notification_update"));
  } catch (err) {
    console.warn("Error enviando notificación al admin:", err);
  }
};

/**
 * Agrega una notificación a un cliente específico
 */
export const notificarCliente = (
  usuarioId: number | string | undefined,
  notif: {
    titulo: string;
    mensaje: string;
    tipo?: "reserva" | "sistema" | "promocion" | "pago" | "seguridad";
    accionVista?: "landing" | "admin_dashboard" | "client_dashboard" | "reserva";
  }
) => {
  try {
    const clave = `fz_notifs_${usuarioId || "guest"}`;
    const nueva: NotificacionItem = {
      id: `notif_cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      fecha: getFechaHoraActual(),
      leida: false,
      tipo: notif.tipo || "reserva",
      accionVista: notif.accionVista || "client_dashboard",
    };

    const prev = localStorage.getItem(clave);
    let lista: NotificacionItem[] = prev ? JSON.parse(prev) : [];
    lista = [nueva, ...lista.slice(0, 30)];
    localStorage.setItem(clave, JSON.stringify(lista));

    // Si es guest o no tiene ID, también guardar en clave global de cliente
    if (!usuarioId) {
      const prevGuest = localStorage.getItem("fz_notifs_guest");
      let listaGuest: NotificacionItem[] = prevGuest ? JSON.parse(prevGuest) : [];
      listaGuest = [nueva, ...listaGuest.slice(0, 30)];
      localStorage.setItem("fz_notifs_guest", JSON.stringify(listaGuest));
    }

    window.dispatchEvent(new Event("fz_notification_update"));
  } catch (err) {
    console.warn("Error enviando notificación al cliente:", err);
  }
};

/**
 * Envía un comunicado global a todos los buzones
 */
export const notificarTodosLosUsuarios = (notif: {
  titulo: string;
  mensaje: string;
  tipo?: "reserva" | "sistema" | "promocion" | "pago" | "seguridad";
}) => {
  try {
    const claves = Object.keys(localStorage).filter((k) => k.startsWith("fz_notifs_"));
    const nueva: NotificacionItem = {
      id: `notif_glob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      fecha: getFechaHoraActual(),
      leida: false,
      tipo: notif.tipo || "promocion",
      accionVista: "landing",
    };

    if (claves.length === 0) {
      localStorage.setItem("fz_notifs_guest", JSON.stringify([nueva]));
    } else {
      claves.forEach((k) => {
        try {
          const prev = localStorage.getItem(k);
          let lista: NotificacionItem[] = prev ? JSON.parse(prev) : [];
          lista = [nueva, ...lista.slice(0, 30)];
          localStorage.setItem(k, JSON.stringify(lista));
        } catch {}
      });
    }

    window.dispatchEvent(new Event("fz_notification_update"));
  } catch (err) {
    console.warn("Error enviando notificación global:", err);
  }
};
