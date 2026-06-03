import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { initDb } from './sql/initDb.js';
import { importRoutes } from './routes/importRoutes.js';
import { dataRoutes } from './routes/dataRoutes.js';
import { startScheduler } from './jobs/scheduler.js';
  
dotenv.config();

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

// teste usuario

app.get('/debug-comprovei', (req, res) => {
  res.json({
    COMPROVEI_USER: process.env.COMPROVEI_USER,
    COMPROVEI_PASSWORD_EXISTE: !!process.env.COMPROVEI_PASSWORD,
    tamanhoSenha: process.env.COMPROVEI_PASSWORD?.length || 0
  });
});

// TESTE WS204
app.get('/teste-ws204', async (req, res) => {
  try {

    const response = await fetch(
      'https://api.comprovei.com.br/api/1.1/documents/getStatus?key=' + req.query.key,
      {
        method: 'GET',
        headers: {
          'Authorization':
            'Basic ' +
            Buffer.from(
              `${process.env.COMPROVEI_USER}:${process.env.COMPROVEI_PASSWORD}`
            ).toString('base64')
        }
      }
    );

    const data = await response.json();

    res.json({
      ok: true,
      status: response.status,
      retorno: data
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      erro: error.message
    });

  }
});



app.use('/importar', importRoutes);
app.post('/teste-ws613-bruto', async (req, res) => {
  try {
    const { data_inicial, data_final } = req.body;

    const response = await fetch(
      'https://console-api.comprovei.com/exports/documentSAC',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: {
            username: process.env.COMPROVEI_USER,
            password: process.env.COMPROVEI_PASSWORD
          },
          body: {
            formato_exportacao: 'csv',
            filtros: {
              data_inicial,
              data_final,
              data_emissao_inicial: data_inicial,
              data_emissao_final: data_final,
              data_rota_inicial: data_inicial,
              data_rota_final: data_final,
              excluir_transbordos: false
            },
            campos: ['Documento', 'Emissão', 'Status', 'Chave', 'Rota/Roteiro']
          }
        })
      }
    );

    const texto = await response.text();

    res.json({
      ok: response.ok,
      status: response.status,
      retorno: texto
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});




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
