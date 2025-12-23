const fs = require('fs');
const path = require('path');

// Ler os arquivos
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('index.css', 'utf8');
const js = fs.readFileSync('index.js', 'utf8');

// Substituir as referências pelos conteúdos inline
let bundled = html
    .replace('<link rel="stylesheet" href="index.css">', `<style>${css}</style>`)
    .replace('<script src="index.js"></script>', `<script>${js}</script>`);

// Criar diretório dist se não existir
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Salvar o arquivo bundled
fs.writeFileSync('dist/index.html', bundled);

console.log('✓ Build concluído! Arquivo gerado em: dist/index.html');
