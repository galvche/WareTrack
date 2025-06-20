// src/components/Toast.js
import React from 'react';
import '../styles/toast.css';

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`alerta-global alerta-${toast.tipo}`} style={{
      position: 'fixed',
      top: 70,
      right: 20,
      zIndex: 9999,
      minWidth: 220,
      padding: '12px 24px',
      borderRadius: 8,
      fontSize: '1rem',
      fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,32,91,0.08)',
      background: '#fff',
      color: '#00205b',
      borderLeft: `6px solid ${toast.tipo === 'success' ? '#388e3c' : toast.tipo === 'error' ? '#b71c1c' : '#1976d2'}`
    }}>
      {toast.mensaje}
    </div>
  );
}

export default Toast;

// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
