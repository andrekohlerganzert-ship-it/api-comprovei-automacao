import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { initDb } from './sql/initDb.js';
import { importRoutes } from './routes/importRoutes.js';
import { dataRoutes } from './routes/dataRoutes.js';
import { startScheduler } from './jobs/scheduler.js';

dotenv.config();

const axios = require('axios');

app.get('/teste-comprovei', async (req, res) => {
  try {

    const response = await axios.post(
      'https://api.comprovei.com.br/api/1.1/util/export/route',
      {
        headers: {
          username: process.env.COMPROVEI_USER,
          password: process.env.COMPROVEI_PASSWORD
        },
        body: {
          formato_exportacao: "json",
          filtros: {
            data_inicial: "2026-06-03",
            data_final: "2026-06-03"
          },
          campos: ["Documento"]
        }
      }
    );

    return res.json({
      ok: true,
      status: response.status,
      retorno: response.data
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      status: error.response?.status,
      erro: error.response?.data || error.message
    });

  }
});

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/', async (req, res) => {
  try {
    const db = await testConnection();
    res.json({
      ok: true,
      sistema: 'API Comprovei WS601 + WS613',
      banco: db,
      endpoints: ['/admin/init-db', '/importar/ws601', '/importar/ws613', '/importar/tudo', '/dados/rotas', '/dados/documentos', '/dados/historico']
    });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post('/admin/init-db', async (req, res) => {
  try {
    const result = await initDb();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.use('/importar', importRoutes);
app.use('/dados', dataRoutes);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Servidor rodando na porta ${port}`);
  try {
    await initDb();
    console.log('Tabelas verificadas/criadas');
  } catch (err) {
    console.error('Erro ao inicializar tabelas:', err.message);
  }
  startScheduler();
});
