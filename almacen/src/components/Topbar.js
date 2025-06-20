/**
 * Topbar - Barra superior de navegación y acciones.
 *
 * @param {Object} props
 * @param {string} props.logo - Logo de la app.
 * @param {Date} props.hora - Hora actual.
 * @param {Function} props.handleIconClick - Acción al hacer click en el logo.
 * @param {string} props.busqueda - Valor del buscador.
 * @param {Function} props.setBusqueda - Setter del buscador.
 * @param {Array} props.sugerencias - Sugerencias para el buscador.
 * @param {Function} props.setSugerencias - Setter de sugerencias.
 * @param {Object} props.capaBtnRef - Ref del botón de capa.
 * @param {boolean} props.menuVisible - Si el menú está visible.
 * @param {Function} props.setMenuVisible - Setter del menú.
 * @param {Function} props.handleMenuOption - Acción al seleccionar opción de menú.
 * @param {boolean} props.showAlertDropdown - Si el dropdown de alertas está visible.
 * @param {Function} props.toggleAlertDropdown - Toggle del dropdown de alertas.
 * @param {boolean} props.alertasVistas - Si las alertas están vistas.
 * @param {Array} props.alertas - Lista de alertas.
 * @param {Function} props.setAlertas - Setter de alertas.
 * @param {boolean} props.volverBtn - Si muestra el botón volver.
 * @param {Function} props.onVolver - Acción al pulsar volver.
 * @param {boolean} props.buscadorDoc - Si el buscador es de documentación.
 * @returns {JSX.Element}
 */
// src/components/Topbar.js
import React, { useRef, useEffect } from 'react';
import '../styles/topbar.css';

function Topbar({
  logo,
  hora,
  handleIconClick,
  busqueda,
  setBusqueda,
  sugerencias,
  setSugerencias,
  capaBtnRef,
  menuVisible,
  setMenuVisible,
  handleMenuOption,
  showAlertDropdown,
  toggleAlertDropdown,
  alertasVistas,
  alertas,
  setAlertas,
  volverBtn,
  onVolver,
  buscadorDoc
}) {
  const alertDropdownRef = useRef(null);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (showAlertDropdown && alertDropdownRef.current && !alertDropdownRef.current.contains(event.target)) {
        toggleAlertDropdown();
      }
    }
    if (showAlertDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAlertDropdown, toggleAlertDropdown]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <img src={logo} alt="Logo" className="logo" onClick={handleIconClick} />
        <span className="hora">{hora.toLocaleTimeString()}</span>
      </div>
      <div className="topbar-center">
        <div className="busqueda-wrapper">
          <input
            className={`busqueda-objetos${sugerencias.length > 0 ? ' abierto' : ''}`}
            type="text"
            placeholder={buscadorDoc ? "Buscar por función, objeto, hook, clase..." : "Buscar por referencia, tipo o proveedor..."}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            autoComplete="off"
          />
          <span className="icono-lupa">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#0a2a5c" strokeWidth="2"/>
              <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#0a2a5c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          {sugerencias.length > 0 && (
            <ul className="sugerencias-lista">
              {sugerencias.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => {
                    setBusqueda(s);
                    setSugerencias([]);
                  }}
                  className="sugerencia-item"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="topbar-right">
        {buscadorDoc ? (
          <button className="adminpanel-btn adminpanel-btn-doc" onClick={onVolver}>
            Volver
          </button>
        ) : (
          <>
            <div style={{ position: "relative" }} ref={capaBtnRef}>
              <button
                className="capa-btn"
                onClick={() => setMenuVisible(v => !v)}
                aria-label="Mostrar opciones de capa"
                style={{ marginRight: '10px' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="5" width="14" height="2" rx="1" fill="#fff"/>
                  <rect x="3" y="9" width="14" height="2" rx="1" fill="#fff"/>
                  <rect x="3" y="13" width="14" height="2" rx="1" fill="#fff"/>
                </svg>
              </button>
              {menuVisible && (
                <div className="capa-menu">
                  <div className="capa-menu-item" onClick={() => handleMenuOption('todos')}>Todos</div>
                  <div className="capa-menu-item" onClick={() => handleMenuOption('capa1')}>Capa 1</div>
                  <div className="capa-menu-item" onClick={() => handleMenuOption('capa2')}>Capa 2</div>
                  <div className="capa-menu-item" onClick={() => handleMenuOption('capa3')}>Capa 3</div>
                </div>
              )}
            </div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <svg
                className={`bell${showAlertDropdown ? ' bell-active' : ''}`}
                viewBox="0 0 24 24"
                onClick={toggleAlertDropdown}
                style={{ cursor: 'pointer' }}
              >
                <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-5-5.91V5a1 1 0 1 0-2 0v.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z" />
              </svg>
              {!alertasVistas && alertas.length > 0 && (
                <span className="badge">{alertas.length}</span>
              )}
              <div
                ref={alertDropdownRef}
                className={`dropdown ${showAlertDropdown ? 'show' : ''}`}
                style={{
                  right: 0, // alineado con la campana
                  left: 'auto',
                  minWidth: 260,
                  maxWidth: 320,
                  marginTop: 8 // pequeño espacio bajo la campana
                }}
              >
                <div className="alertas-dropdown-header">
                  <button
                    className="alertas-clear-btn"
                    onClick={() => setAlertas([])}
                    disabled={alertas.length === 0}
                    title="Limpiar historial"
                  >
                    &#10006;
                  </button>
                </div>
                {alertas.length === 0 ? (
                  <div className="alertas-vacio">No hay alertas</div>
                ) : (
                  <ul className="alertas-lista">
                    {alertas.map(a => {
                      let label = 'Insertado', labelClass = 'alerta-label-insertado';
                      if (a.tipo === 'error' || a.tipo === 'delete') { label = 'Eliminado'; labelClass = 'alerta-label-eliminado'; }
                      if (a.tipo === 'edit' || a.tipo === 'warning') { label = 'Editado'; labelClass = 'alerta-label-editado'; }
                      return (
                        <li key={a.id} className="alertas-item">
                          <span className={`alerta-label ${labelClass}`}>{label}</span>
                          {a.objeto && (
                            <div className="alerta-detalles">
                              <b>ID:</b> {a.objeto.identificador || a.objeto.id}<br />
                              <b>Tipo:</b> {a.objeto.tipo}<br />
                              <b>Proveedor:</b> {a.objeto.proveedor}<br />
                              <b>Largo:</b> {a.objeto.alto || a.objeto.largo} &nbsp; <b>Ancho:</b> {a.objeto.ancho}<br />
                              <b>Posición:</b> {a.objeto.posicion ? `${a.objeto.posicion.col + 1},${a.objeto.posicion.row + 1}` : (a.objeto.posicion_x !== undefined ? `${a.objeto.posicion_x + 1},${a.objeto.posicion_y + 1}` : '')}<br />
                              <b>Capa:</b> {a.objeto.capa}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Topbar;
// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
