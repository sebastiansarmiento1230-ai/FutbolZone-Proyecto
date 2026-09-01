# 📊 INFORME DE JUSTIFICACIÓN DE AVANCE DEL PROYECTO: 75%
## **Proyecto:** FutbolZone — Plataforma de Gestión y Reserva de Canchas Sintéticas
**Programa:** Análisis y Desarrollo de Software (ADSO) — SENA  
**Fase:** Trimestre III — Desarrollo del MVP (Producto Mínimo Viable)  
**Fecha:** Septiembre 2026  

---

## 🎯 RESUMEN EJECUTIVO: ¿POR QUÉ EL PROYECTO ESTÁ EN UN 75%?

En la metodología de desarrollo de software ágil (Scrum) y según los estándares formativos del SENA ADSO, **el 75% representa la culminación exitosa de la Fase de Desarrollo del Core Operativo (MVP Funcional)**.

Esto significa que el sistema **ya es 100% utilizable, funcional y probado de extremo a extremo** para los procesos de negocio reales (reservar, registrar, autenticar, gestionar canchas, enviar correos y administrar personal), mientras que el **25% restante** corresponde a la fase de **Despliegue en la Nube, Pasarela de Pagos en Producción y Funcionalidades Avanzadas de Torneos** programadas para la entrega final.

---

## 🧩 1. DESGLOSE DEL 75% DESARROLLADO (FASE ACTUAL — IMPLEMENTADO Y PROBADO)

```
╔══════════════════════════════════════════════════════════════════════╦══════════════╦════════════╗
║ Módulo del Sistema                                                  ║ Ponderación  ║ Estado     ║
╠══════════════════════════════════════════════════════════════════════╬══════════════╬════════════╣
║ 1. Autenticación, Seguridad JWT y Recuperación Gmail SMTP            ║     15%      ║  100% 🟢   ║
║ 2. Catálogo de Canchas, Filtros y Disponibilidad en Tiempo Real      ║     15%      ║  100% 🟢   ║
║ 3. Motor de Reservas y Control de No Solapamiento                    ║     15%      ║  100% 🟢   ║
║ 4. Panel Administrativo, Personal (Empleados) y Reportes Excel       ║     15%      ║  100% 🟢   ║
║ 5. UI/UX: Modo Oscuro/Claro, Dock 3 Botones y Simulación Celular     ║     15%      ║  100% 🟢   ║
╠══════════════════════════════════════════════════════════════════════╬══════════════╬════════════╣
║ 🚀 SUBTOTAL AVANCE FUNCIONAL OPERATIVO ENTREGADO                     ║     75%      ║  100% 🟢   ║
╚══════════════════════════════════════════════════════════════════════╩══════════════╩════════════╝
```

### ✅ Justificación Técnica de lo Entregado (75%):
1. **Seguridad y Control de Acceso (15%):**
   - Registro de usuarios con validaciones estrictas y contraseñas hasheadas en Bcrypt.
   - Autenticación mediante tokens JWT (JSON Web Tokens) con expiración y roles RBAC (`admin` / `cliente`).
   - Recuperación de contraseña real mediante PIN de 6 dígitos despachado vía **Gmail SMTP TLS 587** con plantilla HTML corporativa.
2. **Gestión de Canchas y Horarios (15%):**
   - Catálogo interactivo con filtrado rápido por categoría (*Fútbol 5, 7 y 11*).
   - Consulta de disponibilidad en tiempo real conectada a la base de datos para evitar colisiones.
   - CRUD completo para administradores (crear, editar tarifas, desactivar por mantenimiento).
3. **Agendamiento y Reservas (15%):**
   - Agendamiento de partidos con validación relacional contra solapamientos de turnos.
   - Cálculo automático de tarifas en pesos colombianos ($ COP).
   - Panel de "Mis Reservas" con historial y cancelación en tiempo real.
4. **Administración y Control de Personal (15%):**
   - Dashboard centralizado con KPIs financieros e indicadores de ocupación.
   - Gestión de empleados y staff de la sede con cargos específicos.
   - Exportación de bases de datos y reportes a hojas de cálculo Excel.
5. **Experiencia de Usuario y Accesibilidad (15%):**
   - Dock flotante lateral centrado a la derecha con conmutador de **Modo Oscuro / Modo Claro**.
   - Simulación interactiva de smartphone con dynamic island para pruebas de responsividad.
   - Calificaciones con estrellas, reseñas y tablón de retos comunitarios.

---

## 🔮 2. DESGLOSE DEL 25% RESTANTE (ROADMAP — FASE FINAL / TRIMESTRE IV)

El 25% restante no afecta el funcionamiento básico del sistema, sino que comprende las **integraciones de producción y escalabilidad empresarial**:

```
╔══════════════════════════════════════════════════════════════════════╦══════════════╦════════════╗
║ Funcionalidad Futura (Roadmap Trimestre IV)                          ║ Ponderación  ║ Estado     ║
╠══════════════════════════════════════════════════════════════════════╬══════════════╬════════════╣
║ A. Pasarela de Pagos Online en Producción (PSE / Wompi / PayU)       ║     10%      ║  Planificado║
║ B. Despliegue en la Nube (AWS / Render / Vercel) y CI/CD             ║      8%      ║  Planificado║
║ C. Comprobante PDF Descargable con Código QR de Acceso Dinámico      ║      4%      ║  Planificado║
║ D. Cuadro de Llaves / Eliminatorias Automáticas en Torneos (Brackets)║      3%      ║  Planificado║
╠══════════════════════════════════════════════════════════════════════╬══════════════╬════════════╣
║ 🎯 TOTAL GENERAL DEL PROYECTO A TÉRMINO (Fase Final)                 ║     100%     ║  En curso  ║
╚══════════════════════════════════════════════════════════════════════╩══════════════╩════════════╝
```

---

## 🗣️ GUÍA DE RESPUESTA PARA LA SUSTENTACIÓN ANTE EL INSTRUCTOR:

> *"Instructor, actualmente el proyecto se encuentra en un **75% de avance global**.  
> Este 75% corresponde a la **fase completa del MVP (Producto Mínimo Viable)**: contamos con el backend en FastAPI y SQLite totalmente funcional, autenticación JWT, envío real de correos con Gmail SMTP, catálogo y agendamiento de canchas sin solapamientos, panel administrativo con métricas y exportación a Excel, y un frontend responsivo con simulación móvil y modo oscuro.  
> El 25% restante comprende la integración con pasarelas de pago bancarias en vivo (PSE/Wompi), generación de tiquetes QR en PDF y el despliegue final en servidores cloud en la siguiente fase formativa."*

---
*Documento elaborado para sustentación de proyecto formativo SENA ADSO III — 2026.*
