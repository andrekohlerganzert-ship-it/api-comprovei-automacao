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

importRoutes.post('/teste-ws613-bruto', async (req, res) => {
  try {
    const { data_inicial, data_final } = req.body;

    const response = await fetch(
      'https://console-api.comprovei.com/exports/documentSAC',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization':
            'Basic ' +
            Buffer.from(
              `${process.env.COMPROVEI_USER}:${process.env.COMPROVEI_PASSWORD}`
            ).toString('base64')
        },
        body: JSON.stringify({
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
          campos: ['Documento', 'Emissão', 'Status', 'Chave']
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



importRoutes.post('/tudo', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = periodo(req);
    const result = await importarTudo(dataInicial, dataFinal);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, erro: err.message });
  }
});
