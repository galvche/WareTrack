// src/components/EditModal.js
import React from 'react';
import '../styles/editModal.css';

function EditModal({
  mostrarModalEditar,
  objetoEditando,
  gridSize,
  tiposConPrioridad,
  proveedores,
  handleEditarObjeto,
  setMostrarModalEditar
}) {
  if (!mostrarModalEditar || !objetoEditando) return null;
  return (
    <div className="modal-editar-objeto">
      <div className="modal-contenido edit-modal">
        <h2>Editar Objeto</h2>
        <form onSubmit={handleEditarObjeto}>
          <label>
            Identificador:
            <input
              name="identificador"
              defaultValue={objetoEditando.identificador}
              required
              readOnly
              style={{ background: "#f0f2f7", color: "#888" }}
            />
          </label>
          <label>
            Tipo:
            <select name="tipo" defaultValue={objetoEditando.tipo} required>
              <option value="">Selecciona tipo</option>
              {tiposConPrioridad.map(t => (
                <option key={t.tipo} value={t.tipo}>{t.tipo}</option>
              ))}
            </select>
          </label>
          <label>
            Proveedor:
            <select name="proveedor" defaultValue={objetoEditando.proveedor} required>
              <option value="">Selecciona proveedor</option>
              {proveedores.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Observaciones:
            <input
              name="observaciones"
              defaultValue={objetoEditando.observaciones || ""}
              placeholder="Observaciones"
            />
          </label>
          <div className="medidas-row">
            <div className="medida-label">
              <span>Largo:</span>
              <input
                name="largo"
                type="number"
                min="1"
                max={gridSize.rows}
                defaultValue={objetoEditando.alto}
                required
              />
              <span className="unidad">m</span>
            </div>
            <div className="medida-label">
              <span>Ancho:</span>
              <input
                name="ancho"
                type="number"
                min="1"
                max={gridSize.columns}
                defaultValue={objetoEditando.ancho}
                required
              />
              <span className="unidad">m</span>
            </div>
          </div>
          <label>
            Capa:
            <select name="capa" defaultValue={objetoEditando.capa}>
              <option value={1}>Capa 1</option>
              <option value={2}>Capa 2</option>
              <option value={3}>Capa 3</option>
            </select>
          </label>
          <div className="edit-actions">
            <button type="submit">Guardar</button>
            <button type="button" className="cancel" onClick={() => setMostrarModalEditar(false)}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;

// Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio
