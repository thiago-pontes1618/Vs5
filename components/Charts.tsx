import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import { AnalysisResult } from '../types';

interface ChartsProps {
  data: AnalysisResult;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-slate-200 shadow-lg rounded text-xs">
        <p className="font-bold">{data.nome}</p>
        <p>Média: {data.media}</p>
        <p>Freq: {data.freq}%</p>
      </div>
    );
  }
  return null;
};

export const Charts: React.FC<ChartsProps> = ({ data }) => {
  const scatterData = data.students
    .filter(s => s.media !== null)
    .map(s => ({
      nome: s.nome,
      media: s.media,
      freq: s.freq,
      color: s.farol === '🔴' ? '#dc3545' : 
             s.farol === '🟠' ? '#fd7e14' : 
             s.farol === '🟡' ? '#ffc107' : 
             s.farol === '🟢' ? '#28a745' : 
             s.farol === '💎' ? '#007bff' : '#6c757d'
    }));

  const barData = [
    { name: 'Mês Anterior', value: parseFloat(data.averagePrevious.toFixed(2)) },
    { name: 'Mês Atual', value: parseFloat(data.averageCurrent.toFixed(2)) },
  ];

  const diff = data.averageCurrent - data.averagePrevious;
  const isPositive = diff >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Radar Pedagógico Replacement */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">RADAR PEDAGÓGICO</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="freq" name="Freq" unit="%" domain={[0, 105]} />
              <YAxis type="number" dataKey="media" name="Média" domain={[0, 10.5]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Alunos" data={scatterData} fill="#8884d8">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
        <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">EVOLUÇÃO MÉDIA</h3>
        <div className="absolute top-12 right-1/2 translate-x-1/2 text-center z-10">
           <span className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
             {isPositive ? '+' : ''}{diff.toFixed(2)}
           </span>
        </div>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={barData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" />
               <YAxis domain={[0, 10]} />
               <Tooltip />
               <Bar dataKey="value" fill="#0d6efd">
                 <LabelList dataKey="value" position="top" />
                 {barData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index === 0 ? '#adb5bd' : '#0d6efd'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};