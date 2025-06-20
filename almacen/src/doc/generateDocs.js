// Script para auto-generar documentación técnica de la app analizando el código fuente
// Requiere: @babel/parser, @babel/traverse, fs-extra, path, glob

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC_DIR = path.resolve(__dirname, '../');
const OUTPUT = path.resolve(__dirname, 'generated-docs.json');
const FILE_PATTERNS = [
  'components/**/*.js',
  'hooks/**/*.js',
  'pages/**/*.js',
  'SAP/**/*.js',
  'services/**/*.js',
  'utils/**/*.js',
  '*.js',
];

function getFiles() {
  let files = new Set();
  FILE_PATTERNS.forEach(pattern => {
    glob.sync(path.join(SRC_DIR, pattern)).forEach(f => files.add(f));
  });
  return Array.from(files);
}

// Añadido: Generador de plantillas JSDoc y descripción automática si no existe JSDoc
function autoDescribe(name, type, params = [], extra = {}) {
  let desc = '';
  if (type === 'component') {
    desc = `Componente React llamado ${name}`;
    if (params.length) desc += ` que recibe las props: ${params.join(', ')}.`;
    else desc += '.';
    desc += ' Renderiza una interfaz de usuario y puede gestionar estado y eventos.';
  } else if (type === 'hook') {
    desc = `Hook personalizado de React llamado ${name}`;
    if (params.length) desc += ` que acepta los parámetros: ${params.join(', ')}.`;
    else desc += '.';
    desc += ' Permite reutilizar lógica de estado o efectos en componentes.';
  } else if (type === 'class') {
    desc = `Clase llamada ${name}`;
    if (extra.superClass) desc += ` que extiende de ${extra.superClass}.`;
    else desc += '.';
    desc += ' Puede contener métodos y propiedades para encapsular lógica.';
  } else if (type === 'function') {
    desc = `Función llamada ${name}`;
    if (params.length) desc += ` que recibe los parámetros: ${params.join(', ')}.`;
    else desc += '.';
    desc += ' Ejecuta una operación específica y puede retornar un valor.';
  } else if (type === 'const') {
    desc = `Constante exportada llamada ${name}.`;
  } else {
    desc = `${type} llamado ${name}.`;
  }
  if (extra.returns) {
    desc += `\n\nRetorna: ${extra.returns}`;
  }
  if (extra.details) {
    desc += `\n\nDetalles: ${extra.details}`;
  }
  return desc;
}

function extractJsDoc(node) {
  if (node.leadingComments) {
    const comment = node.leadingComments[node.leadingComments.length - 1];
    if (comment && comment.type === 'CommentBlock') {
      const lines = comment.value.split('\n').map(l => l.replace(/^\s*\* ?/, ''));
      const description = lines.filter(l => !l.startsWith('@')).join(' ').trim();
      const tags = {};
      lines.forEach(l => {
        const match = l.match(/^@(\w+)\s+(.*)$/);
        if (match) tags[match[1]] = match[2];
      });
      return { description, ...tags };
    }
  }
  // Si no hay JSDoc, busca comentarios de línea previos
  if (node.leadingComments) {
    const lineComment = node.leadingComments.find(c => c.type === 'CommentLine');
    if (lineComment) {
      return { description: lineComment.value.trim() };
    }
  }
  // Si no hay nada, devuelve vacío
  return {};
}

function normalizeType(type, name) {
  if (type === 'component') return 'componente';
  if (type === 'hook') return 'hook';
  if (type === 'class') return 'clase';
  if (type === 'const') return 'constante';
  if (type === 'function') return 'función';
  // Detección por nombre
  if (name && name.startsWith('use')) return 'hook';
  return 'otro';
}

function analyzeFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'classProperties'],
    attachComment: true,
  });
  const items = [];
  traverse(ast, {
    enter(path) {
      // Funciones
      if (path.isFunctionDeclaration()) {
        const { name } = path.node.id || {};
        if (!name) return;
        let jsdoc = extractJsDoc(path.node);
        const params = path.node.params.map(p => p.name || '');
        let type = name.startsWith('use') ? 'hook' : 'function';
        if (!jsdoc.description) {
          jsdoc.description = autoDescribe(name, type, params);
        }
        items.push({
          name,
          type: normalizeType(type, name),
          ...jsdoc,
          params,
          returns: jsdoc.returns || '',
          file,
          loc: path.node.loc && path.node.loc.start.line,
          export: path.parent.type === 'ExportNamedDeclaration' ? 'named' : undefined,
        });
      }
      // Componentes de función
      if (
        path.isVariableDeclaration() &&
        path.node.declarations.length === 1 &&
        path.node.declarations[0].init &&
        (path.node.declarations[0].init.type === 'ArrowFunctionExpression' ||
          path.node.declarations[0].init.type === 'FunctionExpression')
      ) {
        const decl = path.node.declarations[0];
        const name = decl.id.name;
        let jsdoc = extractJsDoc(path.node);
        let isComponent = false;
        traverse(decl.init.body, {
          JSXElement() { isComponent = true; },
        }, path.scope, path);
        const params = decl.init.params.map(p => p.name || '');
        let type = isComponent ? 'component' : (name.startsWith('use') ? 'hook' : 'function');
        if (!jsdoc.description) {
          jsdoc.description = autoDescribe(name, type, params);
        }
        items.push({
          name,
          type: normalizeType(type, name),
          ...jsdoc,
          params,
          returns: jsdoc.returns || '',
          file,
          loc: decl.loc && decl.loc.start.line,
          export: path.parent.type === 'ExportNamedDeclaration' ? 'named' : undefined,
        });
      }
      // Clases
      if (path.isClassDeclaration()) {
        const { name } = path.node.id || {};
        if (!name) return;
        let jsdoc = extractJsDoc(path.node);
        if (!jsdoc.description) {
          jsdoc.description = autoDescribe(name, 'class');
        }
        items.push({
          name,
          type: normalizeType('class', name),
          ...jsdoc,
          file,
          loc: path.node.loc && path.node.loc.start.line,
          export: path.parent.type === 'ExportNamedDeclaration' ? 'named' : undefined,
        });
      }
      // Constantes exportadas
      if (
        path.isVariableDeclaration() &&
        path.parent.type === 'ExportNamedDeclaration'
      ) {
        path.node.declarations.forEach(decl => {
          if (decl.id && decl.id.name) {
            let jsdoc = extractJsDoc(path.node);
            if (!jsdoc.description) {
              jsdoc.description = autoDescribe(decl.id.name, 'const');
            }
            items.push({
              name: decl.id.name,
              type: normalizeType('const', decl.id.name),
              ...jsdoc,
              file,
              loc: decl.loc && decl.loc.start.line,
              export: 'named',
            });
          }
        });
      }
    },
  });
  return items;
}

function main() {
  const files = getFiles();
  let docs = [];
  files.forEach(file => {
    try {
      docs = docs.concat(analyzeFile(file));
    } catch (e) {
      console.error('Error analizando', file, e.message);
    }
  });
  fs.writeJsonSync(OUTPUT, docs, { spaces: 2 });
  console.log(`Documentación generada en ${OUTPUT} con ${docs.length} elementos.`);
}

if (require.main === module) main();
