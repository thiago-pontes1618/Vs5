import React, { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onChange: (file: File) => void;
  accept?: string;
  file?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onChange, accept = ".xlsx, .xls", file }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${file ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {file ? (
             <div className="flex items-center gap-2 text-green-700">
               <span className="font-bold text-lg">✓</span>
               <span className="text-sm truncate max-w-[200px]">{file.name}</span>
             </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <p className="text-xs text-slate-500"><span className="font-semibold">Click to upload</span></p>
            </>
          )}
        </div>
        <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />
      </label>
    </div>
  );
};