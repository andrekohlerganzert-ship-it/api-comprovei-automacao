// Carrega as variáveis do arquivo .env
// Exemplo:
// MYSQLHOST=...
// COMPROVEI_USER=...
// COMPROVEI_PASSWORD=...
import dotenv from 'dotenv';

// Importa a função principal que realiza:
// 1. Importação WS601
// 2. Importação WS613
// 3. Gravação no MySQL
import { importarTudo } from '../services/importService.js';

// Importa funções auxiliares para manipulação de datas
import { getPeriodoDiasAtras, toYmd } from '../utils/date.js';

// Inicializa o dotenv
dotenv.config();


// ======================================================
// FUNÇÃO RESPONSÁVEL POR DEFINIR O PERÍODO DA IMPORTAÇÃO
// ======================================================
//
// Exemplos:
//
// node runImport.js hoje
// node runImport.js ontem
// node runImport.js 2026-06-01 2026-06-03
//
function periodoFromArgs() {

  // Lê o primeiro argumento passado na linha de comando
  //
  // Exemplo:
  // node runImport.js hoje
  //                    ↑
  //
  const arg = process.argv[2];

  // ====================================
  // CASO 1 - IMPORTAR O DIA ATUAL
  // ====================================
  //
  // Comando:
  // node runImport.js hoje
  //
  if (arg === 'hoje') {

    // Converte a data atual para formato YYYY-MM-DD
    //
    // Exemplo:
    // 2026-06-03
    //
    const ymd = toYmd(new Date());

    // Retorna o período do dia atual
    return {
      data_inicial: ymd,
      data_final: ymd
    };
  }

  // ====================================
  // CASO 2 - IMPORTAR ONTEM
  // ====================================
  //
  // Comando:
  // node runImport.js ontem
  //
  // ou sem parâmetros:
  // node runImport.js
  //
  if (arg === 'ontem' || !arg) {

    // Retorna o período de 1 dia atrás
    //
    // Exemplo:
    // Hoje: 2026-06-03
    //
    // Retorna:
    // {
    //   data_inicial: "2026-06-02",
    //   data_final: "2026-06-02"
    // }
    //
    return getPeriodoDiasAtras(1);
  }

  // ====================================
  // CASO 3 - PERÍODO PERSONALIZADO
  // ====================================
  //
  // Comando:
  // node runImport.js 2026-06-01 2026-06-05
  //
  if (process.argv[2] && process.argv[3]) {

    return {

      // Primeiro parâmetro
      // Data inicial
      data_inicial: process.argv[2],

      // Segundo parâmetro
      // Data final
      data_final: process.argv[3]
    };
  }

  // ====================================
  // CASO ERRO
  // ====================================
  //
  // Nenhum parâmetro válido informado
  //
  throw new Error(
    'Use: npm run importar:ontem ou node src/jobs/runImport.js 2026-06-01 2026-06-01'
  );
}


// ======================================================
// EXECUÇÃO PRINCIPAL
// ======================================================

// Obtém o período desejado
const p = periodoFromArgs();


// Executa a importação completa
//
// Equivale a:
//
// importarWs601(...)
// importarWs613(...)
//
importarTudo(
  p.data_inicial,
  p.data_final
)

  // ====================================
  // SUCESSO
  // ====================================
  //
  .then((r) => {

    // Exibe o resultado formatado no console
    //
    // Exemplo:
    //
    // {
    //   "ws601": {
    //      "total_linhas": 100
    //   },
    //   "ws613": {
    //      "total_linhas": 500
    //   }
    // }
    //
    console.log(
      JSON.stringify(r, null, 2)
    );

    // Finaliza o processo com sucesso
    process.exit(0);
  })

  // ====================================
  // ERRO
  // ====================================
  //
  .catch((err) => {

    // Mostra o erro no console
    //
    // Exemplo:
    // Erro de autenticação
    // Erro ao baixar CSV
    // Erro de banco
    //
    console.error(err);

    // Finaliza o processo informando erro
    process.exit(1);
  });
