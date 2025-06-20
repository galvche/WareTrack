import React, { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Shape } from 'three';

const azulAirbus = '#00205b';

/**
 * Almacen3D - Visualización 3D del almacén usando Three.js.
 *
 * @param {Object} props
 * @param {Array} props.capas - Capas del almacén.
 * @param {Object} props.gridSize - Tamaño de la cuadrícula.
 * @param {Array} props.pasillos - Definición de pasillos.
 * @param {Array} props.salidas - Celdas de salida.
 * @param {Array} props.objetos - Objetos a mostrar en 3D.
 * @param {Function} props.onClose - Callback para cerrar la vista 3D.
 * @returns {JSX.Element}
 *
 * @example
 * <Almacen3D capas={capas} gridSize={gridSize} objetos={objetos} />
 */
function Almacen3D({ capas, gridSize, pasillos, salidas, objetos, onClose }) {
  // DEBUG: Log props
  console.log('[Almacen3D] props:', { capas, gridSize, pasillos, salidas, objetos });
  const [hovered, setHovered] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const canvasRef = useRef();
  // DEBUG: Log selección
  console.log('[Almacen3D] seleccionado:', seleccionado);

  // Mostrar siempre todas las capas en 3D
  const capasAMostrar = [1, 2, 3];
  const objetosCapa = objetos;

  // Resumen para leyenda
  const resumen = useMemo(() => {
    const ocupadas = capas.flatMap(c => c.ocupadas || []);
    const vacias = [];
    const tipos = {};
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.columns; col++) {
        const esOcupada = ocupadas.some(c => c.row === row && c.col === col);
        const esSalida = salidas.some(c => c.row === row && c.col === col);
        const esPasillo = pasillos.some(c => c.row === row && c.col === col);
        if (!esOcupada && !esPasillo && !esSalida) {
          vacias.push({ row, col });
        }
      }
    }
    objetosCapa.forEach(obj => {
      tipos[obj.tipo] = (tipos[obj.tipo] || 0) + 1;
    });
    return {
      vacias,
      tipos
    };
  }, [capas, gridSize, pasillos, salidas, objetosCapa]);

  // Para pintar cada celda según tipo de objeto
  const colores = {
    Palets: '#ffe082',
    Cajas: '#90caf9',
    Contenedores: '#a5d6a7',
    Equipos: '#f48fb1',
    salida: azulAirbus,
    vacia: '#e3f2fd'
  };

  function getTipoCelda(row, col, ocupadas, salidas, objetos, capaIdx) {
    // Si hay objeto en la celda, devolver su tipo real SIEMPRE
    const obj = objetos.find(o => o.posicion && o.posicion.row === row && o.posicion.col === col && o.capa === capaIdx);
    if (obj) return obj.tipo;
    // Si no hay objeto pero es salida, devolver 'salida'
    if (salidas.some(c => c.row === row && c.col === col)) return 'salida';
    // Si no hay objeto ni salida, devolver 'vacia'
    return 'vacia';
  }

  // Handler para WebGL context lost
  function handleContextLost(e) {
    e.preventDefault();
    // Quitar alerta: solo cambiar a 2D
    if (onClose) onClose();
    if (canvasRef.current && canvasRef.current.style) {
      canvasRef.current.style.display = 'none';
      setTimeout(() => {
        if (canvasRef.current && canvasRef.current.style) {
          canvasRef.current.style.display = '';
        }
      }, 100);
    }
  }

  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: '#e9eef3', zIndex: 999, display: 'flex'
      }}
    >
      {/* Lista lateral izquierda */}
      <div style={{
        width: 340,
        background: '#fff',
        borderRadius: 0,
        margin: 0,
        padding: 18,
        boxShadow: '0 2px 12px #00205b11',
        fontSize: 15,
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        borderRight: `6px solid ${azulAirbus}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        <h3 style={{
          marginBottom: 16,
          fontSize: 19,
          color: azulAirbus,
          fontWeight: 700,
          letterSpacing: 0.5
        }}>Lista de objetos</h3>
        {objetosCapa.length === 0 ? (
          <div style={{color:'#888'}}>No hay objetos en esta capa.</div>
        ) : (
          <ul style={{margin: 0, paddingLeft: 0, listStyle: 'none'}}>
            {objetosCapa.map((obj, i) => (
              <li
                key={i}
                onClick={() => setSeleccionado(obj)}
                style={{
                  marginBottom: 14,
                  padding: '10px 12px',
                  borderRadius: 7,
                  background: seleccionado === obj ? '#e3f2fd' : '#f5f8fd',
                  border: seleccionado === obj ? `2px solid ${azulAirbus}` : '2px solid transparent',
                  boxShadow: seleccionado === obj ? `0 0 0 2px ${azulAirbus}44` : '0 1px 4px #00205b11',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border 0.2s'
                }}
              >
                <div style={{fontWeight: 700, color: azulAirbus, fontSize: 18, marginBottom: 2}}>
                  {obj.identificador}
                </div>
                <div style={{fontSize: 13, color: '#555', marginBottom: 2}}>
                  <span style={{color: '#888', fontWeight: 500}}>{obj.tipo}</span>
                </div>
                <div style={{fontSize:13, color:'#555'}}>Proveedor: {obj.proveedor}</div>
                <div style={{fontSize:13, color:'#555'}}>Posición: ({obj.posicion.col + 1}, {obj.posicion.row + 1})</div>
                {obj.observaciones && <div style={{fontSize:12, color:'#888'}}>Obs: {obj.observaciones}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Contenedor 3D */}
      <div style={{flex: 1, position: 'relative'}}>
        {/* Leyenda arriba derecha */}
        <div style={{
          position: 'absolute',
          top: 80, // Bajada para no tapar la barra superior
          right: 24,
          zIndex: 10000,
          background: '#fff',
          borderRadius: 8,
          padding: '10px 18px',
          boxShadow: '0 2px 8px #00205b22',
          fontSize: 15,
          borderLeft: `5px solid ${azulAirbus}`,
          color: azulAirbus,
          minWidth: 150
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:'#90caf9'}}></span>
            Cajas: {resumen.tipos.Cajas || 0}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:'#ffe082'}}></span>
            Palets: {resumen.tipos.Palets || 0}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:'#a5d6a7'}}></span>
            Contenedores: {resumen.tipos.Contenedores || 0}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:'#f48fb1'}}></span>
            Equipos: {resumen.tipos.Equipos || 0}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:azulAirbus}}></span>
            Seleccionado
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{display:'inline-block',width:16,height:16,borderRadius:4,marginRight:6,background:'#e3f2fd'}}></span>
            Vacía: {resumen.vacias.length}
          </div>
        </div>
        {/* Botón abajo derecha */}
        <button
          className="btn-vista-3d"
          onClick={onClose}
        >
          2D
        </button>
        {/* Canvas 3D */}
        <Canvas
          ref={canvasRef}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
          }}
          camera={{
            position: [
              gridSize.columns / 2,
              8 + (capasAMostrar.length === 1 ? 2 : 10),
              gridSize.rows * 1.2
            ],
            fov: 50
          }}
          shadows={false}
          frameloop="demand"
          style={{background: 'transparent'}}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[10, 30, 10]} intensity={0.7} />
          {/* Suelo base aún más claro para mayor contraste */}
          <mesh receiveShadow position={[0, -0.51, 0]}>
            <boxGeometry args={[gridSize.columns + 6, 1, gridSize.rows + 6]} />
            <meshStandardMaterial color="#fcfeff" />
          </mesh>
          {/* Línea fina azul alrededor del perímetro con esquinas redondeadas */}
          <group>
            {/* Lados horizontales */}
            <mesh position={[0, 0.07, -gridSize.rows / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[gridSize.columns + 1, 0.09]} />
              <meshStandardMaterial color={'#00205b'} />
            </mesh>
            <mesh position={[0, 0.07, gridSize.rows / 2 + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[gridSize.columns + 1, 0.09]} />
              <meshStandardMaterial color={'#00205b'} />
            </mesh>
            {/* Lados verticales */}
            <mesh position={[-gridSize.columns / 2 - 0.5, 0.07, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[gridSize.rows + 1, 0.09]} />
              <meshStandardMaterial color={'#00205b'} />
            </mesh>
            <mesh position={[gridSize.columns / 2 + 0.5, 0.07, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[gridSize.rows + 1, 0.09]} />
              <meshStandardMaterial color={'#00205b'} />
            </mesh>
            {/* Esquinas redondeadas */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
              <mesh key={i} position={[sx * (gridSize.columns / 2 + 0.5), 0.07, sz * (gridSize.rows / 2 + 0.5)]}>
                <torusGeometry args={[0.09, 0.018, 16, 32, Math.PI / 2]} />
                <meshStandardMaterial color={'#00205b'} />
              </mesh>
            ))}
          </group>
          {/* Render de objetos como bloques 3D */}
          {objetosCapa.map((obj, i) => {
            const isSelected = seleccionado && seleccionado.identificador === obj.identificador && seleccionado.capa === obj.capa;
            const baseColor = colores[obj.tipo] || colores.Cajas;
            const selectedColor = isSelected ? azulAirbus : baseColor;
            return (
              <mesh
                key={obj.identificador + '-' + obj.capa}
                position={[
                  (obj.posicion.col + (obj.ancho || 1) / 2 - 0.5) - gridSize.columns / 2,
                  (obj.capa - 1) * 1.2,
                  (obj.posicion.row + (obj.largo || 1) / 2 - 0.5) - gridSize.rows / 2
                ]}
                castShadow
                receiveShadow
                onPointerOver={() => setHovered({row: obj.posicion.row, col: obj.posicion.col, capa: obj.capa, tipo: obj.tipo})}
                onPointerOut={() => setHovered(null)}
                onClick={() => setSeleccionado(obj)}
              >
                <boxGeometry args={[obj.ancho || 1, 1, obj.largo || 1]} />
                <meshStandardMaterial
                  color={selectedColor}
                  opacity={1}
                  metalness={0.2}
                  roughness={isSelected ? 0.15 : 0.7}
                  emissive={isSelected ? selectedColor : '#000000'}
                  emissiveIntensity={isSelected ? 0.5 : 0}
                />
              </mesh>
            );
          })}
          {/* Render de celdas vacías y salidas */}
          {capasAMostrar.flatMap((capaIdx) =>
            Array.from({ length: gridSize.rows }).flatMap((_, row) =>
              Array.from({ length: gridSize.columns }).map((_, col) => {
                // Si quieres renderizar algo aquí, ponlo. Si no, puedes eliminar este bloque.
                return null;
              })
            )
          )}
          {/* Render de surcos mejorados de pasillos en el suelo */}
          {capasAMostrar[0] &&
            Array.from({ length: gridSize.rows }).flatMap((_, row) =>
              Array.from({ length: gridSize.columns }).map((_, col) => {
                const esPasillo = pasillos.some(c => c.row === row && c.col === col);
                if (!esPasillo) return null;
                // Detectar intersección: si hay pasillo en fila y columna
                const esInterseccion = pasillos.filter(c => c.row === row).length > 1 && pasillos.filter(c => c.col === col).length > 1;
                return (
                  <group key={`surco-pasillo-r${row}-c${col}`}>
                    {/* Centro amarillo */}
                    <mesh
                      position={[
                        col - gridSize.columns / 2,
                        0.01,
                        row - gridSize.rows / 2
                      ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <planeGeometry args={[0.6, 1]} />
                      <meshStandardMaterial color={'#ffd600'} />
                    </mesh>
                    {/* Bordes azul solo si no es intersección */}
                    {!esInterseccion && (
                      <>
                        {/* Borde azul izquierdo */}
                        <mesh
                          position={[
                            col - gridSize.columns / 2 - 0.275,
                            0.011,
                            row - gridSize.rows / 2
                          ]}
                          rotation={[-Math.PI / 2, 0, 0]}
                        >
                          <planeGeometry args={[0.05, 1]} />
                          <meshStandardMaterial color={'#00205b'} />
                        </mesh>
                        {/* Borde azul derecho */}
                        <mesh
                          position={[
                            col - gridSize.columns / 2 + 0.275,
                            0.011,
                            row - gridSize.rows / 2
                          ]}
                          rotation={[-Math.PI / 2, 0, 0]}
                        >
                          <planeGeometry args={[0.05, 1]} />
                          <meshStandardMaterial color={'#00205b'} />
                        </mesh>
                      </>
                    )}
                  </group>
                );
              })
            )
          }
          <OrbitControls />bitControls /
        </Canvas>anvas
      </div>
    </div>
  );
}

export default Almacen3D;

