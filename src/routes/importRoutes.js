// Importa o framework Express
// Responsável por criar as rotas da API
import express from 'express';

// Importa as funções de importação
//
// importarWs601() -> importa apenas rotas
// importarWs613() -> importa apenas documentos
// importarTudo()  -> importa WS601 + WS613
//
import {
  importarTudo,
  importarWs601,
  importarWs613
} from '../services/importService.js';


// ======================================================
// CRIA O GRUPO DE ROTAS
// ======================================================
//
// Todas as rotas deste arquivo serão acessadas através:
//
// /importar/ws601
// /importar/ws613
// /importar/tudo
//
export const importRoutes = express.Router();


// ======================================================
// FUNÇÃO AUXILIAR
// ======================================================
//
// Lê as datas enviadas pelo Postman
//
// Exemplo:
//
// {
//   "data_inicial":"2026-06-01",
//   "data_final":"2026-06-03"
// }
//
function periodo(req) {

  return {

    // Data inicial enviada no body
    dataInicial: req.body.data_inicial,

    // Data final enviada no body
    dataFinal: req.body.data_final
  };
}


// ======================================================
// IMPORTAÇÃO WS601
// ======================================================
//
// Endpoint:
//
// POST /importar/ws601
//
// Exemplo:
//
// {
//   "data_inicial":"2026-06-01",
//   "data_final":"2026-06-03"
// }
//
importRoutes.post('/ws601', async (req, res) => {

  try {

    // Obtém período enviado pelo usuário
    const {
      dataInicial,
      dataFinal
    } = periodo(req);

    // Executa importação da WS601
    //
    // Fluxo:
    //
    // Comprovei
    // ↓
    // CSV
    // ↓
    // MySQL
    //
    const result =
      await importarWs601(
        dataInicial,
        dataFinal
      );

    // Retorna sucesso
    res.json({
      ok: true,
      result
    });

  } catch (err) {

    // Retorna erro para o usuário
    res.status(400).json({
      ok: false,
      erro: err.message
    });
  }
});


// ======================================================
// IMPORTAÇÃO WS613
// ======================================================
//
// Endpoint:
//
// POST /importar/ws613
//
// Exemplo:
//
// {
//   "data_inicial":"2026-06-01",
//   "data_final":"2026-06-03"
// }
//
importRoutes.post('/ws613', async (req, res) => {

  try {

    // Obtém datas do body
    const {
      dataInicial,
      dataFinal
    } = periodo(req);

    // Executa importação da WS613
    //
    // Fluxo:
    //
    // Comprovei
    // ↓
    // Arquivo CSV
    // ↓
    // MySQL
    //
    const result =
      await importarWs613(
        dataInicial,
        dataFinal
      );

    // Retorna sucesso
    res.json({
      ok: true,
      result
    });

  } catch (err) {

    // Log no console do Railway
    console.error(
      '[WS613] ERRO:',
      err.message
    );

    // Retorna erro para API
    res.status(400).json({
      ok: false,
      erro: err.message
    });
  }
});


// ======================================================
// TESTE DIRETO DA WS613
// ======================================================
//
// Esta rota NÃO grava no banco
//
// Objetivo:
//
// Validar:
//
// - Usuário
// - Senha
// - Endpoint
// - Retorno da Comprovei
//
// Endpoint:
//
// POST /importar/teste-ws613-bruto
//
importRoutes.post(
  '/teste-ws613-bruto',
  async (req, res) => {

    try {

      // Datas recebidas
      const {
        data_inicial,
        data_final
      } = req.body;

      // Faz chamada direta para Comprovei
      const response =
        await fetch(
          'https://console-api.comprovei.com/exports/documentSAC',
          {

            method: 'POST',

            headers: {

              // Tipo do conteúdo
              'Content-Type':
                'application/json',

              // Autenticação Basic Auth
              //
              // Igual Postman
              //
              'Authorization':
                'Basic ' +
                Buffer.from(
                  `${process.env.COMPROVEI_USER}:${process.env.COMPROVEI_PASSWORD}`
                ).toString('base64')
            },

            body: JSON.stringify({

              // Formato desejado
              formato_exportacao: 'csv',

              // Filtros
              filtros: {

                data_inicial,
                data_final,

                data_emissao_inicial:
                  data_inicial,

                data_emissao_final:
                  data_final,

                data_rota_inicial:
                  data_inicial,

                data_rota_final:
                  data_final,

                excluir_transbordos:
                  false
              },

              // Campos solicitados
              campos: [
                'Documento',
                'Emissão',
                'Status',
                'Chave'
              ]
            })
          }
        );

      // Lê retorno da Comprovei
      const texto =
        await response.text();

      // Retorna para o Postman
      res.json({

        ok: response.ok,

        status: response.status,

        retorno: texto
      });

    } catch (err) {

      // Erro da comunicação
      res.status(500).json({
        ok: false,
        erro: err.message
      });
    }
  }
);


// ======================================================
// IMPORTAÇÃO COMPLETA
// ======================================================
//
// Endpoint:
//
// POST /importar/tudo
//
// Executa:
//
// WS601
// +
// WS613
//
importRoutes.post('/tudo', async (req, res) => {

  try {

    // Obtém período informado
    const {
      dataInicial,
      dataFinal
    } = periodo(req);

    // Executa ambas importações
    const result =
      await importarTudo(
        dataInicial,
        dataFinal
      );

    // Retorna resultado
    res.json({
      ok: true,
      result
    });

  } catch (err) {

    // Retorna erro
    res.status(400).json({
      ok: false,
      erro: err.message
    });
  }
});
