export const PERIODOS_MAP: Record<string, string[]> = {
  mensal: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  bimestral: ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'],
  trimestral: ['1º Trimestre', '2º Trimestre', '3º Trimestre'],
  semestral: ['1º Semestre', '2º Semestre'],
  anual: ['Anual'],
};

export function getPeriodos(tipoPeriodo: string): string[] {
  return PERIODOS_MAP[tipoPeriodo] || PERIODOS_MAP.bimestral;
}
