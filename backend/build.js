const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Iniciando build do backend...');

// Criar diretório dist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Copiar arquivos necessários
const filesToCopy = [
    'server.js',
    'package.json',
    'db',
    'src'
];

filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    
    if (fs.statSync(source).isDirectory()) {
        copyDir(source, dest);
    } else {
        fs.copyFileSync(source, dest);
    }
});

// Instalar apenas dependências de produção
console.log('📦 Instalando dependências de produção...');
try {
    process.chdir(distDir);
    execSync('npm install --omit=dev', { stdio: 'inherit' });
    process.chdir(__dirname);
} catch (error) {
    console.error('Erro ao instalar dependências:', error.message);
    process.exit(1);
}

console.log('✓ Build concluído! Arquivos em: dist/');
console.log('\nPara subir no servidor:');
console.log('1. Comprima a pasta dist/ (ex: tar -czf backend.tar.gz dist/)');
console.log('2. Copie para o servidor (ex: scp backend.tar.gz user@server:~/)');
console.log('3. Extraia no servidor (ex: tar -xzf backend.tar.gz)');
console.log('4. Configure o .env com as variáveis de ambiente');
console.log('5. Execute: node server.js');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
