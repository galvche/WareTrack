// Funciones para interactuar con la API backend

export async function fetchObjetos() {
  const res = await fetch("http://localhost:8000/objetos");
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch("http://localhost:8000/logs");
  return res.json();
}

export async function fetchDbStats() {
  const res = await fetch("http://localhost:8000/db_stats");
  return res.json();
}

// Puedes añadir más funciones según tus endpoints