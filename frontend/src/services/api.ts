const API_BASE_URL = "http://localhost:5000/api";

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

export const getStoredUser = (): any | null => {
  const user = localStorage.getItem("usuario");
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: any): void => {
  localStorage.setItem("usuario", JSON.stringify(user));
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errDetail = data.detail || data.message || data.error;
      if (
        response.status === 401 ||
        (typeof errDetail === "string" && (errDetail.includes("Token") || errDetail.includes("token")))
      ) {
        removeAuthToken();
        throw new Error("Tu sesión ha expirado o el token es inválido. Por favor inicia sesión nuevamente para renovar tu acceso.");
      }
      throw new Error(typeof errDetail === "string" ? errDetail : "Ocurrió un error en el servidor");
    }

    return data;
  } catch (err: any) {
    if (err.name === "TypeError" || err.message?.includes("Failed to fetch")) {
      throw new Error("No se pudo conectar con el servidor backend (FastAPI). Por favor inicia el backend ejecutando: cd backend -> python main.py");
    }
    throw err;
  }
}

export const api = {
  // Autenticación & Usuarios
  login: (correo: string, password: string) =>
    request<any>("/usuarios/login", {
      method: "POST",
      body: JSON.stringify({ correo, password }),
    }),

  registro: (datos: { nombre: string; apellido: string; correo: string; password: string; telefono?: string }) =>
    request<any>("/usuarios/registro", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  obtenerUsuarios: () => request<any>("/usuarios/"),
  obtenerClientes: () => request<any>("/usuarios/clientes"),
  actualizarPerfil: (id: number, datos: { nombre?: string; apellido?: string; telefono?: string }) =>
    request<any>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  cambiarRol: (id: number, rol: string) =>
    request<any>(`/usuarios/${id}/rol?rol=${rol}`, { method: "PATCH" }),

  // Canchas
  obtenerCanchas: (activas: boolean = false) =>
    request<any>(`/canchas/?activas=${activas}`),

  obtenerDisponibilidad: (canchaId: number, fecha: string) =>
    request<any>(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`),

  crearCancha: (datos: any) =>
    request<any>("/canchas/", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  actualizarCancha: (id: number, datos: any) =>
    request<any>(`/canchas/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),

  eliminarCancha: (id: number) =>
    request<any>(`/canchas/${id}`, { method: "DELETE" }),

  // Reservas
  crearReserva: (datos: {
    cancha_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    precio_total?: number;
    incluye_kit?: boolean;
    incluye_arbitro?: boolean;
    descuento?: number;
    notas?: string;
  }) =>
    request<any>("/reservas/", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  obtenerMisReservas: () => request<any>("/reservas/mis-reservas"),
  obtenerReservas: () => request<any>("/reservas/"),
  obtenerTodasReservas: () => request<any>("/reservas/"),
  actualizarReserva: (id: number, datos: any) =>
    request<any>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  actualizarEstadoReserva: (id: number, estado: string) =>
    request<any>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    }),
  cancelarReserva: (id: number) => request<any>(`/reservas/${id}`, { method: "DELETE" }),

  // Empleados
  obtenerEmpleados: () => request<any>("/empleados/"),
  crearEmpleado: (datos: any) =>
    request<any>("/empleados/", {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  actualizarEmpleado: (id: number, datos: any) =>
    request<any>(`/empleados/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminarEmpleado: (id: number) =>
    request<any>(`/empleados/${id}`, { method: "DELETE" }),

  // Usuarios / Clientes
  actualizarUsuario: (id: number, datos: any) =>
    request<any>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),

  // Reportes
  obtenerResumenReportes: () => request<any>("/reportes/resumen"),
  obtenerReservasPorCancha: () => request<any>("/reportes/reservas-por-cancha"),
  obtenerIngresosMensuales: () => request<any>("/reportes/ingresos-mensuales"),

  // Reseñas
  obtenerResenas: (cancha_id?: number) =>
    request<any>(cancha_id ? `/resenas?cancha_id=${cancha_id}` : "/resenas"),
  crearResena: (datos: { cancha_id: number; rating: number; comentario: string }) =>
    request<any>("/resenas", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  // Recuperación y Cambio de Contraseña por PIN
  solicitarPinRecuperacion: (email: string) =>
    request<any>("/auth/recuperar-password/solicitar-pin", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verificarPinRecuperacion: (email: string, pin: string) =>
    request<any>("/auth/recuperar-password/verificar-pin", {
      method: "POST",
      body: JSON.stringify({ email, pin }),
    }),
  cambiarPasswordConPin: (datos: { email: string; pin: string; nueva_password: string }) =>
    request<any>("/auth/recuperar-password/cambiar-password", {
      method: "POST",
      body: JSON.stringify(datos),
    }),
};
