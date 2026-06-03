// Importa a biblioteca node-cron
// Responsável por executar tarefas automaticamente em horários definidos
//
// Exemplo:
// - Todo dia às 05:00
// - A cada hora
// - A cada minuto
//
import cron from 'node-cron';


// Importa a função principal de importação
//
// Esta função executa:
//
// importarWs601()
// importarWs613()
//
import { importarTudo } from '../services/importService.js';


// Importa função que calcula datas passadas
//
// Exemplo:
//
// getPeriodoDiasAtras(1)
//
// Retorna:
//
// {
//   data_inicial: "2026-06-02",
//   data_final: "2026-06-02"
// }
//
import { getPeriodoDiasAtras } from '../utils/date.js';


// ======================================================
// INICIALIZA O AGENDADOR AUTOMÁTICO
// ======================================================
//
// Esta função é chamada no server.js quando o sistema inicia
//
export function startScheduler() {

  // ==================================================
  // VERIFICA SE O CRON ESTÁ HABILITADO
  // ==================================================
  //
  // Variável Railway:
  //
  // CRON_ENABLED=true
  //
  // ou
  //
  // CRON_ENABLED=false
  //
  if (
    String(process.env.CRON_ENABLED || 'true')
      .toLowerCase() !== 'true'
  ) {

    console.log(
      '[CRON] Desativado por CRON_ENABLED=false'
    );

    return;
  }

  // ==================================================
  // HORÁRIO DE EXECUÇÃO
  // ==================================================
  //
  // Variável Railway:
  //
  // CRON_TIME=0 5 * * *
  //
  // Significa:
  //
  // ┌──────── minuto (0)
  // │ ┌────── hora (5)
  // │ │ ┌──── dia do mês (*)
  // │ │ │ ┌── mês (*)
  // │ │ │ │ ┌ dia da semana (*)
  // │ │ │ │ │
  // 0 5 * * *
  //
  // Resultado:
  // Todo dia às 05:00
  //
  const cronTime =
    process.env.CRON_TIME || '0 5 * * *';

  // ==================================================
  // FUSO HORÁRIO
  // ==================================================
  //
  // Evita executar em UTC
  //
  const timezone =
    process.env.CRON_TIMEZONE ||
    'America/Sao_Paulo';

  // ==================================================
  // REGISTRA O AGENDAMENTO
  // ==================================================
  //
  cron.schedule(

    // Horário configurado
    cronTime,

    // Função executada no horário
    async () => {

      // ==========================================
      // DEFINE O PERÍODO A IMPORTAR
      // ==========================================
      //
      // Variável:
      //
      // IMPORT_DAYS_BACK=1
      //
      // Hoje:
      // 2026-06-03
      //
      // Importa:
      // 2026-06-02
      //
      const periodo =
        getPeriodoDiasAtras(
          process.env.IMPORT_DAYS_BACK || 1
        );

      // Log de início
      console.log(
        `[CRON] Iniciando importacao ${periodo.data_inicial} ate ${periodo.data_final}`
      );

      try {

        // ==========================================
        // EXECUTA IMPORTAÇÃO
        // ==========================================
        //
        // Fluxo:
        //
        // WS601
        // ↓
        // Download CSV
        // ↓
        // MySQL
        // ↓
        // WS613
        // ↓
        // Download CSV
        // ↓
        // MySQL
        //
        const result =
          await importarTudo(
            periodo.data_inicial,
            periodo.data_final
          );

        // Log de sucesso
        console.log(
          '[CRON] Importacao concluida',
          result
        );

      } catch (err) {

        // Log de erro
        console.error(
          '[CRON] Erro na importacao',
          err.message
        );
      }
    },

    // Configuração do cron
    {
      timezone
    }
  );

  // ==================================================
  // LOG DE INICIALIZAÇÃO
  // ==================================================
  //
  // Exemplo:
  //
  // [CRON] Agendado: 0 5 * * * timezone=America/Sao_Paulo
  //
  console.log(
    `[CRON] Agendado: ${cronTime} timezone=${timezone}`
  );
}
