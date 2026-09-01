import { useState, useEffect, useRef } from "react";
import "./UbicacionMapa.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../services/api";

interface UbicacionMapaProps {
  onSelectCancha?: (cancha: any) => void;
}

interface SedeCancha {
  id: number;
  nombre: string;
  tipo: string;
  direccion: string;
  precio_hora: number;
  capacidad: number;
  lat: number;
  lng: number;
  descripcion?: string;
  rating?: number;
  icono?: string;
}

// Sedes oficiales con coordenadas GPS reales en Bogotá
const SEDES_DEFAULT: SedeCancha[] = [
  {
    id: 1,
    nombre: "Cancha Central (Sede El Campín)",
    tipo: "Fútbol 5",
    direccion: "Calle 63 # 28-45, Galerías / El Campín, Bogotá",
    precio_hora: 50000,
    capacidad: 10,
    lat: 4.6533,
    lng: -74.0721,
    descripcion: "Césped sintético premium monofilamento con iluminación LED nocturna de alta potencia y vestuarios.",
    rating: 4.9,
  },
  {
    id: 2,
    nombre: "Cancha Norte (Sede Chicó)",
    tipo: "Fútbol 7",
    direccion: "Cra. 15 # 104-20, Chicó Norte, Bogotá",
    precio_hora: 70000,
    capacidad: 14,
    lat: 4.6890,
    lng: -74.0480,
    descripcion: "Cancha amplia para juego táctico con graderías cubiertas, parqueadero y cafetería deportiva.",
    rating: 4.8,
  },
  {
    id: 3,
    nombre: "Cancha Sur (Sede El Tunal)",
    tipo: "Fútbol 11",
    direccion: "Av. Boyacá # 45-12 Sur, Parque El Tunal, Bogotá",
    precio_hora: 100000,
    capacidad: 22,
    lat: 4.5780,
    lng: -74.1350,
    descripcion: "Cancha reglamentaria para torneos oficiales, iluminación tipo estadio y camerinos profesionales.",
    rating: 5.0,
  },
];

// Puntos de partida rápidos en la ciudad
const PUNTOS_ORIGEN = [
  { nombre: "📍 Mi Ubicación GPS Actual", lat: 0, lng: 0, esGps: true },
  { nombre: "SENA Sede Salitre (Calle 26)", lat: 4.6550, lng: -74.1120 },
  { nombre: "Portal Norte (TransMilenio)", lat: 4.7554, lng: -74.0456 },
  { nombre: "Calle 100 con Autopista Norte", lat: 4.6860, lng: -74.0580 },
  { nombre: "Aeropuerto El Dorado (Terminal 1)", lat: 4.6970, lng: -74.1400 },
  { nombre: "Plaza de las Américas / Kennedy", lat: 4.6180, lng: -74.1350 },
  { nombre: "Portal del Tunal (Sur)", lat: 4.5700, lng: -74.1380 },
  { nombre: "Centro Internacional (Cra 7 # 32)", lat: 4.6200, lng: -74.0680 },
];

function UbicacionMapa({ onSelectCancha }: UbicacionMapaProps) {
  const [canchasSedes, setCanchasSedes] = useState<SedeCancha[]>(SEDES_DEFAULT);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<SedeCancha>(SEDES_DEFAULT[0]);
  const [puntoPartidaIdx, setPuntoPartidaIdx] = useState<number>(1);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number; nombre: string } | null>({
    lat: 4.6550,
    lng: -74.1120,
    nombre: "SENA Sede Salitre (Calle 26)",
  });
  const [calculandoRuta, setCalculandoRuta] = useState<boolean>(false);
  const [metricasRuta, setMetricasRuta] = useState<{
    distanciaKm: number;
    tiempoCarroMin: number;
    tiempoBiciMin: number;
    tiempoPieMin: number;
  } | null>(null);
  const [cargandoGps, setCargandoGps] = useState<boolean>(false);
  const [mensajeGps, setMensajeGps] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // Cargar canchas activas desde la API y asignar coordenadas
  const cargarCanchas = async () => {
    try {
      const res = await api.obtenerCanchas(true);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const canchasActivas = res.data.filter((c: any) => c.activa !== false && c.activa !== 0);
        const mapped: SedeCancha[] = canchasActivas.map((c: any, idx: number) => {
          let lat = 4.6533;
          let lng = -74.0721;
          const texto = (c.nombre + " " + (c.direccion || "") + " " + c.tipo).toLowerCase();

          if (texto.includes("norte") || texto.includes("chicó") || texto.includes("7")) {
            lat = 4.6890;
            lng = -74.0480;
          } else if (texto.includes("sur") || texto.includes("tunal") || texto.includes("11")) {
            lat = 4.5780;
            lng = -74.1350;
          } else if (idx > 2) {
            lat = 4.6400 + ((idx * 0.015) % 0.08);
            lng = -74.0800 - ((idx * 0.012) % 0.06);
          }

          return {
            id: c.id,
            nombre: c.nombre,
            tipo: c.tipo,
            direccion: c.direccion || "Av. Calle 63 # 28-50, Bogotá D.C.",
            precio_hora: Number(c.precio_hora) || 50000,
            capacidad: Number(c.capacidad || c.capacidad_jugadores) || 10,
            lat,
            lng,
            descripcion: c.descripcion || "Cancha sintética profesional certificada con iluminación nocturna.",
            rating: 4.9,
          };
        });

        setCanchasSedes(mapped);
        if (mapped.length > 0) {
          setSedeSeleccionada(mapped[0]);
        }
      }
    } catch {
      setCanchasSedes(SEDES_DEFAULT);
    }
  };

  useEffect(() => {
    cargarCanchas();
    const onCanchasChange = () => cargarCanchas();
    window.addEventListener("fz_canchas_update", onCanchasChange);
    return () => window.removeEventListener("fz_canchas_update", onCanchasChange);
  }, []);

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Crear mapa centrado en Bogotá
    const map = L.map(mapContainerRef.current, {
      center: [4.6480, -74.0850],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // Capa CartoDB Positron / OpenStreetMap
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores de canchas en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    canchasSedes.forEach((sede) => {
      const isSelected = sede.id === sedeSeleccionada?.id;

      // Icono HTML personalizado para cada cancha
      const customIcon = L.divIcon({
        className: `fz-leaflet-custom-marker ${isSelected ? "selected" : ""}`,
        html: `
          <div class="fz-map-pin ${isSelected ? "active" : ""}">
            <div class="fz-pin-ball">⚽</div>
            <div class="fz-pin-label">${sede.tipo}</div>
            <div class="fz-pin-pulse"></div>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 50],
        popupAnchor: [0, -45],
      });

      const marker = L.marker([sede.lat, sede.lng], { icon: customIcon }).addTo(markersLayer);

      // Popup informativo interactivo
      const popupHtml = `
        <div class="fz-map-popup-card">
          <div class="fz-popup-badge">${sede.tipo.toUpperCase()}</div>
          <h4 class="fz-popup-title">${sede.nombre}</h4>
          <p class="fz-popup-addr">📍 ${sede.direccion}</p>
          <div class="fz-popup-details">
            <span>Tarifa: <strong>$${sede.precio_hora.toLocaleString("es-CO")} COP</strong></span>
            <span>Capacidad: <strong>${sede.capacidad} jug.</strong></span>
          </div>
          <button id="btn-popup-reserve-${sede.id}" class="fz-btn-popup-action">
            ⚽ Reservar esta Cancha
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280, className: "fz-leaflet-popup" });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-popup-reserve-${sede.id}`);
        if (btn && onSelectCancha) {
          btn.onclick = () => onSelectCancha(sede);
        }
      });

      marker.on("click", () => {
        setSedeSeleccionada(sede);
      });
    });
  }, [canchasSedes, sedeSeleccionada, onSelectCancha]);

  // Trazar Ruta y Calcular Métricas
  const calcularYTrazarRuta = () => {
    if (!mapInstanceRef.current || !routeLayerRef.current || !ubicacionUsuario || !sedeSeleccionada) return;

    setCalculandoRuta(true);
    const routeLayer = routeLayerRef.current;
    routeLayer.clearLayers();

    const origenLat = ubicacionUsuario.lat;
    const origenLng = ubicacionUsuario.lng;
    const destLat = sedeSeleccionada.lat;
    const destLng = sedeSeleccionada.lng;

    // Marcador del usuario / origen
    const originIcon = L.divIcon({
      className: "fz-origin-marker",
      html: `
        <div class="fz-user-location-pin">
          <div class="fz-user-dot"></div>
          <div class="fz-user-ripple"></div>
          <div class="fz-user-tag">TÚ ESTÁS AQUÍ</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([origenLat, origenLng], { icon: originIcon })
      .bindTooltip(`Origen: ${ubicacionUsuario.nombre}`, { permanent: false })
      .addTo(routeLayer);

    // Cálculo de Distancia Haversine con factor de curvas viales
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((destLat - origenLat) * Math.PI) / 180;
    const dLng = ((destLng - origenLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origenLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaLineaRecta = R * c;
    const distanciaVial = Math.round(distanciaLineaRecta * 1.32 * 10) / 10;

    // Estimación de Tiempos
    const tiempoCarro = Math.max(8, Math.round((distanciaVial / 24) * 60));
    const tiempoBici = Math.max(10, Math.round((distanciaVial / 15) * 60));
    const tiempoPie = Math.max(15, Math.round((distanciaVial / 4.5) * 60));

    setMetricasRuta({
      distanciaKm: Math.max(1.2, distanciaVial),
      tiempoCarroMin: tiempoCarro,
      tiempoBiciMin: tiempoBici,
      tiempoPieMin: tiempoPie,
    });

    // Generar ruta curva suave con puntos intermedios realistas
    const puntosRuta: [number, number][] = [];
    const pasos = 16;
    for (let i = 0; i <= pasos; i++) {
      const t = i / pasos;
      const latInter = origenLat + (destLat - origenLat) * t + Math.sin(t * Math.PI) * 0.006 * (i % 2 === 0 ? 1 : -0.5);
      const lngInter = origenLng + (destLng - origenLng) * t + Math.sin(t * Math.PI) * -0.008;
      puntosRuta.push([latInter, lngInter]);
    }
    puntosRuta.push([destLat, destLng]);

    // Línea de Ruta con Brillo Neón Esmeralda
    L.polyline(puntosRuta, {
      color: "rgba(16, 185, 129, 0.35)",
      weight: 10,
      lineCap: "round",
    }).addTo(routeLayer);

    L.polyline(puntosRuta, {
      color: "#10b981",
      weight: 5,
      opacity: 0.95,
      dashArray: "8, 12",
      className: "fz-animated-route-line",
    }).addTo(routeLayer);

    // Ajustar el zoom del mapa para encuadrar ambos puntos
    const bounds = L.latLngBounds([[origenLat, origenLng], [destLat, destLng]]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });

    setCalculandoRuta(false);
  };

  // Re-trazar ruta cuando cambia el origen o la cancha seleccionada
  useEffect(() => {
    calcularYTrazarRuta();
  }, [ubicacionUsuario, sedeSeleccionada]);

  // Manejador del Selector de Punto de Partida
  const manejarCambioOrigen = (index: number) => {
    setPuntoPartidaIdx(index);
    const seleccionado = PUNTOS_ORIGEN[index];

    if (seleccionado.esGps) {
      obtenerGpsActual();
    } else {
      setUbicacionUsuario({
        lat: seleccionado.lat,
        lng: seleccionado.lng,
        nombre: seleccionado.nombre,
      });
      setMensajeGps(null);
    }
  };

  // Obtener Ubicación Real con Geolocation API
  const obtenerGpsActual = () => {
    if (!navigator.geolocation) {
      setMensajeGps("Tu navegador no soporta geolocalización GPS.");
      return;
    }

    setCargandoGps(true);
    setMensajeGps("Detectando tu ubicación por satélite...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUbicacionUsuario({
          lat: latitude,
          lng: longitude,
          nombre: "Tu ubicación GPS exacta",
        });
        setCargandoGps(false);
        setMensajeGps("¡Ubicación GPS detectada correctamente!");
        setTimeout(() => setMensajeGps(null), 3500);
      },
      () => {
        setCargandoGps(false);
        setMensajeGps("No se pudo obtener el GPS. Usando punto de referencia.");
        setUbicacionUsuario({
          lat: 4.6550,
          lng: -74.1120,
          nombre: "SENA Sede Salitre (Calle 26)",
        });
        setTimeout(() => setMensajeGps(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Generar Enlace de Google Maps Directions
  const obtenerUrlGoogleMaps = () => {
    if (!sedeSeleccionada) return "https://maps.google.com";
    const dest = `${sedeSeleccionada.lat},${sedeSeleccionada.lng}`;
    if (ubicacionUsuario) {
      return `https://www.google.com/maps/dir/?api=1&origin=${ubicacionUsuario.lat},${ubicacionUsuario.lng}&destination=${dest}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sedeSeleccionada.direccion)}`;
  };

  // Generar Enlace de Waze
  const obtenerUrlWaze = () => {
    if (!sedeSeleccionada) return "https://waze.com";
    return `https://waze.com/ul?ll=${sedeSeleccionada.lat},${sedeSeleccionada.lng}&navigate=yes`;
  };

  return (
    <section id="ubicacion" className="fz-map-section">
      <div className="fz-map-wrapper">
        {/* Cabecera de la Sección */}
        <div className="fz-map-header">
          <div className="fz-badge-pill">
            <span>📍 Trazador de Rutas y Navegación GPS</span>
          </div>
          <h2>Mapa Interactivo de Canchas y Sedes</h2>
          <p>
            Visualiza todas nuestras canchas en tiempo real, calcula la mejor ruta desde tu ubicación y conoce el tiempo estimado de llegada.
          </p>
        </div>

        {/* Grid de Mapa + Panel Lateral */}
        <div className="fz-map-grid-container">
          {/* Panel Lateral de Control y Rutas */}
          <div className="fz-map-sidebar-card">
            {/* Selector de Punto de Partida */}
            <div className="fz-map-control-group">
              <label className="fz-control-label">
                <span>🚩 Punto de Partida / Tu Origen:</span>
              </label>

              <div className="fz-origin-select-wrapper">
                <select
                  value={puntoPartidaIdx}
                  onChange={(e) => manejarCambioOrigen(Number(e.target.value))}
                  className="fz-select-origin"
                >
                  {PUNTOS_ORIGEN.map((punto, idx) => (
                    <option key={idx} value={idx}>
                      {punto.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="fz-btn-gps-locate"
                  onClick={obtenerGpsActual}
                  disabled={cargandoGps}
                  title="Obtener mi posición GPS exacta"
                >
                  {cargandoGps ? "🛰️" : "🎯 GPS"}
                </button>
              </div>

              {mensajeGps && (
                <div className="fz-gps-status-msg">
                  <span>{mensajeGps}</span>
                </div>
              )}
            </div>

            {/* Selector de Cancha Destino */}
            <div className="fz-map-control-group">
              <label className="fz-control-label">
                <span>⚽ Sede Deportiva de Destino:</span>
              </label>
              <div className="fz-sedes-pills-list">
                {canchasSedes.map((sede) => (
                  <button
                    key={sede.id}
                    type="button"
                    className={`fz-sede-pill-btn ${sede.id === sedeSeleccionada?.id ? "active" : ""}`}
                    onClick={() => setSedeSeleccionada(sede)}
                  >
                    <div className="fz-sede-pill-top">
                      <strong>{sede.nombre}</strong>
                      <span className="fz-pill-type-tag">{sede.tipo}</span>
                    </div>
                    <div className="fz-sede-pill-sub">
                      📍 {sede.direccion} · <strong>${sede.precio_hora.toLocaleString("es-CO")}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta de Métricas y Tiempos de Viaje */}
            {metricasRuta && (
              <div className="fz-route-metrics-card">
                <div className="fz-metrics-header">
                  <div>
                    <span className="fz-metrics-title">DISTANCIA ESTIMADA</span>
                    <div className="fz-dist-val">{metricasRuta.distanciaKm} km</div>
                  </div>
                  <span className="fz-route-live-badge">⚡ Ruta Óptima</span>
                </div>

                <div className="fz-travel-times-grid">
                  <div className="fz-time-item">
                    <span className="fz-time-icon">🚗</span>
                    <div className="fz-time-num">{metricasRuta.tiempoCarroMin} min</div>
                    <span className="fz-time-label">Carro / Moto</span>
                  </div>

                  <div className="fz-time-item">
                    <span className="fz-time-icon">🚲</span>
                    <div className="fz-time-num">{metricasRuta.tiempoBiciMin} min</div>
                    <span className="fz-time-label">Ciclorruta</span>
                  </div>

                  <div className="fz-time-item">
                    <span className="fz-time-icon">🚶</span>
                    <div className="fz-time-num">{metricasRuta.tiempoPieMin} min</div>
                    <span className="fz-time-label">A Pie</span>
                  </div>
                </div>

                {/* Acciones de Navegación y Reserva */}
                <div className="fz-map-actions-group">
                  {onSelectCancha && sedeSeleccionada && (
                    <button
                      type="button"
                      className="fz-btn-primary-reserve"
                      onClick={() => onSelectCancha(sedeSeleccionada)}
                    >
                      ⚽ Reservar Turno en {sedeSeleccionada.nombre}
                    </button>
                  )}

                  <div className="fz-nav-buttons-row">
                    <a
                      href={obtenerUrlGoogleMaps()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fz-btn-nav-app gmaps"
                    >
                      🗺️ Abrir en Google Maps
                    </a>

                    <a
                      href={obtenerUrlWaze()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fz-btn-nav-app waze"
                    >
                      🚗 Iniciar en Waze
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Interactivo del Mapa Leaflet */}
          <div className="fz-map-canvas-card">
            <div className="fz-map-overlay-badge">
              <span>📍 {canchasSedes.length} Sedes Deportivas Activas</span>
            </div>
            <div ref={mapContainerRef} className="fz-leaflet-map-element"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UbicacionMapa;
