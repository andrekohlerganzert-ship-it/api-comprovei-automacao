// Importa o framework Express
// Responsável por criar as rotas da API
import express from 'express';

// Importa o pool de conexões MySQL
// Utilizado para executar consultas no banco
import { pool } from '../config/db.js';


// ======================================================
// CRIA O GRUPO DE ROTAS DE CONSULTA
// ======================================================
//
// Todas as rotas serão acessadas através:
//
// /dados/rotas
// /dados/documentos
// /dados/historico
//
export const dataRoutes = express.Router();


// ======================================================
// MONTA FILTRO DE DATA DINÂMICO
// ======================================================
//
// Exemplo:
//
// /dados/rotas?data_inicial=2026-06-01
//
// /dados/rotas?data_inicial=2026-06-01&data_final=2026-06-03
//
// Esta função gera automaticamente:
//
// WHERE DATE(data_importacao) >= '2026-06-01'
//
// ou
//
// WHERE DATE(data_importacao)
// BETWEEN '2026-06-01' AND '2026-06-03'
//
function buildDateWhere(req, column = 'data_importacao') {

  // Vetor que armazenará os parâmetros
  //
  // Exemplo:
  // ['2026-06-01']
  //
  const params = [];

  // Inicia o WHERE
  //
  // WHERE 1=1
  //
  // Facilita adicionar filtros posteriormente
  //
  let where = 'WHERE 1=1';

  // ==========================================
  // FILTRO DATA INICIAL
  // ==========================================
  //
  // Exemplo:
  //
  // ?data_inicial=2026-06-01
  //
  if (req.query.data_inicial) {

    where += ` AND DATE(${column}) >= ?`;

    params.push(
      req.query.data_inicial
    );
  }

  // ==========================================
  // FILTRO DATA FINAL
  // ==========================================
  //
  // Exemplo:
  //
  // ?data_final=2026-06-03
  //
  if (req.query.data_final) {

    where += ` AND DATE(${column}) <= ?`;

    params.push(
      req.query.data_final
    );
  }

  // Retorna o SQL e os parâmetros
  return {
    where,
    params
  };
}


// ======================================================
// CONSULTA ROTAS WS601
// ======================================================
//
// Endpoint:
//
// GET /dados/rotas
//
// GET /dados/rotas?data_inicial=2026-06-01
//
// GET /dados/rotas?data_inicial=2026-06-01&data_final=2026-06-03
//
dataRoutes.get('/rotas', async (req, res) => {

  // Cria filtros usando:
  //
  // data_rota
  //
  // Se data_rota for nula:
  //
  // data_importacao
  //
  const { where, params } =
    buildDateWhere(
      req,
      'COALESCE(data_rota, data_importacao)'
    );

  // Limita a quantidade máxima
  //
  // Padrão:
  // 1000 registros
  //
  // Máximo:
  // 10000 registros
  //
  const limit = Math.min(
    Number(req.query.limit || 1000),
    10000
  );

  // Executa consulta MySQL
  const [rows] = await pool.query(
    `
      SELECT *
      FROM comprovei_ws601_rotas
      ${where}
      ORDER BY id DESC
      LIMIT ${limit}
    `,
    params
  );

  // Retorna resultado
  res.json({
    ok: true,
    total: rows.length,
    rows
  });
});


// ======================================================
// CONSULTA DOCUMENTOS WS613
// ======================================================
//
// Endpoint:
//
// GET /dados/documentos
//
// GET /dados/documentos?data_inicial=2026-06-01
//
dataRoutes.get('/documentos', async (req, res) => {

  // Tenta filtrar por:
  //
  // data_rota
  // emissao
  // data_importacao
  //
  const { where, params } =
    buildDateWhere(
      req,
      'COALESCE(data_rota, emissao, data_importacao)'
    );

  // Limita quantidade
  const limit = Math.min(
    Number(req.query.limit || 1000),
    10000
  );

  // Consulta documentos
  const [rows] = await pool.query(
    `
      SELECT *
      FROM comprovei_ws613_documentos
      ${where}
      ORDER BY id DESC
      LIMIT ${limit}
    `,
    params
  );

  // Retorna JSON
  res.json({
    ok: true,
    total: rows.length,
    rows
  });
});


// ======================================================
// CONSULTA HISTÓRICO DE IMPORTAÇÕES
// ======================================================
//
// Endpoint:
//
// GET /dados/historico
//
// Exibe:
//
// - Data da importação
// - Quantidade de linhas
// - Quantidade inserida
// - Status
// - WS utilizada
//
dataRoutes.get('/historico', async (req, res) => {

  // Limite padrão:
  // 100 registros
  //
  // Máximo:
  // 1000 registros
  //
  const limit = Math.min(
    Number(req.query.limit || 100),
    1000
  );

  // Consulta histórico
  const [rows] = await pool.query(
    `
      SELECT *
      FROM comprovei_importacoes
      ORDER BY id DESC
      LIMIT ${limit}
    `
  );

  // Retorna resultado
  res.json({
    ok: true,
    total: rows.length,
    rows
  });
});
