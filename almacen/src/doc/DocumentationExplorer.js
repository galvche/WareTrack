import React, { useEffect, useState, useMemo } from "react";

function agruparPorTipo(entries) {
  const grupos = {};
  for (const e of entries) {
    let tipo = (e.type || "Otro").toLowerCase();
    // Normalizar tipos
    if (tipo === "function") tipo = "función";
    if (tipo === "component") tipo = "componente";
    if (tipo === "hook") tipo = "hook";
    if (tipo === "class") tipo = "clase";
    if (tipo === "const") tipo = "constante";
    if (!grupos[tipo]) grupos[tipo] = [];
    grupos[tipo].push(e);
  }
  return grupos;
}

export default function DocumentationExplorer({ busqueda }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/doc/generated-docs.json")
      .then(res => {
        if (!res.ok) throw new Error("No se pudo cargar la documentación: " + res.status);
        return res.json();
      })
      .then(data => {
        // Soporta tanto array plano como objeto con entries
        setDocs(Array.isArray(data) ? { entries: data } : data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // DEBUG: Log tipos y entradas
  useEffect(() => {
    if (docs && docs.entries) {
      const tipos = docs.entries.map(e => e.type).filter(Boolean);
      console.log('[DocumentationExplorer] Tipos detectados:', Array.from(new Set(tipos)));
      console.log('[DocumentationExplorer] Ejemplo de entrada:', docs.entries[0]);
    }
  }, [docs]);

  const entriesFiltradas = useMemo(() => {
    if (!docs || !docs.entries) return [];
    if (!busqueda || !busqueda.trim()) return docs.entries;
    const q = busqueda.trim().toLowerCase();
    return docs.entries.filter(e =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.type && e.type.toLowerCase().includes(q)) ||
      (e.file && e.file.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  }, [docs, busqueda]);

  const grupos = useMemo(() => agruparPorTipo(entriesFiltradas), [entriesFiltradas]);
  const tiposOrden = ["componente", "hook", "clase", "constante", "función", "otro"];

  // Panel de detalle
  const entryDetalle = selected && docs && docs.entries.find(e => (e.id ? e.id === selected : e.name === selected));

  return (
    <div style={{padding: 32, maxWidth: 1100, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif'}}>
      <div style={{display: 'flex', gap: 32}}>
        <div style={{flex: 2}}>
          {loading && <div style={{color: '#888'}}>Cargando documentación...</div>}
          {error && <div style={{color: 'red'}}>Error: {error}</div>}
          {!loading && !error && entriesFiltradas.length === 0 && (
            <div style={{color: '#888'}}>No hay resultados para la búsqueda.</div>
          )}
          {!loading && !error && Object.keys(grupos).length >= 0 && tiposOrden.map(tipo => (
            <div key={tipo} style={{marginBottom: 32}}>
              <h2 style={{fontSize: 22, color: '#1a4fa3', borderBottom: '1px solid #e0e0e0', paddingBottom: 4, marginBottom: 12, textTransform: 'capitalize'}}>{tipo.charAt(0).toUpperCase() + tipo.slice(1) + (tipo.endsWith('e') ? 's' : 'es')}</h2>
              <ul style={{listStyle: 'none', padding: 0}}>
                {(grupos[tipo] || []).length === 0 && <li style={{color:'#bbb',fontStyle:'italic'}}>No hay elementos de este tipo.</li>}
                {(grupos[tipo] || []).map(e => (
                  <li key={e.id || e.name} style={{marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 8}}>
                    <a href="#" onClick={ev => {ev.preventDefault(); setSelected(e.id || e.name);}} style={{fontWeight: 'bold', color: '#1a4fa3', fontSize: 17}}>{e.name}</a>
                    <span style={{marginLeft: 8, color: '#888'}}>{e.type}</span>
                    <div style={{fontSize: 13, color: '#666'}}>{e.description || <i>Sin descripción</i>}</div>
                    <div style={{fontSize: 12, color: '#aaa'}}>Archivo: {e.file}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{flex: 1, minWidth: 320, maxWidth: 400, background: '#f7faff', border: '1px solid #dbeafe', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px #e0e7ef33', position: 'sticky', top: 32, height: 'fit-content'}}>
          {entryDetalle ? (
            <>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{margin: 0, fontSize: 22, color: '#1a4fa3'}}>{entryDetalle.name}</h3>
                <button onClick={() => setSelected(null)} style={{background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer'}}>✕</button>
              </div>
              <div style={{color: '#888', fontSize: 15, marginBottom: 8}}>{entryDetalle.type} — <span style={{fontSize: 13}}>{entryDetalle.file}</span></div>
              <div style={{marginBottom: 12, color: '#333'}}>{entryDetalle.description || <i>Sin descripción</i>}</div>
              {entryDetalle.params && entryDetalle.params.length > 0 && (
                <div style={{marginBottom: 10}}>
                  <b>Parámetros:</b>
                  <ul style={{margin: '6px 0 0 16px', padding: 0, fontSize: 14}}>
                    {entryDetalle.params.map((p, i) => (
                      <li key={i}><b>{typeof p === 'string' ? p : p.name}</b>{p.type ? `: ${p.type}` : ''}{p.desc ? ` — ${p.desc}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {entryDetalle.returns && entryDetalle.returns !== '' && (
                <div style={{marginBottom: 10}}><b>Retorna:</b> <span style={{fontSize: 14}}>{entryDetalle.returns}</span></div>
              )}
              {entryDetalle.examples && entryDetalle.examples.length > 0 && (
                <div style={{marginBottom: 10}}>
                  <b>Ejemplos:</b>
                  <ul style={{margin: '6px 0 0 16px', padding: 0, fontSize: 14}}>
                    {entryDetalle.examples.map((ex, i) => (
                      <li key={i}><pre style={{background: '#eaf1fb', padding: 8, borderRadius: 6, fontSize: 13, overflowX: 'auto'}}>{ex}</pre></li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{color: '#888', fontSize: 15}}>Selecciona un elemento para ver su detalle.</div>
          )}
        </div>
      </div>
    </div>
  );
}
