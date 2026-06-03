import { pool } from '../config/db.js';
import { exportarWs601, exportarWs613 } from './comproveiService.js';
import { sha256 } from '../utils/hash.js';
import { validarPeriodo } from '../utils/date.js';

function get(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') return row[name];
  }
  return null;
}

function toDate(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const v = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function criarImportacao(ws, dataInicial, dataFinal) {
  const [result] = await pool.query(
    `INSERT INTO comprovei_importacoes (ws, data_inicial, data_final, status) VALUES (?, ?, ?, 'iniciado')`,
    [ws, dataInicial, dataFinal]
  );
  return result.insertId;
}

async function finalizarImportacao(id, status, totalLinhas, totalInseridas, mensagem, urlArquivo) {
  await pool.query(
    `UPDATE comprovei_importacoes
     SET status=?, total_linhas=?, total_inseridas=?, mensagem=?, url_arquivo=?, finalizado_em=NOW()
     WHERE id=?`,
    [status, totalLinhas || 0, totalInseridas || 0, mensagem || null, urlArquivo || null, id]
  );
}

export async function importarWs601(dataInicial, dataFinal) {
  validarPeriodo(dataInicial, dataFinal);
  const idImportacao = await criarImportacao('WS601', dataInicial, dataFinal);
  let urlArquivo = null;
  try {
    const exported = await exportarWs601(dataInicial, dataFinal);
    const rows = exported.rows;
    urlArquivo = exported.urlArquivo;
    let inseridas = 0;

    for (const row of rows) {
      const hash = sha256(`WS601|${JSON.stringify(row)}`);
      const params = [
        hash, dataInicial, dataFinal,
        toDate(get(row, ['Data'])),
        get(row, ['Rota/Roteiro']),
        get(row, ['Motorista']),
        get(row, ['Código Motorista', 'Codigo Motorista']),
        get(row, ['Placa']),
        get(row, ['Status']),
        toNumber(get(row, ['Qtd. Paradas', 'Qtd Paradas'])),
        toNumber(get(row, ['Qtd. Documentos', 'Qtd Documentos'])),
        toNumber(get(row, ['Qtd. Volumes', 'Qtd Volumes'])),
        get(row, ['Transportadora']),
        get(row, ['Base Origem']),
        get(row, ['Base Destino']),
        JSON.stringify(row)
      ];

      const [result] = await pool.query(
        `INSERT IGNORE INTO comprovei_ws601_rotas
        (hash_linha, data_inicial_importacao, data_final_importacao, data_rota, rota_roteiro, motorista, codigo_motorista, placa, status_rota, qtd_paradas, qtd_documentos, qtd_volumes, transportadora, base_origem, base_destino, dados_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        params
      );
      inseridas += result.affectedRows || 0;
    }

    await finalizarImportacao(idImportacao, 'sucesso', rows.length, inseridas, 'Importacao WS601 concluida', urlArquivo);
    return { ws: 'WS601', total_linhas: rows.length, total_inseridas: inseridas, id_importacao: idImportacao };
  } catch (err) {
    await finalizarImportacao(idImportacao, 'erro', 0, 0, err.message, urlArquivo);
    throw err;
  }
}

export async function importarWs613(dataInicial, dataFinal) {
  validarPeriodo(dataInicial, dataFinal);
  const idImportacao = await criarImportacao('WS613', dataInicial, dataFinal);
  let urlArquivo = null;
  try {
    const exported = await exportarWs613(dataInicial, dataFinal);
    const rows = exported.rows;
    urlArquivo = exported.urlArquivo;
    let inseridas = 0;

    for (const row of rows) {
      const hash = sha256(`WS613|${JSON.stringify(row)}`);
      const params = [
        hash, dataInicial, dataFinal,
        get(row, ['Documento']),
        get(row, ['Chave']),
        toDate(get(row, ['Emissão', 'Emissao'])),
        get(row, ['Embarcador']),
        get(row, ['CNPJ Embarcador']),
        get(row, ['Cliente']),
        get(row, ['Cidade Destino']),
        get(row, ['UF Destino']),
        get(row, ['Status']),
        get(row, ['Ultima Ocorrência', 'Última Ocorrência', 'Ultima Ocorrencia']),
        toDate(get(row, ['Data Finalização', 'Data Finalizacao'])),
        get(row, ['Rota/Roteiro']),
        get(row, ['Motorista']),
        get(row, ['Placa']),
        toDate(get(row, ['Data da rota', 'Data da Rota'])),
        toNumber(get(row, ['Valor'])),
        toNumber(get(row, ['Volume'])),
        toNumber(get(row, ['Qtd volumes', 'Qtd Volumes'])),
        get(row, ['Pedido']),
        get(row, ['Remessa']),
        JSON.stringify(row)
      ];

      const [result] = await pool.query(
        `INSERT IGNORE INTO comprovei_ws613_documentos
        (hash_linha, data_inicial_importacao, data_final_importacao, documento, chave, emissao, embarcador, cnpj_embarcador, cliente, cidade_destino, uf_destino, status_documento, ultima_ocorrencia, data_finalizacao, rota_roteiro, motorista, placa, data_rota, valor, volume, qtd_volumes, pedido, remessa, dados_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        params
      );
      inseridas += result.affectedRows || 0;
    }

    await finalizarImportacao(idImportacao, 'sucesso', rows.length, inseridas, 'Importacao WS613 concluida', urlArquivo);
    return { ws: 'WS613', total_linhas: rows.length, total_inseridas: inseridas, id_importacao: idImportacao };
  } catch (err) {
    await finalizarImportacao(idImportacao, 'erro', 0, 0, err.message, urlArquivo);
    throw err;
  }
}

export async function importarTudo(dataInicial, dataFinal) {
  const ws601 = await importarWs601(dataInicial, dataFinal);
  const ws613 = await importarWs613(dataInicial, dataFinal);
  return { ws601, ws613 };
}
