// Importa o axios, usado para fazer chamadas HTTP
import axios from 'axios';

// Importa as URLs das APIs WS601 e WS613
import { COMPROVEI } from '../config/comprovei.js';

// Função que extrai CSV de dentro de arquivo ZIP
import { extractFirstCsvFromZip } from '../utils/zip.js';

// Função que transforma CSV em array de objetos
import { parseCsv } from '../utils/csv.js';


// Campos que serão solicitados na exportação WS601
const WS601_CAMPOS = [
  'Data',
  'CD',
  'Rota/Roteiro',
  'Motorista',
  'Placa',
  'Status'
];


// Campos que serão solicitados na exportação WS613
const WS613_CAMPOS = [
  'Documento',
  'Emissão',
  'Status',
  'Chave',
  'Rota/Roteiro',
  'Motorista',
  'Placa'
];


// Valida se usuário e senha existem no Railway
function credentials() {
  if (!process.env.COMPROVEI_USER || !process.env.COMPROVEI_PASSWORD) {
    throw new Error('Configure COMPROVEI_USER e COMPROVEI_PASSWORD nas variáveis do Railway');
  }

  return {
    username: process.env.COMPROVEI_USER,
    password: process.env.COMPROVEI_PASSWORD
  };
}


// Função principal que chama WS601 ou WS613
async function chamarComprovei({ ws, dataInicial, dataFinal }) {

  // Busca a configuração da API no arquivo config/comprovei.js
  const config = COMPROVEI[ws.toLowerCase()];

  // Se não achar a URL da API, gera erro
  if (!config?.url) {
    throw new Error(`Configuração da ${ws} não encontrada`);
  }

  // Escolhe os campos conforme a API chamada
  const campos = ws === 'WS601' ? WS601_CAMPOS : WS613_CAMPOS;

  // Monta os filtros de data
  const filtros =
    ws === 'WS601'
      ? {
          // WS601 usa filtro simples
          data_inicial: dataInicial,
          data_final: dataFinal
        }
      : {
          // WS613 precisa de filtros mais completos
          data_inicial: dataInicial,
          data_final: dataFinal,
          data_emissao_inicial: dataInicial,
          data_emissao_final: dataFinal,
          data_rota_inicial: dataInicial,
          data_rota_final: dataFinal,
          excluir_transbordos: false
        };

  let payload;
  let axiosConfig;

  // WS613 usa Basic Auth, igual ao Postman
  if (ws === 'WS613') {
    payload = {
      formato_exportacao: 'csv',
      filtros,
      campos
    };

    axiosConfig = {
      timeout: 120000,
      auth: {
        username: process.env.COMPROVEI_USER,
        password: process.env.COMPROVEI_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  } else {

    // WS601 usa usuário/senha dentro do JSON
    payload = {
      headers: credentials(),
      body: {
        formato_exportacao: 'csv',
        filtros,
        campos
      }
    };

    axiosConfig = {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
  }

  let data;

  try {
    // Envia o POST para a Comprovei
    const response = await axios.post(config.url, payload, axiosConfig);

    // Guarda o retorno da API
    data = response.data;

  } catch (err) {

    // Log detalhado para ver erro no Railway
    console.error('Erro Comprovei');
    console.error('WS:', ws);
    console.error('URL:', config.url);
    console.error('STATUS:', err.response?.status);
    console.error('DATA:', err.response?.data);

    throw new Error(
      typeof err.response?.data === 'string'
        ? err.response.data
        : JSON.stringify(err.response?.data || err.message)
    );
  }

  // Algumas APIs retornam os dados em data.body, outras direto em data
  const body = data?.body || data;

  // Pega a URL do arquivo gerado
  const urlArquivo =
    body?.user_message ||
    body?.url ||
    body?.response_data;

  // Se não tiver URL, para o processo
  if (!urlArquivo || typeof urlArquivo !== 'string' || !urlArquivo.startsWith('http')) {
    const msg =
      body?.message ||
      body?.internal_message ||
      body?.user_message ||
      'Comprovei não retornou URL do arquivo';

    throw new Error(msg);
  }

  // Baixa o arquivo retornado pela Comprovei
  const fileResponse = await axios.get(urlArquivo, {
    responseType: 'arraybuffer',
    timeout: 120000
  });

  let csvBuffer;

  // Verifica se o arquivo é ZIP ou CSV direto
  const contentType = fileResponse.headers['content-type'] || '';

  if (contentType.includes('zip') || urlArquivo.toLowerCase().includes('.zip')) {
    // Se for ZIP, extrai o primeiro CSV
    csvBuffer = extractFirstCsvFromZip(Buffer.from(fileResponse.data));
  } else {
    // Se for CSV direto, usa o próprio arquivo
    csvBuffer = Buffer.from(fileResponse.data);
  }

  // Converte o CSV para array de objetos
  const rows = parseCsv(csvBuffer);

  // Retorna as linhas e a URL do arquivo
  return {
    rows,
    urlArquivo
  };
}


// Função pública para importar WS601
export async function exportarWs601(dataInicial, dataFinal) {
  return chamarComprovei({
    ws: 'WS601',
    dataInicial,
    dataFinal
  });
}


// Função pública para importar WS613
export async function exportarWs613(dataInicial, dataFinal) {
  return chamarComprovei({
    ws: 'WS613',
    dataInicial,
    dataFinal
  });
}
