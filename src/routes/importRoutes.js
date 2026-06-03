import express from 'express';
import { importarTudo, importarWs601, importarWs613 } from '../services/importService.js';

export const importRoutes = express.Router();

function periodo(req) {
  return {
    dataInicial: req.body.data_inicial,
    dataFinal: req.body.data_final
  };
}

importRoutes.post('/ws601', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = periodo(req);
    const result = await importarWs601(dataInicial, dataFinal);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, erro: err.message });
  }
});

importRoutes.post('/ws613', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = periodo(req);
    const result = await importarWs613(dataInicial, dataFinal);
    res.json({ ok: true, result });
  } catch (err) {
  console.error('STATUS:', err.response?.status);
  console.error('DATA:', err.response?.data);
  throw new Error(JSON.stringify(err.response?.data || err.message));
}
});

importRoutes.post('/tudo', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = periodo(req);
    const result = await importarTudo(dataInicial, dataFinal);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, erro: err.message });
  }
});
