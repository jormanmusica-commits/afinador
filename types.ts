
export interface MixingRecommendations {
  eq: { low: number; mid: number; high: number };
  compressor: number;
  reverb: number;
  delay: number;
  deEsser: number;
  autoTune: number;
  saturation: number;
  distortion: number;
  gate: number;
  expander: number;
  exciter: number;
  chorus: number;
  doubler: number;
  limiter: number;
  hpf: number;
  lpf: number;
  noiseReduction: number;
  harmonizer: number;
  flanger: number;
  phaser: number;
  explanation: string;
}

export interface AnalysisResult {
  transcription: string;
  analysis: string;
  correctedLyrics: string;
  mixingRecommendations: MixingRecommendations;
}
