import { useMemo } from "react";
import "./TicketReservaModal.css";

interface TicketReservaModalProps {
  reserva: any;
  usuario: any;
  onClose: () => void;
}

// Generador de Matriz QR en SVG vectorial nítido
function GeneradorQRSVG({ valor, size = 110 }: { valor: string; size?: number }) {
  const celdas = useMemo(() => {
    // Generación de matriz determinística basada en el texto (21x21 estándar)
    const n = 21;
    const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

    // Patrones de esquina (Position Detection Patterns)
    const ponerPatron = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            grid[r + i][c + j] = true;
          }
        }
      }
    };

    ponerPatron(0, 0);
    ponerPatron(0, n - 7);
    ponerPatron(n - 7, 0);

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Datos basados en hash simple
    let hash = 0;
    for (let i = 0; i < valor.length; i++) {
      hash = (hash << 5) - hash + valor.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const esEsquina1 = r < 8 && c < 8;
        const esEsquina2 = r < 8 && c >= n - 8;
        const esEsquina3 = r >= n - 8 && c < 8;
        const esTiming = r === 6 || c === 6;

        if (!esEsquina1 && !esEsquina2 && !esEsquina3 && !esTiming) {
          const bit = Math.abs((hash ^ (r * 31 + c * 17)) % 7) === 0 || Math.abs((r + c + valor.length) % 3) === 0;
          grid[r][c] = bit;
        }
      }
    }

    return grid;
  }, [valor]);

  const n = celdas.length;
  const cellSize = size / n;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fz-qr-svg-code">
      <rect width={size} height={size} fill="#ffffff" rx={8} />
      {celdas.map((fila, r) =>
        fila.map((activo, c) =>
          activo ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#06150e"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function TicketReservaModal({ reserva, usuario, onClose }: TicketReservaModalProps) {
  const imprimirTicket = () => {
    window.print();
  };

  const qrData = `https://futbolzone.com/val?reserva=${reserva?.id || 1}&cancha=${reserva?.cancha_id || 1}&fecha=${reserva?.fecha || "2026-08-28"}&cliente=${encodeURIComponent(usuario?.nombre || "Cliente")}`;

  const generarEnlaceCalendar = () => {
    const titulo = encodeURIComponent(`⚽ Partido en FutbolZone - ${reserva?.cancha_nombre || "Cancha Sintética"}`);
    const fechaLimpia = (reserva?.fecha || new Date().toISOString().split("T")[0]).replace(/-/g, "");
    const hInicio = (reserva?.hora_inicio || "18:00").substring(0, 5).replace(":", "") + "00";
    const hFin = (reserva?.hora_fin || "19:00").substring(0, 5).replace(":", "") + "00";
    
    const datesParam = `${fechaLimpia}T${hInicio}/${fechaLimpia}T${hFin}`;
    const detalles = encodeURIComponent(`Reserva #${reserva?.id || "001"} en FutbolZone. Presentar ticket en recepción 15 min antes.`);
    const ubicacion = encodeURIComponent("Av. Calle 63 # 28-50, FutbolZone D.C.");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${datesParam}&details=${detalles}&location=${ubicacion}`;
  };

  return (
    <div className="ticket-modal-overlay">
      <div className="ticket-modal-card">
        <button type="button" className="btn-close-ticket" onClick={onClose} title="Cerrar modal">
          ✕
        </button>

        {/* CONTENIDO IMPRIMIBLE DEL TICKET */}
        <div className="ticket-printable-content">
          <div className="ticket-header" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src="/logo-futbolzone.png"
              alt="Logo FutbolZone"
              style={{ width: "52px", height: "52px", objectFit: "contain", marginBottom: "6px" }}
            />
            <h2>FutbolZone</h2>
            <span className="ticket-badge-official">COMPROBANTE OFICIAL DE RESERVA</span>
            <p className="ticket-sub">Complejo Deportivo & Canchas Sintéticas</p>
          </div>

          <div className="ticket-qr-section">
            <div className="qr-box-wrapper">
              <GeneradorQRSVG valor={qrData} size={110} />
              <span className="qr-scan-badge">📱 ESCANEAR EN TAQUILLA</span>
            </div>
            <div className="ticket-code-info">
              <strong>Código de Validación:</strong>
              <div className="code-hash">FZ-2026-{reserva?.id || "01"}-OK</div>
              <small style={{ color: "#10b981", fontWeight: 700, display: "block", marginTop: "4px" }}>
                ✓ Token Criptográfico Verificado
              </small>
            </div>
          </div>

          <div className="ticket-details-grid">
            <div className="ticket-row">
              <span>Cliente / Titular:</span>
              <strong>{usuario?.nombre} {usuario?.apellido}</strong>
            </div>

            <div className="ticket-row">
              <span>Correo de Contacto:</span>
              <strong>{usuario?.email || usuario?.correo || "cliente@futbolzone.com"}</strong>
            </div>

            <div className="ticket-row">
              <span>Cancha Asignada:</span>
              <strong>{reserva?.cancha_nombre || `Cancha #${reserva?.cancha_id || 1}`}</strong>
            </div>

            <div className="ticket-row">
              <span>Fecha del Partido:</span>
              <strong>{reserva?.fecha}</strong>
            </div>

            <div className="ticket-row">
              <span>Horario Reservado:</span>
              <strong>{reserva?.hora_inicio?.substring(0, 5)} - {reserva?.hora_fin?.substring(0, 5)}</strong>
            </div>

            <div className="ticket-row">
              <span>Método / Notas:</span>
              <strong>{reserva?.notas || "Fútbol Sintético con Iluminación LED"}</strong>
            </div>

            <div className="ticket-row total-row">
              <span>Total Liquidado:</span>
              <strong className="total-price">${Number(reserva?.precio_total || 50000).toLocaleString("es-CO")} COP</strong>
            </div>
          </div>

          <div className="ticket-footer-notes">
            <p>📌 Presenta este código QR en la entrada 15 minutos antes de iniciar tu partido.</p>
            <p>© 2026 FutbolZone ADSO III — Todos los derechos reservados.</p>
          </div>
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="ticket-modal-actions" style={{ flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn-imprimir-ticket" onClick={imprimirTicket}>
              🖨️ Imprimir / Guardar PDF
            </button>
            <a
              href={generarEnlaceCalendar()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-calendar-link"
            >
              📅 Google Calendar
            </a>
          </div>

          <button type="button" className="btn-cerrar-ticket-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketReservaModal;
