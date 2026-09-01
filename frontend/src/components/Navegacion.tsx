import "./Navegacion.css";

interface NavegacionProps {
  usuario?: any;
  onNavigateToDashboard?: () => void;
}

function Navegacion({ usuario, onNavigateToDashboard }: NavegacionProps) {
  return (
    <nav className="navegacion">
      <ul>
        <li>
          <a href="#inicio" className="nav-link">Inicio</a>
        </li>
        <li>
          <a href="#canchas" className="nav-link">Canchas</a>
        </li>
        <li>
          <a href="#caracteristicas" className="nav-link">Innovación & Software</a>
        </li>
        <li>
          <a href="#beneficios" className="nav-link">Beneficios</a>
        </li>
        <li>
          <a href="#ubicacion" className="nav-link">Ubicación</a>
        </li>
        {usuario && onNavigateToDashboard && (
          <li className="nav-dashboard-item">
            <button className="nav-dashboard-btn" onClick={onNavigateToDashboard}>
              {usuario.rol === "admin" ? "Panel Administrador" : "Mi Panel"}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navegacion;