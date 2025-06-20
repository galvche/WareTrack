/**
 * Grid - Renderiza la cuadrícula principal del almacén y gestiona la selección de celdas.
 *
 * @param {Object} props
 * @param {Object} props.gridSize - Tamaño de la cuadrícula (rows, columns).
 * @param {Array} props.ocupadasFiltradas - Celdas ocupadas filtradas.
 * @param {Array} props.pasillos - Definición de pasillos.
 * @param {Function} props.getSalidaBorde - Función para obtener la salida por el borde.
 * @param {Array} props.ocupadasParaGrid - Celdas ocupadas para la cuadrícula.
 * @param {Object} props.objetoSeleccionado - Objeto actualmente seleccionado.
 * @param {Function} props.getBordesExteriores - Calcula los bordes exteriores.
 * @param {Function} props.getTipoClase - Devuelve la clase CSS según el tipo.
 * @param {Array} props.objetos - Lista de objetos en el almacén.
 * @param {Function} props.setObjetoSeleccionado - Setter para el objeto seleccionado.
 * @param {number} props.capaIndicador - Capa actualmente visible.
 * @param {boolean} props.vista3D - Si la vista es 3D.
 * @param {Function} props.setVista3D - Setter para la vista 3D.
 * @param {Function} props.onSelectionChange - Callback al cambiar la selección.
 * @param {Array} props.celdasSeleccionadas - Selección controlada de celdas.
 * @returns {JSX.Element}
 *
 * @example
 * <Grid gridSize={{rows: 10, columns: 10}} objetos={objetos} ... />
 */

// src/components/Grid.js
import React, { useState, useRef } from 'react';
import '../styles/grid.css';

function Grid({
  gridSize,
  ocupadasFiltradas,
  pasillos,
  getSalidaBorde,
  ocupadasParaGrid,
  objetoSeleccionado,
  getBordesExteriores,
  getTipoClase,
  objetos,
  setObjetoSeleccionado,
  capaIndicador,
  vista3D,
  setVista3D,
  onSelectionChange,
  celdasSeleccionadas // NUEVO: selección controlada
}) {
  // Estado de selección controlado por el padre
  const [selectedCells, setSelectedCells] = React.useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);

  // Sincroniza el estado interno con la prop
  React.useEffect(() => {
    setSelectedCells(celdasSeleccionadas || []);
  }, [celdasSeleccionadas]);

  // Comunica la selección al panel solo si cambia localmente
  const handleSetSelectedCells = React.useCallback((cells, finished = false) => {
    console.log('DEBUG Grid: handleSetSelectedCells', cells, finished);
    setSelectedCells(cells);
    if (onSelectionChange && finished) {
      console.log('DEBUG Grid: llamando a onSelectionChange', cells);
      onSelectionChange(cells);
    }
  }, [onSelectionChange]);

  return (
    <div
      className="grid-container"
      style={{ position: 'relative' }}
      onMouseUp={() => {
        setIsDragging(false);
        dragStartRef.current = null;
        // Comunica la selección SOLO al soltar el ratón
        if (selectedCells.length > 0 && onSelectionChange) {
          console.log('DEBUG Grid: onMouseUp, llamando a onSelectionChange', selectedCells);
          onSelectionChange(selectedCells);
        }
      }}
      onMouseLeave={() => { setIsDragging(false); dragStartRef.current = null; }}
      onClick={e => {
        // Si el click es fuera de la grid (no sobre una celda), deselecciona
        if (e.target.classList.contains('grid-container')) {
          handleSetSelectedCells([]);
        }
      }}
    >
      <div className="seleccion-indicador">
        Capa actual: <b>{capaIndicador}</b>
        <br />
        {objetoSeleccionado
          ? <>Seleccionado: <b>{objetoSeleccionado.identificador}</b> ({objetoSeleccionado.tipo})</>
          : <>Ningún objeto seleccionado</>
        }
      </div>
      <div className="grid">
        {Array(gridSize.rows).fill(null).flatMap((_, r) =>
          Array(gridSize.columns).fill(null).map((_, c) => {
            const ocupado = ocupadasFiltradas.find(o => o.row === r && o.col === c);
            const isPasillo = pasillos.some(p => p.row === r && p.col === c);
            const salidaBorde = getSalidaBorde(r, c);

            let bordeClases = '';
            if (objetoSeleccionado && ocupado && ocupado.id === objetoSeleccionado.identificador) {
              const bordes = getBordesExteriores(objetoSeleccionado, r, c);
              if (bordes.top) bordeClases += ' selected-obj-border-top';
              if (bordes.bottom) bordeClases += ' selected-obj-border-bottom';
              if (bordes.left) bordeClases += ' selected-obj-border-left';
              if (bordes.right) bordeClases += ' selected-obj-border-right';
            }

            const ocupadosEnCelda = ocupadasParaGrid.filter(o => o.row === r && o.col === c);
            const capaCelda = ocupadosEnCelda.length ? ocupadosEnCelda[0].capa : null;

            // Selección múltiple
            const isSelected = selectedCells.some(cell => cell.row === r && cell.col === c && cell.capa === capaCelda);

            function handleCellMouseDown(e) {
              if (isPasillo) return;
              setIsDragging(true);
              dragStartRef.current = { row: r, col: c, capa: capaCelda };
              handleSetSelectedCells([{ row: r, col: c, capa: capaCelda }]);
            }
            function handleCellMouseEnter(e) {
              if (!isDragging || isPasillo) return;
              const start = dragStartRef.current;
              if (!start) return;
              const minRow = Math.min(start.row, r);
              const maxRow = Math.max(start.row, r);
              const minCol = Math.min(start.col, c);
              const maxCol = Math.max(start.col, c);
              const cells = [];
              for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                  if (!pasillos.some(p => p.row === row && p.col === col)) {
                    cells.push({ row, col, capa: capaCelda });
                  }
                }
              }
              handleSetSelectedCells(cells);
            }

            return (
              <div
                key={`${r}-${c}`}
                className={
                  `grid-item
                  ${ocupado ? 'occupied' : ''}
                  ${ocupado ? getTipoClase(ocupado.id, objetos) : ''}
                  ${isPasillo ? 'pasillo' : ''}
                  ${salidaBorde ? `salida-${salidaBorde}` : ''}
                  ${bordeClases}
                  ${capaCelda ? `capa-${capaCelda}` : ''}
                  ${isSelected ? ' selected-cell' : ''}
                  `
                }
                title={
                  salidaBorde
                    ? 'Salida'
                    : isPasillo
                    ? 'Pasillo'
                    : ocupado
                    ? `Ocupado por ID: ${ocupado.id}`
                    : ''
                }
                onMouseDown={handleCellMouseDown}
                onMouseEnter={handleCellMouseEnter}
                onClick={() => {
                  if (ocupado) {
                    const obj = objetos.find(o => o.identificador === ocupado.id);
                    if (obj) {
                      setObjetoSeleccionado(objetoSeleccionado && objetoSeleccionado.identificador === obj.identificador ? null : obj);
                    } else {
                      setObjetoSeleccionado(null);
                    }
                  } else {
                    setObjetoSeleccionado(null);
                  }
                }}
              >
              </div>
            );
          })
        )}
      </div>
      {!vista3D && (
        <button
          className="btn-vista-3d"
          onClick={() => setVista3D(true)}
        >
          3D
        </button>
      )}
    </div>
  );
}

export default Grid;
// (Asegura que los paths de imágenes/audio apunten a assets/img o assets/audio)
