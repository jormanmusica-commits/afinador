
import React from 'react';

interface LoaderProps {
    fileName: string;
}

const Loader: React.FC<LoaderProps> = ({fileName}) => {
  const messages = [
    "Afinando las frecuencias...",
    "Calibrando los armónicos...",
    "Analizando la interpretación...",
    "Consultando a los musos digitales...",
    "Generando feedback constructivo..."
  ];
  
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 2500);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <svg className="animate-spin h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg font-semibold text-slate-200 mt-6">Analizando "{fileName}"</p>
      <p className="text-slate-400 mt-2 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default Loader;
