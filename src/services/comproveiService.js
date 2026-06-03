import axios from 'axios';
import { COMPROVEI } from '../config/comprovei.js';
import { extractFirstCsvFromZip } from '../utils/zip.js';
import { parseCsv } from '../utils/csv.js';

const WS601_CAMPOS = [
  'Data','CD','Rota/Roteiro','Código Motorista','Motorista','Placa','Código Transportadora','Transportadora','Tipo de Veículo','Status','Qtd. Paradas','Qtd. Documentos','Qtd. Volumes','Peso Líq. Total','Peso Bruto Total','Peso Líq. Pendente','Peso Bruto Pendente','Início Planejado','Fim Planejado','Em Trânsito','Última Ocorrência','Chegada na Base','Documentos Entregues/Coletados','Documentos não Entregues/Coletados','Documentos não Apontados','Nome','Destino','Tipo de Rota','Justificativa Saída','Resp. Just. Saída','Justificativa Chegada','Resp. Just. Chegada','Justificativa Cancelamento','Justificativa Retorno Base','Distância Estimada (Km)','Distância Percorrida (Km)','Base Origem','Base Destino','Ajustes Manuais','Tipo Carga','No. Embarcadores','Embarcadores','Aparelhos','Tipo','Valor','URL','Email Rotas Sem Sincronia','Regional','Classificação','Campo livre 1','Campo livre 2','Campo livre 3','Campo livre 4','Campo livre 5','Cód. Frota','Data de Criação'
];

const WS613_CAMPOS = [
  'Documento','Emissão','CNPJ Embarcador','Embarcador','Região','Modelo','CNPJ Cliente','Código Cliente','Código Int Cliente','Tipo','Cliente','Cidade Destino','UF Destino','Data Finalização','Ultima Ocorrência','Status','Data Pagamento','Data Agendamento','Qtd Reentregas','Qtd Paradas','Chave','Valor','Volume','Qtd volumes','Conferidos','Rota/Roteiro','Motorista','Cód. Motorista','Placa','Data da rota','Transportadora','CNPJ Transp.','Data Últ. Ocorr.','Gerente Cód.','Gerente Nome','Gerente Email','Gerente Tel.','Supervisor Cód.','Supervisor Nome','Supervisor Email','Supervisor Tel.','Gerente Sênior Cód.','Gerente Sênior Nome','Gerente Sênior Email','Gerente Sênior Tel.','Vendedor Cód.','Vendedor Nome','Vendedor Email','Vendedor Tel.','Pedido','Base Origem','Base Destino','Prazo SLA','Status SLA','Tipo de Frete','Modal','Data Atualização','AWB','Remessa','Possui Foto','Performance SLA','Justificativa','Acatado','Comentário da Justificativa','Chegada Cliente','Ajuste Manual','Horario Ajuste Manual','Usuário Ajuste Manual','Código IBGE Cidade','BU','CFOP','Campo Livre 1','Campo Livre 2','Campo Livre 3','Campo Livre 4','Campo Livre 5','Email SLA Atrasado','Serie','Peso','Endereco','Bairro','Estado','CEP','País','Prazo de Entrega','Cliente Email','Regional','Tipo Parada','regiaoUF','Grupo transportadora','Previsão de Entrega','Data de Integração','Baixa Terceiros','Anotações','Tracking','Horário Início Planejado Rota','Horário Início Rota','Horário Finalização Planejada Rota','Horário Finalização Rota','Tempo Permanência Cliente','Tempo Viagem','Tempo Viagem e Permanência','Latitude Chegada Cliente','Longitude Chegada Cliente'
];

function credentials() {
  if (!process.env.COMPROVEI_USER || !process.env.COMPROVEI_PASSWORD) {
    throw new Error('Configure COMPROVEI_USER e COMPROVEI_PASSWORD nas variaveis do Railway');
  }
  return {
    username: process.env.COMPROVEI_USER,
    password: process.env.COMPROVEI_PASSWORD
  };
}

async function chamarComprovei({ ws, dataInicial, dataFinal }) {
  const config = COMPROVEI[ws.toLowerCase()];
  const campos = ws === 'WS601' ? WS601_CAMPOS : WS613_CAMPOS;
  const filtros = ws === 'WS601'
    ? { data_inicial: dataInicial, data_final: dataFinal }
    : {
        data_inicial: dataInicial,
        data_final: dataFinal,
        data_emissao_inicial: dataInicial,
        data_emissao_final: dataFinal,
        data_rota_inicial: dataInicial,
        data_rota_final: dataFinal,
        excluir_transbordos: false
      };

  const payload = {
    headers: credentials(),
    body: {
      formato_exportacao: 'csv',
      filtros,
      campos
    }
  };

  console.log('URL:', config.url);
console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
  const { data } = await axios.post(config.url, payload, {
    timeout: 120000,
    headers: { 'Content-Type': 'application/json' }
  });

  const body = data?.body || data;
  const urlArquivo = body?.user_message || body?.url || body?.response_data;
  if (!urlArquivo || typeof urlArquivo !== 'string' || !urlArquivo.startsWith('http')) {
    const msg = body?.message || body?.internal_message || 'Comprovei nao retornou URL do arquivo';
    throw new Error(msg);
  }

  const fileResponse = await axios.get(urlArquivo, {
    responseType: 'arraybuffer',
    timeout: 120000
  });

  let csvBuffer;
  const contentType = fileResponse.headers['content-type'] || '';
  if (contentType.includes('zip') || urlArquivo.toLowerCase().includes('.zip')) {
    csvBuffer = extractFirstCsvFromZip(Buffer.from(fileResponse.data));
  } else {
    csvBuffer = Buffer.from(fileResponse.data);
  }

  const rows = parseCsv(csvBuffer);
  return { rows, urlArquivo };
}

export async function exportarWs601(dataInicial, dataFinal) {
  return chamarComprovei({ ws: 'WS601', dataInicial, dataFinal });
}

export async function exportarWs613(dataInicial, dataFinal) {
  return chamarComprovei({ ws: 'WS613', dataInicial, dataFinal });
}
