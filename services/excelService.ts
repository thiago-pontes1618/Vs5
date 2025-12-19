import * as XLSX from 'xlsx';
import { Student, AnalysisResult, ConfigState, AuditStatus, ProblemType, FarolStatus } from '../types';
import { BIBLIOTECA } from '../constants';

// --- Utility Functions ---

const normalizeText = (text: any): string => {
  if (typeof text !== 'string') return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const cleanNum = (val: any): number => {
  if (val === null || val === undefined || String(val).trim() === '') return NaN;
  if (typeof val === 'number') return val;
  const s = String(val).replace(',', '.').replace('%', '').trim();
  const num = parseFloat(s);
  return isNaN(num) ? NaN : num;
};

// --- parsing logic ---

export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        // Find header row (contains "NOME")
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const rowStr = rawRows[i].join(' ').toUpperCase();
          if (rowStr.includes('NOME') || rowStr.includes('ALUNO')) {
            headerRowIdx = i;
            break;
          }
        }
        
        // Re-parse with correct header
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { range: headerRowIdx });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

const mapColumns = (row: any) => {
  let mapped: any = { raw: row };
  let subjectCols: string[] = [];
  
  Object.keys(row).forEach(key => {
    const uKey = key.toUpperCase().trim();
    const val = row[key];
    
    if ((uKey.includes('NOME') || uKey.includes('ALUNO')) && !uKey.includes('TUTOR')) {
      mapped.Nome = val;
    } else if (uKey.includes('FREQ') || uKey.includes('FALTAS')) {
      mapped.Freq = val;
    } else if (uKey.includes('OCOR') || uKey.includes('DISC')) {
      mapped.Ocor = val;
    } else if (uKey.includes('PAI')) {
      mapped.TelPais = val;
    } else if (uKey.includes('TUTOR') && uKey.includes('TEL')) {
      mapped.TelTutor = val;
    } else {
      // Potential subject column check
      const numVal = cleanNum(val);
      if (!isNaN(numVal) && !uKey.includes('ID') && !uKey.includes('MAT') && !uKey.includes('TEL')) {
        subjectCols.push(key);
      }
    }
  });

  return { mapped, subjectCols };
};

// --- Analysis Logic ---

export const processData = async (
  fileCurrent: File, 
  filePrevious: File | null, 
  fileCheck: File | null, 
  config: ConfigState
): Promise<AnalysisResult> => {
  
  const currentData = await parseExcelFile(fileCurrent);
  const previousData = filePrevious ? await parseExcelFile(filePrevious) : [];
  const checkData = fileCheck ? await parseExcelFile(fileCheck) : [];

  // 1. Process Check Data
  const checkSet = new Set<string>();
  checkData.forEach((row: any) => {
    const { mapped } = mapColumns(row);
    if (mapped.Nome) checkSet.add(normalizeText(mapped.Nome));
  });

  // 2. Process Previous Data for evolution lookup
  const prevMap = new Map<string, number>();
  previousData.forEach((row: any) => {
    const { mapped, subjectCols } = mapColumns(row);
    if (mapped.Nome) {
      let media = cleanNum(mapped['Média']);
      if (isNaN(media) && subjectCols.length > 0) {
        const sum = subjectCols.reduce((acc, col) => acc + cleanNum(row[col]), 0);
        media = sum / subjectCols.length;
      }
      if (!isNaN(media)) prevMap.set(normalizeText(mapped.Nome), media);
    }
  });

  // 3. Process Current Data
  const students: Student[] = [];
  const allMedias: number[] = [];

  currentData.forEach((row: any) => {
    const { mapped, subjectCols } = mapColumns(row);
    if (!mapped.Nome) return;

    const nome = String(mapped.Nome);
    const nomeNorm = normalizeText(nome);
    let freq = cleanNum(mapped.Freq);
    if (freq <= 1) freq = freq * 100; // Handle decimal percentage
    if (isNaN(freq)) freq = 100;

    let ocor = cleanNum(mapped.Ocor);
    if (isNaN(ocor)) ocor = 0;

    // Calculate Media & Risks
    let media = cleanNum(row['Média']);
    if (isNaN(media) && subjectCols.length > 0) {
      const sum = subjectCols.reduce((acc, col) => acc + cleanNum(row[col]), 0);
      media = parseFloat((sum / subjectCols.length).toFixed(1));
    }

    const riscos: string[] = [];
    subjectCols.forEach(col => {
      const val = cleanNum(row[col]);
      if (!isNaN(val) && val < 6.0) {
        riscos.push(`${col}(${val})`);
      }
    });
    const riscosTxt = riscos.join(', ');

    // Evolution
    let evolucaoTxt = "➖";
    let diff = 0;
    let quedaBrusca = false;
    const prevMedia = prevMap.get(nomeNorm);

    if (prevMedia !== undefined && !isNaN(media)) {
      diff = parseFloat((media - prevMedia).toFixed(1));
      if (diff >= 0.5) evolucaoTxt = `⬆️ (+${diff})`;
      else if (diff <= -0.5) {
        evolucaoTxt = `⬇️ (${diff})`;
        if (diff <= -1.5 && media >= 6.0) quedaBrusca = true;
      } else {
        evolucaoTxt = "➡️";
      }
    } else if (prevMedia === undefined) {
      evolucaoTxt = "🆕";
    }

    // Diagnostics / Problemas
    const problemas: ProblemType[] = [];
    if (ocor >= 1) problemas.push('DISCIPLINA');
    if (freq < 80) problemas.push('FREQUENCIA');
    if (!isNaN(media) && media < 6.0) problemas.push('APRENDIZAGEM');
    if (!isNaN(media) && media >= 9.0) problemas.push('EXCELENCIA');
    if (quedaBrusca && !problemas.includes('APRENDIZAGEM')) problemas.push('ALERTA_QUEDA');

    // Audit Status
    const temCheck = checkSet.has(nomeNorm);
    const isRisk = problemas.length > 0 && !problemas.includes('EXCELENCIA');
    
    let auditStatus: AuditStatus = 'OK';
    if (isRisk) {
      if (!temCheck) auditStatus = '⚠️ GAP';
      else {
        if (diff < 0) auditStatus = '🛑 INEFICAZ';
        else auditStatus = '✅ EFICAZ';
      }
    }

    // Farol
    let farol: FarolStatus = '🟢';
    if (problemas.includes('DISCIPLINA') || freq < 75 || (!isNaN(media) && media < 5)) farol = '🔴';
    else if (problemas.includes('FREQUENCIA') || problemas.includes('APRENDIZAGEM') || quedaBrusca) farol = '🟡';
    else if (problemas.includes('EXCELENCIA')) farol = '💎';
    if (isNaN(media) && problemas.length === 0) farol = '⚪';

    // Collect stats
    if (!isNaN(media)) allMedias.push(media);

    // Messages Generation
    const msgs = generateMessages({ nome, turma: config.turma, problemas, evolucaoTxt, auditStatus, riscosTxt }, config);

    students.push({
      id: nomeNorm,
      nome,
      nomeNorm,
      media: isNaN(media) ? null : media,
      freq,
      ocor,
      riscosTxt,
      evolucaoTxt,
      diff,
      quedaBrusca,
      problemas,
      farol,
      auditStatus,
      ...msgs
    });
  });

  // Calculate Aggregates
  const prevMediasArr = Array.from(prevMap.values());
  const averageCurrent = allMedias.length ? allMedias.reduce((a,b)=>a+b,0)/allMedias.length : 0;
  const averagePrevious = prevMediasArr.length ? prevMediasArr.reduce((a,b)=>a+b,0)/prevMediasArr.length : 0;

  // Analysis Strings
  const risks = students.filter(a => ['🔴', '🟠', '🟡'].includes(a.farol));
  const ineficazes = risks.filter(a => a.auditStatus === '🛑 INEFICAZ');
  const gaps = risks.filter(a => a.auditStatus === '⚠️ GAP');
  
  let diagAcao = "";
  if (gaps.length > 0) diagAcao += `❌ FALHA DE EXECUÇÃO: ${gaps.length} alunos críticos sem registro de ação. Mobilizar Tutores.\n`;
  if (ineficazes.length > 0) diagAcao += `🛑 FALHA DE ESTRATÉGIA: ${ineficazes.length} alunos tiveram ação, mas a nota caiu. RECOMENDAÇÃO: Cancelar ação atual e criar nova.\n`;
  if (gaps.length === 0 && ineficazes.length === 0 && risks.length > 0) diagAcao += "✅ SUCESSO: Ações registradas e sem piora nos casos monitorados.";
  if (risks.length === 0) diagAcao += "Plano de Ação: Manter monitoramento preventivo.";

  // SWOT
  const problemaCounts: Record<string, number> = {};
  risks.forEach(a => a.problemas.forEach(p => { if(p!=='EXCELENCIA') problemaCounts[p] = (problemaCounts[p]||0)+1; }));
  const sortedProblemas = Object.entries(problemaCounts).sort((a,b) => b[1] - a[1]);
  const gargalo = sortedProblemas.length > 0 ? sortedProblemas[0][0] : "Nenhum";
  const excelenciaCount = students.filter(a => a.problemas.includes('EXCELENCIA')).length;
  const bordasCount = students.filter(a => a.media !== null && a.media >= 4.0 && a.media < 6.0).length;

  const swot = `FORÇAS: ${excelenciaCount} Monitores.\nFRAQUEZAS: ${risks.length} Críticos. Gargalo: ${gargalo}.\nOPORTUNIDADES: ${bordasCount} Alvos Táticos.\nAMEAÇAS: Ações Ineficazes.`;

  return {
    students,
    swot,
    diagAcao,
    gameChangers: students.filter(a => a.media !== null && a.media >= 4.0 && a.media < 6.0),
    averageCurrent,
    averagePrevious,
    checkStatus: checkData.length > 0 ? `✅ ${checkSet.size} auditados` : "⚠️ Sem Check"
  };
};

const generateMessages = (
  data: { nome: string, turma: string, problemas: ProblemType[], evolucaoTxt: string, auditStatus: AuditStatus, riscosTxt: string },
  config: ConfigState
) => {
  const { nome, turma, problemas, evolucaoTxt, auditStatus, riscosTxt } = data;
  
  // -- Msg Pais --
  let evoMsg = evolucaoTxt.includes("⬆️") ? " Notamos uma melhora! 🌟" : "";
  if (evolucaoTxt.includes("⬇️")) evoMsg = " Notamos uma queda recente.";

  let msgPais = "";
  if (problemas.length === 0) {
    msgPais = `Olá Família! O(a) *${nome}* (${turma}) está bem.${evoMsg} Escola à disposição. 🌟`;
  } else if (problemas.includes('EXCELENCIA')) {
    msgPais = `Olá Família! O(a) *${nome}* (${turma}) é destaque! 💎 Parabéns.`;
  } else {
    const motivos = [];
    if (problemas.includes('DISCIPLINA')) motivos.push("convivência");
    if (problemas.includes('FREQUENCIA')) motivos.push("frequência");
    if (problemas.includes('APRENDIZAGEM')) motivos.push("estudos");
    
    let cta = "Qual o melhor horário para falarmos?";
    if (config.linkAgenda) cta = `Para facilitar, **agende no link:** ${config.linkAgenda}`;
    msgPais = `Olá Família. Precisamos conversar sobre o(a) *${nome}* - ${turma} (${motivos.join(', ')}).${evoMsg} ${cta} 🤝`;
  }

  // -- Msg Professionals --
  const header = `🚨 *ALUNO: ${nome} (${turma})*`;
  const gapInfo = auditStatus === '⚠️ GAP' ? "\n🚨 *SEM REGISTRO (GAP)*" : (auditStatus === '🛑 INEFICAZ' ? "\n🛑 *AÇÃO INEFICAZ*" : "");
  
  let partsVice = "", partsTutor = "", partsCoord = "";
  const add = (role: 'Vice' | 'Tutor' | 'Coord', text: string) => {
    if (role === 'Vice') partsVice += (partsVice ? "\n" : "") + text;
    if (role === 'Tutor') partsTutor += (partsTutor ? "\n" : "") + text;
    if (role === 'Coord') partsCoord += (partsCoord ? "\n" : "") + text;
  };

  if (problemas.includes('DISCIPLINA')) {
    add('Vice', `📌 DISCIPLINA:\n${BIBLIOTECA.DISCIPLINA.Vice}`);
    add('Tutor', `📌 DISCIPLINA:\n${BIBLIOTECA.DISCIPLINA.Tutor}`);
  }
  if (problemas.includes('FREQUENCIA')) {
    add('Vice', `📌 FREQ:\n${BIBLIOTECA.FREQUENCIA.Vice}`);
    add('Tutor', `📌 FREQ:\n${BIBLIOTECA.FREQUENCIA.Tutor}`);
  }
  if (problemas.includes('APRENDIZAGEM') || problemas.includes('ALERTA_QUEDA')) {
    add('Coord', `📌 NOTAS:\n${BIBLIOTECA.APRENDIZAGEM.Coord(riscosTxt)}`);
    add('Tutor', `📌 ESTUDOS:\n${BIBLIOTECA.APRENDIZAGEM.Tutor(riscosTxt)}`);
  }
  if (problemas.includes('EXCELENCIA')) {
    add('Vice', `💎 DESTAQUE:\n${BIBLIOTECA.EXCELENCIA.Vice}`);
    add('Coord', `💎 DESTAQUE:\n${BIBLIOTECA.EXCELENCIA.Vice}`); // Coord uses same as Vice for library simplicity
    add('Tutor', `💎 DESTAQUE:\n${BIBLIOTECA.EXCELENCIA.Tutor}`);
  }

  const linkExtra = config.linkForms ? `\n📝 ${config.linkForms}` : "";

  return {
    msgPais,
    msgVice: partsVice ? `Olá ${config.nomeVice}.\n${header}${gapInfo}\n${partsVice}${linkExtra}` : "",
    msgTutor: partsTutor ? `Olá Tutor.\n${header}${gapInfo}\n${partsTutor}${linkExtra}` : "",
    msgCoord: partsCoord ? `Olá ${config.nomeCoord}.\n${header}${gapInfo}\n${partsCoord}${linkExtra}` : ""
  };
};