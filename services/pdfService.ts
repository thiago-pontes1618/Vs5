import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, ConfigState } from '../types';

export const generatePDF = (analysis: AnalysisResult, config: ConfigState) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 43, 91); // #002B5B
  doc.text(`RELATÓRIO DE GESTÃO - ${config.turma}`, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gestão: ${config.nomeVice} & ${config.nomeCoord} | Meta: ${config.meta}`, 14, 28);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, pageWidth - 40, 20);

  let currentY = 40;

  // Impact Diagnosis
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("DIAGNÓSTICO DO PLANO DE AÇÃO (IMPACTO)", 14, currentY);
  currentY += 8;
  doc.setFontSize(10);
  
  const diagLines = doc.splitTextToSize(analysis.diagAcao, pageWidth - 28);
  doc.text(diagLines, 14, currentY);
  currentY += (diagLines.length * 5) + 10;

  // SWOT
  doc.setFontSize(14);
  doc.text("SWOT & CONTEXTO", 14, currentY);
  currentY += 8;
  doc.setFontSize(10);
  const swotLines = doc.splitTextToSize(analysis.swot, pageWidth - 28);
  doc.text(swotLines, 14, currentY);
  currentY += (swotLines.length * 5) + 10;

  // Game Changers Table
  if (analysis.gameChangers.length > 0) {
    doc.setFontSize(14);
    doc.text("🎯 ALVOS TÁTICOS (Alunos Borda 4.0-5.9)", 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Nome', 'Média Atual', 'Orientação']],
      body: analysis.gameChangers.map(s => [s.nome, s.media?.toString() || '-', 'Prioridade de Recuperação']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 193, 7] }, // Orange/Yellow
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Intervention Map
  const criticalStudents = analysis.students.filter(s => ['🔴', '🟠', '🟡'].includes(s.farol));
  if (criticalStudents.length > 0) {
    doc.setFontSize(14);
    doc.text("MAPA DE INTERVENÇÃO", 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Nome', 'Check/Eficácia', 'Evolução']],
      body: criticalStudents.map(s => [s.nome, s.auditStatus, s.evolucaoTxt]),
      styles: { fontSize: 9, textColor: [255, 255, 255] },
      headStyles: { fillColor: [0, 43, 91] }, // Navy
      bodyStyles: { fillColor: [0, 43, 91] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Legend
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("LEGENDA ESTRATÉGICA", 14, currentY);
  currentY += 8;
  doc.setFontSize(9);
  doc.text("GAP: Aluno com problema e sem registro de ação (Falha de Execução).", 14, currentY);
  currentY += 5;
  doc.text("INEFICAZ: Ação foi feita, mas nota caiu (Falha de Estratégia -> Cancelar e Refazer).", 14, currentY);
  currentY += 5;
  doc.text("EFICAZ: Ação feita e nota subiu/manteve (Sucesso).", 14, currentY);

  doc.save(`Relatorio_${config.turma.replace(/\s/g, '_')}.pdf`);
};