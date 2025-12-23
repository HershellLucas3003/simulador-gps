const { getConnection } = require('./conection');

async function testarConexao() {
  try {
    const pool = await getConnection();
    console.log('Conexão bem-sucedida!');
    await pool.close();
  } catch (err) {
    console.error('Erro ao conectar:', err);
  }
}

testarConexao();