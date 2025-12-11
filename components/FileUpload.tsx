
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full p-8 sm:p-12 border-2 border-dashed rounded-lg transition-all duration-300 ${
        isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-500'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="audio-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".mp3,.wav"
        onChange={handleFileChange}
      />
      <div className="text-center pointer-events-none">
        <UploadIcon className="mx-auto h-12 w-12 text-slate-500 mb-4" />
        <p className="font-semibold text-slate-200">
          <span className="text-cyan-400">Haz clic para subir</span> o arrastra y suelta tu audio
        </p>
        <p className="text-sm text-slate-400 mt-1">MP3 o WAV (máx. 50MB)</p>
      </div>
    </div>
  );
};

export default FileUpload;
