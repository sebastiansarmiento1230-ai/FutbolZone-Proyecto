# ⚽ FutbolZone — Documentación Integral del Proyecto (SENA ADSO III)

**Sistema Integral de Gestión y Reserva de Canchas Sintéticas, Torneos y Administración Deportiva**  
*Proyecto Formativo para el programa de Análisis y Desarrollo de Software (ADSO) — SENA 2026.*

---

## 📊 1. Estado y Porcentaje de Desarrollo del Proyecto

El proyecto se encuentra en un **98% de desarrollo funcional y productivo**, contando con todos sus módulos centrales completamente implementados, probados e integrados entre Frontend (React + Vite) y Backend (FastAPI + SQLite/MySQL):

```
╔══════════════════════════════════════════════════════════════════════╦════════════╗
║ Módulo del Sistema                                                  ║ Estado     ║
╠══════════════════════════════════════════════════════════════════════╬════════════╣
║ 1. Autenticación, JWT, Roles y Recuperación con PIN Gmail SMTP       ║   100% 🟢  ║
║ 2. Catálogo de Canchas, Filtros y Disponibilidad en Tiempo Real      ║   100% 🟢  ║
║ 3. Motor de Reservas, Agendamiento y Control de Solapamiento         ║   100% 🟢  ║
║ 4. Torneos Deportivos, Categorías y Control de Inscripciones         ║    90% 🟢  ║
║ 5. Dashboard Administrativo, Métricas KPI y Reportes Excel           ║    95% 🟢  ║
║ 6. UI/UX: Dock 3 Botones (Tema ☀️/🌙, PC 💻 y Celular 📱)            ║   100% 🟢  ║
║ 7. Base de Datos Relacional SQLite Nativa + Fallback MySQL           ║   100% 🟢  ║
╠══════════════════════════════════════════════════════════════════════╬════════════╣
║ 🎯 PROMEDIO TOTAL DE DESARROLLO DEL PROYECTO                        ║    98% 🚀  ║
╚══════════════════════════════════════════════════════════════════════╩════════════╝
```

---

## 📁 2. Estructura del Repositorio

```text
FutbolZone-ADSO/
├── backend/                             ← Backend API REST (FastAPI + SQLAlchemy + SQLite/MySQL)
│   ├── app/
│   │   ├── config/database.py           ← Motor de base de datos SQLite nativo / MySQL
│   │   ├── controllers/                 ← Controladores de negocio (Auth, Canchas, Reservas, etc.)
│   │   ├── models/                      ← Modelos ORM (Usuarios, Canchas, Reservas, Torneos, Empleados)
│   │   ├── routes/                      ← Endpoints de la API REST
│   │   ├── schemas/                     ← Validaciones Pydantic
│   │   └── utils/                       ← Seguridad (Bcrypt/JWT) y Servicio SMTP de Correo Real
│   ├── futbolzone.db                    ← Base de datos SQLite principal
│   ├── .env                             ← Configuración SMTP de Gmail y seguridad
│   └── main.py                          ← Servidor Uvicorn / FastAPI
├── frontend/                            ← Frontend Web SPA (React 18 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canchas.tsx              ← Catálogo y filtros rápidos
│   │   │   ├── DashboardAdmin.tsx       ← Panel con métricas y exportación Excel
│   │   │   ├── DashboardCliente.tsx     ← Historial de reservas y cancelaciones
│   │   │   ├── Navegacion.tsx           ← Barra de navegación limpia
│   │   │   ├── RecuperarPasswordModal.tsx← Modal de recuperación con PIN y Gmail
│   │   │   ├── ReservaModal.tsx         ← Agendamiento en tiempo real
│   │   │   ├── ThemeJoystick.tsx        ← Dock lateral de 3 botones (Tema / PC / Móvil)
│   │   │   └── Torneos.tsx              ← Torneos e inscripciones
│   │   ├── services/api.ts              ← Conexión HTTP con Axios/Fetch
│   │   ├── App.tsx                      ← Ruteo y simulación móvil interactiva
│   │   └── main.tsx
├── docs/                                ← Carpeta de documentación técnica
│   └── Backlog_FutbolZone_Navegable.xlsx← Matriz Excel de 38 Historias de Usuario
├── Backlog_FutbolZone_Navegable.xlsx    ← Matriz oficial en Excel navegable
├── HISTORIAS_DE_USUARIO.md              ← Documento formal de HU y Criterios Gherkin
└── README.md                            ← Guía técnica y documentación principal
```

---

## 📋 3. Matriz de Historias de Usuario (HU) y Criterios de Aceptación

El proyecto cuenta con una especificación de **38 Historias de Usuario** documentadas en [`Backlog_FutbolZone_Navegable.xlsx`](file:///c:/Users/SENA/Documents/NicolasPaz/FutbolZone-ADSO/Backlog_FutbolZone_Navegable.xlsx) y detalladas en [`HISTORIAS_DE_USUARIO.md`](file:///c:/Users/SENA/Documents/NicolasPaz/FutbolZone-ADSO/HISTORIAS_DE_USUARIO.md):

### 📌 Resumen de Historias de Usuario Principales:

| ID | Historia de Usuario | Rol | Módulo | Estado | Puntos | Criterio Clave |
|---|---|---|---|---|---|---|
| **HU-01** | Registro de Nuevos Clientes | Visitante | Auth | ✅ Listo | 5 | Contraseña encriptada, validación de correo único y asignación de rol `cliente`. |
| **HU-02** | Inicio de Sesión con JWT | Todos | Auth | ✅ Listo | 5 | Token JWT de 120 min, persistencia en `localStorage` y redirección por rol. |
| **HU-03** | Recuperación de Clave con PIN Gmail | Todos | Seguridad | ✅ Listo | 8 | PIN de 6 dígitos con vigencia de 15 min enviado a Gmail real vía SMTP TLS 587. |
| **HU-04** | Catálogo y Filtro de Canchas | Todos | Canchas | ✅ Listo | 3 | Deduplicación estricta, filtros por categoría (F5, F7, F11) y precios en COP ($). |
| **HU-05** | Disponibilidad en Tiempo Real | Cliente | Agendamiento | ✅ Listo | 5 | Bloqueo de fechas pasadas y consulta dinámica de horarios libres vs ocupados. |
| **HU-06** | Creación y Confirmación de Reserva | Cliente | Reservas | ✅ Listo | 8 | Prevención de solapamiento de horarios y cálculo automático del valor total. |
| **HU-07** | Historial y Cancelación de Reservas | Cliente | Reservas | ✅ Listo | 5 | Vista en "Mis Reservas", badges de estado y liberación inmediata al cancelar. |
| **HU-08** | Inscripción a Torneos Deportivos | Cliente | Torneos | ✅ Listo | 5 | Control de cupos máximos (`max_equipos`) y premios por categoría. |
| **HU-09** | Dashboard con Métricas y Reportes | Admin | Administración | ✅ Listo | 8 | KPIs de ingresos y ocupación, con exportación de datos a Excel (`.xlsx`). |
| **HU-10** | Gestión de Empleados de la Sede | Admin | Personal | ✅ Listo | 5 | CRUD de empleados con cargos (Coordinador, Mantenimiento, Seguridad, etc.). |
| **HU-11** | Dock 3 Botones (Tema y Vista Celular) | Todos | UI / UX | ✅ Listo | 5 | Botones de Tema ☀️/🌙, Vista PC 💻 y marco de Celular interactivo 📱. |

---

## 🚀 4. Puesta en Marcha Rápida (Ejecución)

### 🌟 Opción 1: Inicio en 2 Terminales

#### 📌 Terminal 1 — Backend (FastAPI + SQLite):
```bash
cd backend
python main.py
```
> Servidor disponible en: `http://localhost:5000` (Documentación Swagger: `http://localhost:5000/docs`).

#### 📌 Terminal 2 — Frontend (React + Vite):
```bash
cd frontend
npm run dev
```
> Aplicación web disponible en: `http://localhost:5173`.

---

## 🔑 5. Credenciales de Acceso para la Sustentación

| Rol | Correo Electrónico | Contraseña | Permisos y Alcance |
|---|---|---|---|
| 👑 **Administrador** | `admin@futbolzone.com` | `admin123` | Control total: Dashboard Admin, Canchas, Reservas, Personal y Reportes Excel. |
| 👤 **Cliente** | `cliente@futbolzone.com` | `cliente123` | Dashboard Cliente: Ver Mis Reservas, Reservar Canchas y Cancelar turnos. |
| 👤 **Usuario Nicolás (Personal)** | `nicolasfelipepazortiz@gmail.com` | `admin123` | Cuenta vinculada para pruebas de recuperación de contraseña vía Gmail real. |

---

## 📧 6. Configuración del Servicio de Correo Real (Gmail SMTP)

El sistema cuenta con envío de correos 100% reales configurado en [`backend/.env`](file:///c:/Users/SENA/Documents/NicolasPaz/FutbolZone-ADSO/backend/.env):
- **Servidor SMTP:** `smtp.gmail.com` (Puerto 587 con STARTTLS).
- **Remitente:** `nicolasfelipepazortiz@gmail.com`.
- **Plantilla:** HTML responsivo con diseño corporativo de FutbolZone y código PIN de 6 dígitos.

---
*FutbolZone — Proyecto Formativo SENA ADSO III Trimestre — 2026.*
