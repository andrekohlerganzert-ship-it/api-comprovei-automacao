// Importa o pool de conexões MySQL
import { pool } from '../config/db.js';

// Importa as funções que consultam a API da Comprovei
import { exportarWs601, exportarWs613 } from './comproveiService.js';

// Importa função para gerar HASH SHA256
// Utilizada para evitar registros duplicados
import { sha256 } from '../utils/hash.js';

// Valida se as datas informadas são válidas
import { validarPeriodo } from '../utils/date.js';


// =====================================================
// PROCURA UM CAMPO DENTRO DE UMA LINHA
// =====================================================
// Exemplo:
// get(row, ['Código Motorista', 'Codigo Motorista'])
//
// Retorna o primeiro campo encontrado
//
function get(row, names) {

  for (const name of names) {

    if (
      row[name] !== undefined &&
      row[name] !== null &&
      String(row[name]).trim() !== ''
    ) {
      return row[name];
    }
  }

  return null;
}


// =====================================================
// CONVERTE DATA PARA YYYY-MM-DD
// =====================================================
//
// Recebe:
//
// 01/06/2026
//
// Retorna:
//
// 2026-06-01
//
function toDate(value) {

  if (!value) return null;

  const v = String(value).trim();

  // Se já estiver no formato correto
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    return v.slice(0, 10);
  }

  // Converte DD/MM/YYYY para YYYY-MM-DD
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  return null;
}


// =====================================================
// CONVERTE TEXTO PARA NÚMERO
// =====================================================
//
// Recebe:
// 1.234,56
//
// Retorna:
// 1234.56
//
function toNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const v = String(value)
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : null;
}


// =====================================================
// CRIA REGISTRO DE IMPORTAÇÃO
// =====================================================
//
// Tabela:
// comprovei_importacoes
//
// Status inicial:
// iniciado
//
async function criarImportacao(
  ws,
  dataInicial,
  dataFinal
) {

  const [result] = await pool.query(
    `
    INSERT INTO comprovei_importacoes
    (
      ws,
      data_inicial,
      data_final,
      status
    )
    VALUES
    (
      ?, ?, ?, 'iniciado'
    )
    `,
    [
      ws,
      dataInicial,
      dataFinal
    ]
  );

  // Retorna ID criado
  return result.insertId;
}


// =====================================================
// FINALIZA IMPORTAÇÃO
// =====================================================
//
// Atualiza:
//
// status
// total_linhas
// total_inseridas
// mensagem
// url_arquivo
//
async function finalizarImportacao(
  id,
  status,
  totalLinhas,
  totalInseridas,
  mensagem,
  urlArquivo
) {

  await pool.query(
    `
    UPDATE comprovei_importacoes
    SET
      status=?,
      total_linhas=?,
      total_inseridas=?,
      mensagem=?,
      url_arquivo=?,
      finalizado_em=NOW()
    WHERE id=?
    `,
    [
      status,
      totalLinhas || 0,
      totalInseridas || 0,
      mensagem || null,
      urlArquivo || null,
      id
    ]
  );
}


// =====================================================
// IMPORTAÇÃO WS601
// =====================================================
export async function importarWs601(
  dataInicial,
  dataFinal
) {

  // Valida período informado
  validarPeriodo(
    dataInicial,
    dataFinal
  );

  // Cria histórico da importação
  const idImportacao =
    await criarImportacao(
      'WS601',
      dataInicial,
      dataFinal
    );

  let urlArquivo = null;

  try {

    // Consulta Comprovei
    const exported =
      await exportarWs601(
        dataInicial,
        dataFinal
      );

    const rows = exported.rows;

    urlArquivo =
      exported.urlArquivo;

    let inseridas = 0;

    // Percorre todas as linhas do CSV
    for (const row of rows) {

      // Gera HASH único
      const hash =
        sha256(
          `WS601|${JSON.stringify(row)}`
        );

      // Mapeia os campos
      const params = [

        hash,

        dataInicial,
        dataFinal,

        toDate(get(row, ['Data'])),

        get(row, ['Rota/Roteiro']),

        get(row, ['Motorista']),

        get(row, [
          'Código Motorista',
          'Codigo Motorista'
        ]),

        get(row, ['Placa']),

        get(row, ['Status']),

        toNumber(
          get(row, [
            'Qtd. Paradas',
            'Qtd Paradas'
          ])
        ),

        toNumber(
          get(row, [
            'Qtd. Documentos',
            'Qtd Documentos'
          ])
        ),

        toNumber(
          get(row, [
            'Qtd. Volumes',
            'Qtd Volumes'
          ])
        ),

        get(row, ['Transportadora']),

        get(row, ['Base Origem']),

        get(row, ['Base Destino']),

        // Salva linha inteira em JSON
        JSON.stringify(row)
      ];

      // Grava no banco
      //
      // INSERT IGNORE evita duplicados
      //
      const [result] =
        await pool.query(
          `
          INSERT IGNORE INTO comprovei_ws601_rotas
          (...)
          VALUES (...)
          `,
          params
        );

      inseridas +=
        result.affectedRows || 0;
    }

    // Marca sucesso
    await finalizarImportacao(
      idImportacao,
      'sucesso',
      rows.length,
      inseridas,
      'Importacao WS601 concluida',
      urlArquivo
    );

    return {
      ws: 'WS601',
      total_linhas: rows.length,
      total_inseridas: inseridas,
      id_importacao: idImportacao
    };

  } catch (err) {

    // Marca erro
    await finalizarImportacao(
      idImportacao,
      'erro',
      0,
      0,
      err.message,
      urlArquivo
    );

    throw err;
  }
}


// =====================================================
// IMPORTAÇÃO WS613
// =====================================================
//
// Funciona exatamente igual à WS601
//
// Diferença:
//
// Salva documentos ao invés de rotas
//
// Campos:
//
// Documento
// Chave
// Cliente
// Status
// Pedido
// Remessa
// Valor
// etc.
//
export async function importarWs613(
  dataInicial,
  dataFinal
) {

  validarPeriodo(
    dataInicial,
    dataFinal
  );

  const idImportacao =
    await criarImportacao(
      'WS613',
      dataInicial,
      dataFinal
    );

  let urlArquivo = null;

  try {

    const exported =
      await exportarWs613(
        dataInicial,
        dataFinal
      );

    const rows =
      exported.rows;

    urlArquivo =
      exported.urlArquivo;

    let inseridas = 0;

    for (const row of rows) {

      const hash =
        sha256(
          `WS613|${JSON.stringify(row)}`
        );

      // Monta os parâmetros
      // Documento, Chave, Cliente,
      // Cidade, Status, Pedido etc.

      // INSERT IGNORE
      // Grava somente registros novos
    }

    await finalizarImportacao(
      idImportacao,
      'sucesso',
      rows.length,
      inseridas,
      'Importacao WS613 concluida',
      urlArquivo
    );

  } catch (err) {

    await finalizarImportacao(
      idImportacao,
      'erro',
      0,
      0,
      err.message,
      urlArquivo
    );

    throw err;
  }
}


// =====================================================
// IMPORTAÇÃO COMPLETA
// =====================================================
//
// Executa:
//
// WS601
// +
// WS613
//
export async function importarTudo(
  dataInicial,
  dataFinal
) {

  const ws601 =
    await importarWs601(
      dataInicial,
      dataFinal
    );

  const ws613 =
    await importarWs613(
      dataInicial,
      dataFinal
    );

  return {
    ws601,
    ws613
  };
}
