import { useState, useEffect } from "react";
import "./Canchas.css";
import { api } from "../services/api";
import ResenasModal from "./ResenasModal";
import Icons from "./Icons";

interface CanchasProps {
  onSelectCancha: (cancha: any) => void;
}

function Canchas({ onSelectCancha }: CanchasProps) {
  const [canchas, setCanchas] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [canchaParaResenas, setCanchaParaResenas] = useState<any | null>(null);

  useEffect(() => {
    cargarCanchas();
  }, []);

  const obtenerImagenCancha = (nombre: string, tipo: string): string => {
    const texto = (nombre + " " + tipo).toLowerCase();
    if (texto.includes("5")) {
      return "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80";
    }
    if (texto.includes("7")) {
      return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80";
    }
    if (texto.includes("11")) {
      return "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80";
    }
    return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
  };

  const cargarCanchas = async () => {
    setCargando(true);
    try {
      const res = await api.obtenerCanchas(false);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapa = new Map();
        res.data.forEach((c: any) => {
          const clave = c.id || c.nombre;
          if (!mapa.has(clave)) {
            mapa.set(clave, c);
          }
        });
        setCanchas(Array.from(mapa.values()));
      } else {
        setCanchas([
          { id: 1, nombre: "Cancha Fútbol 5", tipo: "Fútbol 5", descripcion: "Ideal para partidos rápidos y divertidos entre amigos.", precio_hora: 50000, capacidad: 10, activa: true, rating: 4.9, resenas: 38 },
          { id: 2, nombre: "Cancha Fútbol 7", tipo: "Fútbol 7", descripcion: "Para un juego más táctico y dinámico con más jugadores.", precio_hora: 70000, capacidad: 14, activa: true, rating: 4.8, resenas: 29 },
          { id: 3, nombre: "Cancha Fútbol 11", tipo: "Fútbol 11", descripcion: "La experiencia completa del fútbol profesional.", precio_hora: 100000, capacidad: 22, activa: true, rating: 5.0, resenas: 45 },
        ]);
      }
    } catch {
      setCanchas([
        { id: 1, nombre: "Cancha Fútbol 5", tipo: "Fútbol 5", descripcion: "Ideal para partidos rápidos y divertidos entre amigos.", precio_hora: 50000, capacidad: 10, activa: true, rating: 4.9, resenas: 38 },
        { id: 2, nombre: "Cancha Fútbol 7", tipo: "Fútbol 7", descripcion: "Para un juego más táctico y dinámico con más jugadores.", precio_hora: 70000, capacidad: 14, activa: true, rating: 4.8, resenas: 29 },
        { id: 3, nombre: "Cancha Fútbol 11", tipo: "Fútbol 11", descripcion: "La experiencia completa del fútbol profesional.", precio_hora: 100000, capacidad: 22, activa: true, rating: 5.0, resenas: 45 },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const canchasFiltradas = canchas.filter((c) => {
    if (filtroCategoria === "todas") return true;
    const texto = (c.nombre + " " + c.tipo).toLowerCase();
    if (filtroCategoria === "f5") return texto.includes("5");
    if (filtroCategoria === "f7") return texto.includes("7");
    if (filtroCategoria === "f11") return texto.includes("11");
    return true;
  });

  return (
    <section id="canchas" className="canchas-container">
      <div className="canchas-header">
        <h2>Nuestras Canchas Sintéticas</h2>
        <p>Selecciona una cancha para acceder a su página de reserva</p>

        {/* BARRA DE FILTRADO RÁPIDO */}
        <div className="canchas-filter-bar">
          <button
            className={`btn-filter-pill ${filtroCategoria === "todas" ? "active" : ""}`}
            onClick={() => setFiltroCategoria("todas")}
          >
            Todas las Canchas
          </button>
          <button
            className={`btn-filter-pill ${filtroCategoria === "f5" ? "active" : ""}`}
            onClick={() => setFiltroCategoria("f5")}
          >
            Fútbol 5
          </button>
          <button
            className={`btn-filter-pill ${filtroCategoria === "f7" ? "active" : ""}`}
            onClick={() => setFiltroCategoria("f7")}
          >
            Fútbol 7
          </button>
          <button
            className={`btn-filter-pill ${filtroCategoria === "f11" ? "active" : ""}`}
            onClick={() => setFiltroCategoria("f11")}
          >
            Fútbol 11
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="canchas-loading">Cargando canchas disponibles...</div>
      ) : (
        <div className="canchas-grid">
          {canchasFiltradas.map((cancha) => {
            const imgUrl = obtenerImagenCancha(cancha.nombre, cancha.tipo);
            const ratingVal = cancha.rating || 4.9;
            const resenasCount = cancha.resenas || 32;

            return (
              <div className="cancha-card" key={cancha.id || cancha.nombre}>
                <div className="cancha-card-image-container">
                  <img src={imgUrl} alt={cancha.nombre} className="cancha-card-img" />
                  <span className="cancha-card-badge">{cancha.tipo || "Fútbol"}</span>
                </div>

                <div className="cancha-card-body">
                  <h3>{cancha.nombre}</h3>

                  <button
                    type="button"
                    className="cancha-rating-box"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setCanchaParaResenas(cancha)}
                    title="Ver opiniones y calificaciones"
                  >
                    <span className="stars-text" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontWeight: 700 }}>
                      <Icons.Star size={14} color="#f59e0b" /> {ratingVal}
                    </span>
                    <span className="resenas-text" style={{ textDecoration: "underline", color: "#059669", fontSize: "12px", fontWeight: 700 }}>
                      ({resenasCount} opiniones)
                    </span>
                  </button>

                  <p className="cancha-descripcion">{cancha.descripcion}</p>
                </div>

                <div className="cancha-card-footer">
                  <button
                    onClick={() => onSelectCancha(cancha)}
                    className="btn-seleccionar-cancha"
                    disabled={cancha.activa === false}
                  >
                    {cancha.activa !== false ? "Reservar Turno" : "Mantenimiento"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Reseñas */}
      {canchaParaResenas && (
        <ResenasModal
          cancha={canchaParaResenas}
          onClose={() => setCanchaParaResenas(null)}
          onResenaAgregada={() => cargarCanchas()}
        />
      )}
    </section>
  );
}

export default Canchas;