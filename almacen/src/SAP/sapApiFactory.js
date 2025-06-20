// src/SAP/sapApiFactory.js
// Permite alternar entre el backend local y SAP según configuración

import * as api from '../services/api';
import * as sapApi from './sapApi';

// Cambia este flag según el backend que quieras usar
defaultBackend = 'local'; // 'local' o 'sap'

export function setBackend(backend) {
  defaultBackend = backend;
}

export function getBackend() {
  return defaultBackend;
}

// Factory para obtener la función adecuada según el backend
export function fetchObjetos() {
  return defaultBackend === 'sap' ? sapApi.fetchObjetosSAP() : api.fetchObjetos();
}

export function fetchLogs() {
  return defaultBackend === 'sap' ? sapApi.fetchLogsSAP() : api.fetchLogs();
}

// ...añade aquí más funciones factory según tus endpoints
