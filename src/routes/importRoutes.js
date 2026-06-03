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


router.post('/ws613', async (req, res) => {
  try {

    const { data_inicial, data_final } = req.body;

    const response = await fetch(
      'https://console-api.comprovei.com/exports/documentSAC',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headers: {
            username: process.env.COMPROVEI_USER,
            password: process.env.COMPROVEI_PASSWORD
          },
          body: {
            formato_exportacao: 'json',
            filtros: {
              data_inicial,
              data_final
            }
          }
        })
      }
    );

    const data = await response.json();

    res.json({
      ok: true,
      retorno: data
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      erro: error.message
    });

  }
});

importRoutes.post('/ws613', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = periodo(req);
    const result = await importarWs613(dataInicial, dataFinal);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, erro: err.message });
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
