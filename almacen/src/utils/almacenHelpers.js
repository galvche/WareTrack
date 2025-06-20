// src/utils/almacenHelpers.js
// Funciones auxiliares extraídas de App.js para modularización

export const tiposConPrioridad = [
  { tipo: 'Palets', prioridad: 'Alta' },
  { tipo: 'Cajas', prioridad: 'Media' },
  { tipo: 'Contenedores', prioridad: 'Alta' },
  { tipo: 'Equipos', prioridad: 'Baja' }
];

export const proveedores = ['GALVATEC', 'INDUSTRIALTECH', 'LOGISERVE', 'PROQUIMIA'];

export const gridSize = { columns: 28, rows: 18 };

export const pasillos = [
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 4 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 9 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 14 })),
  ...Array.from({ length: gridSize.rows }, (_, r) => ({ row: r, col: 19 })),
  ...Array.from({ length: gridSize.columns }, (_, c) => ({ row: 5, col: c })),
  ...Array.from({ length: gridSize.columns }, (_, c) => ({ row: 11, col: c }))
];

export function objetoFrontendAbackend(obj) {
  const tipoObj = tiposConPrioridad.find(t => t.tipo === obj.tipo);
  return {
    id: obj.identificador,
    tipo: obj.tipo,
    prioridad: tipoObj ? tipoObj.prioridad : "Media",
    proveedor: obj.proveedor,
    largo: obj.alto,
    ancho: obj.ancho,
    capa: obj.capa,
    posicion_x: obj.posicion?.col ?? 0,
    posicion_y: obj.posicion?.row ?? 0,
    observaciones: obj.observaciones || ""
  };
}

export function getCapasPara3D(ocupadasPorCapa) {
  return [
    { ocupadas: ocupadasPorCapa[1] || [] },
    { ocupadas: ocupadasPorCapa[2] || [] },
    { ocupadas: ocupadasPorCapa[3] || [] }
  ];
}

export function buscarHueco(nuevoObjeto, ocupadasCapa, pasillos) {
  for (let r = 0; r <= gridSize.rows - nuevoObjeto.alto; r++) {
    for (let c = 0; c <= gridSize.columns - nuevoObjeto.ancho; c++) {
      let espacioLibre = true;
      for (let rr = 0; rr < nuevoObjeto.alto; rr++) {
        for (let cc = 0; cc < nuevoObjeto.ancho; cc++) {
          const row = r + rr;
          const col = c + cc;
          const esPasillo = pasillos.some(p => p.row === row && p.col === col);
          const ocupado = ocupadasCapa.find(o => o.row === row && o.col === col);
          if (ocupado || esPasillo) {
            espacioLibre = false;
            break;
          }
        }
        if (!espacioLibre) break;
      }
      if (espacioLibre) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function getTipoClase(id, objetos) {
  const obj = objetos.find(o => o.identificador === id);
  if (!obj) return '';
  switch (obj.tipo) {
    case 'Palets': return 'tipo-palets';
    case 'Cajas': return 'tipo-cajas';
    case 'Contenedores': return 'tipo-contenedores';
    case 'Equipos': return 'tipo-equipos';
    default: return '';
  }
}

export function getSalidaBorde(r, c) {
  if (pasillos.some(p => p.row === r && p.col === c)) {
    if (r === 0) return 'top';
    if (r === gridSize.rows - 1) return 'bottom';
    if (c === 0) return 'left';
    if (c === gridSize.columns - 1) return 'right';
  }
  return null;
}

export function getBordesExteriores(obj, r, c) {
  if (!obj) return {};
  const { posicion, alto, ancho } = obj;
  if (
    r < posicion.row ||
    r >= posicion.row + alto ||
    c < posicion.col ||
    c >= posicion.col + ancho
  ) return {};
  return {
    top:    r === posicion.row || (r > posicion.row && (r - 1 < posicion.row)),
    bottom: r === posicion.row + alto - 1 || (r < posicion.row + alto - 1 && (r + 1 >= posicion.row + alto)),
    left:   c === posicion.col || (c > posicion.col && (c - 1 < posicion.col)),
    right:  c === posicion.col + ancho - 1 || (c < posicion.col + ancho - 1 && (c + 1 >= posicion.col + ancho))
  };
}
