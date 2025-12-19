import React, { useState } from 'react';
import { Activity, PlayCircle } from 'lucide-react';
import { ConfigState, AnalysisResult } from './types';
import { INITIAL_CONFIG } from './constants';
import { processData } from './services/excelService';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [config, setConfig] = useState<ConfigState>(INITIAL_CONFIG);
  const [files, setFiles] = useState<{
    current: File | null;
    previous: File | null;
    check: File | null;
  }>({ current: null, previous: null, check: null });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleProcess = async () => {
    if (!files.current) {
      setError("Please upload the 'Current' spreadsheet.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await processData(files.current, files.previous, files.check, config);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Error processing files. Please check the file format.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setFiles({ current: null, previous: null, check: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {!analysis ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-fade-in">
             <div className="flex items-center gap-3 mb-8 border-b pb-4">
               <div className="bg-gems-dark p-2 rounded-lg text-white">
                 <Activity size={32} />
               </div>
               <div>
                 <h1 className="text-2xl font-bold text-slate-800">GEMS v74 Web</h1>
                 <p className="text-slate-500 text-sm">Educational Management & Analytics System</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Config Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Configuration</h3>
                  <input name="turma" placeholder="Class Name (e.g. 3ª A)" className="w-full p-2 border rounded" onChange={handleConfigChange} value={config.turma} />
                  <input name="meta" placeholder="Target (e.g. 6.0)" className="w-full p-2 border rounded" onChange={handleConfigChange} value={config.meta} />
                </div>
                
                {/* Team Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Team</h3>
                  <div className="flex gap-2">
                    <input name="nomeVice" placeholder="Vice Name" className="w-1/2 p-2 border rounded" onChange={handleConfigChange} value={config.nomeVice} />
                    <input name="telVice" placeholder="Tel Vice" className="w-1/2 p-2 border rounded" onChange={handleConfigChange} value={config.telVice} />
                  </div>
                  <div className="flex gap-2">
                    <input name="nomeCoord" placeholder="Coord Name" className="w-1/2 p-2 border rounded" onChange={handleConfigChange} value={config.nomeCoord} />
                    <input name="telCoord" placeholder="Tel Coord" className="w-1/2 p-2 border rounded" onChange={handleConfigChange} value={config.telCoord} />
                  </div>
                </div>

                 {/* Tools Section */}
                 <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Tools</h3>
                  <input name="linkForms" placeholder="Google Forms Link" className="w-full p-2 border rounded" onChange={handleConfigChange} value={config.linkForms} />
                  <input name="linkAgenda" placeholder="Calendar Link" className="w-full p-2 border rounded" onChange={handleConfigChange} value={config.linkAgenda} />
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-4">Data Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <FileUpload label="1.a Current Data (Required)" file={files.current} onChange={(f) => setFiles({...files, current: f})} />
                   <FileUpload label="1.b Previous Data (Optional)" file={files.previous} onChange={(f) => setFiles({...files, previous: f})} />
                   <FileUpload label="2. Check/Audit (Optional)" file={files.check} onChange={(f) => setFiles({...files, check: f})} />
                </div>
             </div>

             {error && (
               <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm font-semibold text-center border border-red-200">
                 {error}
               </div>
             )}

             <button 
               onClick={handleProcess} 
               disabled={loading}
               className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
                 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]'}`}
             >
               {loading ? 'Processing...' : <><PlayCircle /> PROCESS GEMS v74</>}
             </button>
          </div>
        ) : (
          <Dashboard data={analysis} config={config} onReset={reset} />
        )}
      </div>
    </div>
  );
}