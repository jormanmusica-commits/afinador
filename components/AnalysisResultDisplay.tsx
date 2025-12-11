
import React from 'react';
import type { AnalysisResult } from '../types';
import { MusicIcon } from './icons/MusicIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  fileName: string;
  onReset: () => void;
}

const ResultCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-800/70 rounded-xl p-6 ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
            {icon}
            <h3 className="text-xl font-bold text-cyan-400">{title}</h3>
        </div>
        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed prose prose-invert prose-p:text-slate-300">
            {children}
        </div>
    </div>
);

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result, fileName, onReset }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-100">Resultados del Análisis</h2>
                <p className="text-slate-400 flex items-center gap-2 mt-1">
                    <MusicIcon className="h-5 w-5"/>
                    {fileName}
                </p>
            </div>
            <button
                onClick={onReset}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors shadow-md w-full sm:w-auto"
            >
                Analizar Otro Audio
            </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
            <ResultCard title="Transcripción" icon={<DocumentTextIcon className="w-6 h-6 text-cyan-400" />}>
                <p>{result.transcription}</p>
            </ResultCard>

            <ResultCard title="Análisis y Sugerencias" icon={<SparklesIcon className="w-6 h-6 text-cyan-400" />}>
                <p>{result.analysis}</p>
            </ResultCard>

            <ResultCard title="Letra Corregida" icon={<SparklesIcon className="w-6 h-6 text-cyan-400" />}>
                <p>{result.correctedLyrics}</p>
            </ResultCard>
        </div>
    </div>
  );
};

export default AnalysisResultDisplay;
