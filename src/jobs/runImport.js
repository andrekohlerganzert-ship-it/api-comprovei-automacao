import dotenv from 'dotenv';
import { importarTudo } from '../services/importService.js';
import { getPeriodoDiasAtras, toYmd } from '../utils/date.js';

dotenv.config();

function periodoFromArgs() {
  const arg = process.argv[2];
  if (arg === 'hoje') {
    const ymd = toYmd(new Date());
    return { data_inicial: ymd, data_final: ymd };
  }
  if (arg === 'ontem' || !arg) return getPeriodoDiasAtras(1);
  if (process.argv[2] && process.argv[3]) return { data_inicial: process.argv[2], data_final: process.argv[3] };
  throw new Error('Use: npm run importar:ontem ou node src/jobs/runImport.js 2026-06-01 2026-06-01');
}

const p = periodoFromArgs();
importarTudo(p.data_inicial, p.data_final)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
