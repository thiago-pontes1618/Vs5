import React from 'react';
import { AnalysisResult, ConfigState, Student } from '../types';
import { Charts } from './Charts';
import { generatePDF } from '../services/pdfService';
import { Download, ExternalLink, MessageCircle } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
  config: ConfigState;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, config, onReset }) => {
  
  const handleWhatsapp = (msg: string, phone?: string) => {
    if (!msg) return;
    const text = encodeURIComponent(msg);
    const url = phone 
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gems-dark text-white p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold">GEMS v74 IMPACT</h2>
          <p className="opacity-90">Turma: {config.turma} | Meta: {config.meta} | {data.checkStatus}</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={() => generatePDF(data, config)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold transition-colors shadow"
          >
            <Download size={18} /> PDF Report
          </button>
          <button 
            onClick={onReset}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            New Analysis
          </button>
        </div>
      </div>

      <Charts data={data} />

      {/* Strategic Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.gameChangers.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
            <h4 className="font-bold text-yellow-800 flex items-center gap-2">
              🎯 ALVOS TÁTICOS (4.0 - 5.9)
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {data.gameChangers.map(s => s.nome.split(' ')[0]).join(', ')}
            </p>
          </div>
        )}
        <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r shadow-sm">
           <h4 className="font-bold text-slate-800 flex items-center gap-2">
              📊 DIAGNÓSTICO DO PLANO
            </h4>
            <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
              {data.diagAcao}
            </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-3">Farol</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Evolução</th>
                <th className="px-4 py-3">Média</th>
                <th className="px-4 py-3">Auditoria</th>
                <th className="px-4 py-3">Atenção</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-lg">{student.farol}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{student.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${student.evolucaoTxt.includes('⬆️') ? 'bg-green-100 text-green-700' : student.evolucaoTxt.includes('⬇️') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {student.evolucaoTxt}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{student.media !== null ? student.media.toFixed(1) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${student.auditStatus.includes('GAP') || student.auditStatus.includes('INEFICAZ') ? 'text-red-600' : student.auditStatus.includes('EFICAZ') ? 'text-green-600' : 'text-slate-500'}`}>
                      {student.auditStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={student.riscosTxt}>
                    {student.riscosTxt}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {student.msgPais && (
                        <button onClick={() => handleWhatsapp(student.msgPais)} className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded" title="Pais">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      {student.msgTutor && (
                        <button onClick={() => handleWhatsapp(student.msgTutor)} className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded" title="Tutor">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      {student.msgVice && (
                        <button onClick={() => handleWhatsapp(student.msgVice, config.telVice)} className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded" title="Vice">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      {student.msgCoord && (
                        <button onClick={() => handleWhatsapp(student.msgCoord, config.telCoord)} className="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded" title="Coord">
                          <MessageCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};