import React from 'react';
import '../styles/confirmDeleteModal.css';

function ConfirmDeleteModal({
  confirmEliminar,
  eliminarObjeto,
  setConfirmEliminar
}) {
  if (!confirmEliminar.visible) return null;
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p>¿Está seguro que desea sacar este objeto, señor Stark?</p>
        <button onClick={eliminarObjeto} className="button danger">Sí, sacar</button>
        <button onClick={() => setConfirmEliminar({ visible: false, id: null })} className="button">Cancelar</button>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;

// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
