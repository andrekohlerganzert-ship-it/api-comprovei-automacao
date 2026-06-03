// Exporta um objeto chamado COMPROVEI
// Este objeto centraliza todas as configurações das APIs da Comprovei
export const COMPROVEI = {

  // ============================
  // WS601 - EXPORTAÇÃO DE ROTAS
  // ============================
  ws601: {

    // Nome amigável da API
    nome: 'WS601',

    // Descrição utilizada para logs e documentação
    descricao: 'Exportar Rotas',

    // Endpoint oficial da Comprovei
    // Esta API retorna informações das rotas:
    // - Motorista
    // - Placa
    // - Quantidade de documentos
    // - Quantidade de volumes
    // - Status da rota
    // - Base origem/destino
    url: 'https://api.comprovei.com.br/api/1.1/util/export/route'
  },

  // ==================================
  // WS613 - EXPORTAÇÃO DE DOCUMENTOS
  // ==================================
  ws613: {

    // Nome amigável da API
    nome: 'WS613',

    // Descrição utilizada para logs e documentação
    descricao: 'Exportar Documentos',

    // Endpoint oficial da Comprovei
    // Esta API retorna informações dos documentos:
    // - NF-e
    // - Chave da NF
    // - Status da entrega
    // - Data da entrega
    // - Ocorrências
    // - Motorista
    // - Placa
    // - Rota
    // - SLA
    // - Foto
    // - Tracking
    url: 'https://console-api.comprovei.com/exports/documentSAC'
  }
};
