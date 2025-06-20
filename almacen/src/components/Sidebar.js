// src/components/Sidebar.js
import React from 'react';
import '../styles/sidebar.css';

/**
 * Sidebar - Barra lateral para inserción y gestión de objetos.
 *
 * @param {Object} props
 * @param {Object} props.nuevoObjeto - Objeto en edición.
 * @param {Function} props.setNuevoObjeto - Setter del objeto en edición.
 * @param {Array} props.tiposConPrioridad - Tipos de objeto con prioridad.
 * @param {Array} props.proveedores - Lista de proveedores.
 * @param {Object} props.gridSize - Tamaño de la cuadrícula.
 * @param {Function} props.buscarHueco - Función para buscar hueco.
 * @param {Object} props.ocupadasPorCapa - Ocupadas por capa.
 * @param {Array} props.pasillos - Definición de pasillos.
 * @param {Function} props.agregarAlerta - Añade una alerta.
 * @param {Function} props.agregarObjeto - Añade un objeto.
 * @param {Array} props.objetosFiltrados - Objetos filtrados.
 * @param {Object} props.objetoSeleccionado - Objeto seleccionado.
 * @param {Function} props.setObjetoSeleccionado - Setter de objeto seleccionado.
 * @param {Function} props.setObjetoEditando - Setter de objeto en edición.
 * @param {Function} props.setMostrarModalEditar - Setter de modal de edición.
 * @param {Function} props.pedirConfirmEliminar - Solicita confirmación de borrado.
 * @returns {JSX.Element}
 */
function Sidebar({
  nuevoObjeto,
  setNuevoObjeto,
  tiposConPrioridad,
  proveedores,
  gridSize,
  buscarHueco,
  ocupadasPorCapa,
  pasillos,
  agregarAlerta,
  agregarObjeto,
  objetosFiltrados,
  objetoSeleccionado,
  setObjetoSeleccionado,
  setObjetoEditando,
  setMostrarModalEditar,
  pedirConfirmEliminar
}) {
  return (
    <div className="sidebar">
      <h2>Insertar Objeto</h2>
      <form onSubmit={e => {
        e.preventDefault();
        // Validación básica
        if (!nuevoObjeto.identificador || !nuevoObjeto.tipo || !nuevoObjeto.proveedor || !nuevoObjeto.capa) {
          agregarAlerta('error', 'Completa todos los campos obligatorios');
          return;
        }
        let objetoAInsertar = { ...nuevoObjeto };
        let capaFinal = 1;
        if (objetoAInsertar.capa && objetoAInsertar.capa !== 'auto') {
          capaFinal = Number(objetoAInsertar.capa);
        }
        objetoAInsertar.capa = capaFinal;
        if (!objetoAInsertar.posicion) {
          const hueco = buscarHueco(objetoAInsertar, ocupadasPorCapa[capaFinal], pasillos);
          if (!hueco) {
            agregarAlerta('error', 'No hay espacio disponible');
            return;
          }
          objetoAInsertar.posicion = hueco;
        }
        agregarObjeto(objetoAInsertar);
      }}>
        <input
          type="text"
          placeholder="Identificador"
          value={nuevoObjeto.identificador}
          onChange={e => setNuevoObjeto({ ...nuevoObjeto, identificador: e.target.value })}
        />
        <select
          value={nuevoObjeto.tipo}
          onChange={e => setNuevoObjeto({ ...nuevoObjeto, tipo: e.target.value })}
        >
          <option value="">Tipo</option>
          {tiposConPrioridad.map(t => (
            <option key={t.tipo} value={t.tipo}>{t.tipo} (Prioridad: {t.prioridad})</option>
          ))}
        </select>
        <select
          value={nuevoObjeto.proveedor}
          onChange={e => setNuevoObjeto({ ...nuevoObjeto, proveedor: e.target.value })}
        >
          <option value="">Proveedor</option>
          {proveedores.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Observaciones"
          value={nuevoObjeto.observaciones}
          onChange={e => setNuevoObjeto({ ...nuevoObjeto, observaciones: e.target.value })}
        />
        <div className="medidas">
          <div className="medidas-row">
            <label className="medida-label">
              Largo:
              <input
                type="number"
                min="1"
                max={gridSize.rows}
                placeholder="Largo"
                value={nuevoObjeto.alto}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= gridSize.rows) setNuevoObjeto({ ...nuevoObjeto, alto: val });
                }}
              />
              <span className="unidad">m</span>
            </label>
            <label className="medida-label">
              Ancho:
              <input
                type="number"
                min="1"
                max={gridSize.columns}
                placeholder="Ancho"
                value={nuevoObjeto.ancho}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= gridSize.columns) setNuevoObjeto({ ...nuevoObjeto, ancho: val });
                }}
              />
              <span className="unidad">m</span>
            </label>
          </div>
          <div className="medidas-max">
            <em>
              Máximo: {gridSize.rows} m de largo, {gridSize.columns} m de ancho
            </em>
          </div>
        </div>
        <select
          value={nuevoObjeto.capa}
          onChange={e => setNuevoObjeto({ ...nuevoObjeto, capa: e.target.value })}
        >
          <option value="auto">Automático</option>
          <option value={1}>Capa 1</option>
          <option value={2}>Capa 2</option>
          <option value={3}>Capa 3</option>
        </select>
        <button className="button" type="submit">Insertar</button>
      </form>

      <div className="object-list">
        <h3 style={{ color: "#00205b" }}>Objetos en almacén</h3>
        <ul>
          {objetosFiltrados.map(obj => (
            <li
              key={obj.identificador}
              className={`obj-list-item${objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? ' selected-obj' : ''}`}
              onClick={() => setObjetoSeleccionado(objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? null : obj)}
              onDoubleClick={() => {
                setObjetoEditando(obj);
                setMostrarModalEditar(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="obj-identificador"><b>{obj.identificador}</b></div>
              <div className="obj-info">
                Tipo: {obj.tipo} (Prioridad: {tiposConPrioridad.find(t => t.tipo === obj.tipo)?.prioridad || 'N/A'})<br />
                Proveedor: {obj.proveedor}<br />
                Observaciones: {obj.observaciones || '-'}<br />
                Largo: {obj.alto} &nbsp; Ancho: {obj.ancho}<br />
                Posición: {obj.posicion.col + 1},{obj.posicion.row + 1}
              </div>
              <div className="obj-actions">
                <button
                  className="button sacar-btn"
                  onClick={() => pedirConfirmEliminar(obj.identificador)}
                >Sacar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;

// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
