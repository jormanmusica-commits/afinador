
import React, { useState, useCallback } from 'react';
import type { AnalysisResult } from './types';
import { analyzeAudio } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AnalysisResultDisplay from './components/AnalysisResultDisplay';
import StudioRack from './components/StudioRack';
import Loader from './components/Loader';
import { Logo } from './components/icons/Logo';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError("El archivo es demasiado grande. Por favor, sube un archivo de menos de 50MB.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setFileName(file.name);
    setCurrentFile(file);

    try {
      const result = await analyzeAudio(file);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError('Hubo un error al analizar el audio. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setFileName('');
    setCurrentFile(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Logo />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
              Vocal Corrector AI
            </h1>
          </div>
          <p className="text-lg text-slate-400">
            Analiza y perfecciona tus interpretaciones vocales con el poder de la IA.
          </p>
        </header>

        <main className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-cyan-500/10 p-6 backdrop-blur-sm border border-slate-700">
          {isLoading && <Loader fileName={fileName} />}
          
          {error && (
            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
              <p>{error}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Intentar de Nuevo
              </button>
            </div>
          )}

          {!isLoading && !analysisResult && !error && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {!isLoading && analysisResult && (
            <>
              <AnalysisResultDisplay result={analysisResult} fileName={fileName} onReset={handleReset} />
              
              {currentFile && (
                  <StudioRack 
                    file={currentFile} 
                    recommendations={analysisResult.mixingRecommendations} 
                  />
              )}
            </>
          )}
        </main>
        
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Creado para demostración. Sube audios cortos para obtener mejores resultados.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
