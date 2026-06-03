import dotenv from 'dotenv';
import { pool } from '../config/db.js';
import { schemaSql } from './schema.js';

dotenv.config();

export async function initDb() {
  const statements = schemaSql.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of statements) {
    await pool.query(sql);
  }
  return { ok: true, tabelas: ['comprovei_importacoes', 'comprovei_ws601_rotas', 'comprovei_ws613_documentos'] };
}

if (process.argv[1]?.endsWith('initDb.js')) {
  initDb()
    .then((r) => {
      console.log('Banco inicializado:', r);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro init-db:', err);
      process.exit(1);
    });
}
