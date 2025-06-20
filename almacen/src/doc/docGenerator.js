// Este módulo analiza el código fuente y genera documentación profesional y actualizada.
// Usa comentarios JSDoc, nombres, props y el propio código para deducir descripciones, tipos y ejemplos.

import { getAllSourceFiles, parseSourceFile } from "./fileUtils";

export async function generateDocumentation() {
  // Intenta cargar el JSON generado por Node
  try {
    const data = await fetch('/doc/generated-docs.json').then(r => r.json());
    if (data && data.entries && data.entries.length > 0) return data;
  } catch (e) {}
  // 1. Obtiene todos los archivos fuente relevantes
  const files = await getAllSourceFiles();
  let entries = [];
  for (const file of files) {
    const parsed = await parseSourceFile(file);
    entries = entries.concat(parsed);
  }
  // Si no hay nada, añade una demo para que la página no esté en blanco
  if (entries.length === 0) {
    entries = [
      {
        id: 'demo-component',
        name: 'DemoComponent',
        type: 'Componente',
        description: 'Este es un ejemplo de componente. Cuando el sistema esté conectado al análisis real del código, aquí aparecerán todos los componentes, funciones y clases de tu app.',
        params: [
          { name: 'title', type: 'string', desc: 'Título a mostrar' }
        ],
        returns: 'JSX.Element',
        examples: [
          '<DemoComponent title="Hola" />'
        ]
      },
      {
        id: 'demo-func',
        name: 'sumar',
        type: 'Función',
        description: 'Suma dos números.',
        params: [
          { name: 'a', type: 'number', desc: 'Primer sumando' },
          { name: 'b', type: 'number', desc: 'Segundo sumando' }
        ],
        returns: 'number',
        examples: [
          'sumar(2, 3) // 5'
        ]
      }
    ];
  }
  // 2. Organiza y deduce relaciones
  return { entries };
}
