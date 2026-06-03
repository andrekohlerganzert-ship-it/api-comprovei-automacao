import express from 'express';
import { pool } from '../config/db.js';

export const dataRoutes = express.Router();

function buildDateWhere(req, column = 'data_importacao') {
  const params = [];
  let where = 'WHERE 1=1';
  if (req.query.data_inicial) {
    where += ` AND DATE(${column}) >= ?`;
    params.push(req.query.data_inicial);
  }
  if (req.query.data_final) {
    where += ` AND DATE(${column}) <= ?`;
    params.push(req.query.data_final);
  }
  return { where, params };
}

dataRoutes.get('/rotas', async (req, res) => {
  const { where, params } = buildDateWhere(req, 'COALESCE(data_rota, data_importacao)');
  const limit = Math.min(Number(req.query.limit || 1000), 10000);
  const [rows] = await pool.query(
    `SELECT * FROM comprovei_ws601_rotas ${where} ORDER BY id DESC LIMIT ${limit}`,
    params
  );
  res.json({ ok: true, total: rows.length, rows });
});

dataRoutes.get('/documentos', async (req, res) => {
  const { where, params } = buildDateWhere(req, 'COALESCE(data_rota, emissao, data_importacao)');
  const limit = Math.min(Number(req.query.limit || 1000), 10000);
  const [rows] = await pool.query(
    `SELECT * FROM comprovei_ws613_documentos ${where} ORDER BY id DESC LIMIT ${limit}`,
    params
  );
  res.json({ ok: true, total: rows.length, rows });
});

dataRoutes.get('/historico', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  const [rows] = await pool.query(
    `SELECT * FROM comprovei_importacoes ORDER BY id DESC LIMIT ${limit}`
  );
  res.json({ ok: true, total: rows.length, rows });
});
