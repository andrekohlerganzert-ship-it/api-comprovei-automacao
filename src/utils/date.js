export function toYmd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getPeriodoDiasAtras(daysBack = 1) {
  const d = new Date();
  d.setDate(d.getDate() - Number(daysBack || 1));
  const ymd = toYmd(d);
  return { data_inicial: ymd, data_final: ymd };
}

export function validarPeriodo(dataInicial, dataFinal) {
  if (!dataInicial || !dataFinal) throw new Error('Informe data_inicial e data_final no formato YYYY-MM-DD');
  const di = new Date(`${dataInicial}T00:00:00`);
  const df = new Date(`${dataFinal}T00:00:00`);
  if (Number.isNaN(di.getTime()) || Number.isNaN(df.getTime())) throw new Error('Datas invalidas. Use YYYY-MM-DD');
  if (df < di) throw new Error('data_final nao pode ser menor que data_inicial');
  const diffDias = Math.floor((df - di) / 86400000) + 1;
  if (diffDias > 31) throw new Error('O intervalo maximo permitido pela Comprovei e 31 dias');
}
