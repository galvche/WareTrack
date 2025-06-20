// Utilidades para obtener y analizar archivos fuente del proyecto

export async function getAllSourceFiles() {
  // Aquí deberías usar Node.js, Vite o un backend para obtener la lista real de archivos fuente
  // Para demo, devuelve los JS/JSX de src excepto doc/
  const context = require.context('../', true, /^(?!\.\/doc\/).*\.(js|jsx)$/);
  return context.keys().map(k => ({
    path: k.replace(/^\.\//, ''),
    content: context(k).toString()
  }));
}

export async function parseSourceFile(file) {
  // Analiza el archivo y extrae componentes, funciones, clases, hooks, etc.
  // Aquí puedes usar regex, AST, o librerías como react-docgen, doctrine, etc.
  // Para demo, devuelve un mock:
  return [
    {
      id: file.path,
      name: file.path.split('/').pop().replace(/\.[jt]sx?$/, ''),
      type: 'Componente',
      description: 'Descripción generada automáticamente del componente.',
      params: [],
      returns: '',
      examples: []
    }
  ];
}
