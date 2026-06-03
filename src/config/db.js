// Importa a biblioteca mysql2 utilizando Promises
// Permite usar await nas consultas ao banco
import mysql from 'mysql2/promise';

// Importa o dotenv
// Responsável por carregar as variáveis do arquivo .env
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env para process.env
dotenv.config();


// =====================================================
// CRIAÇÃO DO POOL DE CONEXÕES MYSQL
// =====================================================
//
// Pool = conjunto de conexões abertas com o banco
//
// Vantagens:
// - Não abre uma conexão nova a cada consulta
// - Melhor performance
// - Menor consumo de recursos
//
export const pool = mysql.createPool({

  // Endereço do servidor MySQL
  // Exemplo Railway:
  // mysql.railway.internal
  host: process.env.MYSQLHOST,

  // Porta do MySQL
  // Normalmente 3306
  port: Number(process.env.MYSQLPORT || 3306),

  // Usuário do banco
  // Exemplo:
  // root
  user: process.env.MYSQLUSER,

  // Senha do banco
  password: process.env.MYSQLPASSWORD,

  // Nome do banco
  // Exemplo:
  // railway
  database: process.env.MYSQLDATABASE,

  // Aguarda uma conexão livre quando todas estiverem ocupadas
  waitForConnections: true,

  // Quantidade máxima de conexões simultâneas
  // Pode aumentar para 20 ou 50 dependendo da carga
  connectionLimit: 10,

  // Quantidade de requisições em fila
  // 0 = sem limite
  queueLimit: 0,

  // Charset utilizado
  // Suporta:
  // - acentos
  // - emojis
  // - caracteres especiais
  charset: 'utf8mb4'
});


// =====================================================
// TESTE DE CONEXÃO COM O BANCO
// =====================================================
//
// Esta função é utilizada para validar se:
// - o banco está online
// - usuário e senha estão corretos
// - a conexão está funcionando
//
export async function testConnection() {

  // Executa uma consulta simples no MySQL
  //
  // NOW() retorna a data/hora atual do servidor
  //
  // Exemplo:
  // 2026-06-03 18:30:15
  //
  const [rows] = await pool.query(
    'SELECT NOW() AS agora'
  );

  // Retorna apenas o primeiro registro
  //
  // Resultado:
  // {
  //   agora: '2026-06-03T21:30:15.000Z'
  // }
  //
  return rows[0];
}
