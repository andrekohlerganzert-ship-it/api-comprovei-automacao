import cron from 'node-cron';
import { importarTudo } from '../services/importService.js';
import { getPeriodoDiasAtras } from '../utils/date.js';

export function startScheduler() {
  if (String(process.env.CRON_ENABLED || 'true').toLowerCase() !== 'true') {
    console.log('[CRON] Desativado por CRON_ENABLED=false');
    return;
  }

  const cronTime = process.env.CRON_TIME || '0 5 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'America/Sao_Paulo';

  cron.schedule(cronTime, async () => {
    const periodo = getPeriodoDiasAtras(process.env.IMPORT_DAYS_BACK || 1);
    console.log(`[CRON] Iniciando importacao ${periodo.data_inicial} ate ${periodo.data_final}`);
    try {
      const result = await importarTudo(periodo.data_inicial, periodo.data_final);
      console.log('[CRON] Importacao concluida', result);
    } catch (err) {
      console.error('[CRON] Erro na importacao', err.message);
    }
  }, { timezone });

  console.log(`[CRON] Agendado: ${cronTime} timezone=${timezone}`);
}
