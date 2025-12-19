export interface ConfigState {
  turma: string;
  meta: string;
  nomeVice: string;
  telVice: string;
  nomeCoord: string;
  telCoord: string;
  linkForms: string;
  linkAgenda: string;
}

export type FarolStatus = '🔴' | '🟠' | '🟡' | '🟢' | '💎' | '⚪';
export type ProblemType = 'DISCIPLINA' | 'FREQUENCIA' | 'APRENDIZAGEM' | 'EXCELENCIA' | 'ALERTA_QUEDA';
export type AuditStatus = 'OK' | '⚠️ GAP' | '🛑 INEFICAZ' | '✅ EFICAZ';

export interface Student {
  id: string; // Unique ID usually based on normalized name
  nome: string;
  nomeNorm: string;
  media: number | null;
  freq: number;
  ocor: number; // Occurrences/Discipline
  riscosTxt: string; // Detail of subjects < 6.0
  
  // Calculated fields
  evolucaoTxt: string;
  diff: number;
  quedaBrusca: boolean;
  problemas: ProblemType[];
  farol: FarolStatus;
  auditStatus: AuditStatus;
  
  // Messages
  msgPais: string;
  msgTutor: string;
  msgVice: string;
  msgCoord: string;
}

export interface AnalysisResult {
  students: Student[];
  swot: string;
  diagAcao: string;
  gameChangers: Student[]; // Alvos Táticos
  averageCurrent: number;
  averagePrevious: number;
  checkStatus: string; // "✅ X auditados"
}

export interface ExcelDataRow {
  [key: string]: any;
}