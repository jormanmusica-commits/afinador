
import React, { useEffect, useRef, useState } from 'react';
import type { MixingRecommendations } from '../types';

interface StudioRackProps {
    file: File;
    recommendations?: MixingRecommendations;
}

const effectsList = [
    { id: 'compressor', label: 'Compresor', type: 'dynamics' },
    { id: 'limiter', label: 'Limitador', type: 'dynamics' },
    { id: 'gate', label: 'Gate', type: 'dynamics' },
    { id: 'expander', label: 'Expander', type: 'dynamics' },
    { id: 'deEsser', label: 'De-Esser', type: 'dynamics' },
    { id: 'noiseReduction', label: 'Noise Reduction', type: 'dynamics' },
    
    { id: 'reverb', label: 'Reverb', type: 'spatial' },
    { id: 'delay', label: 'Delay', type: 'spatial' },
    { id: 'doubler', label: 'Doubler', type: 'spatial' },
    
    { id: 'hpf', label: 'HPF', type: 'filter' },
    { id: 'lpf', label: 'LPF', type: 'filter' },
    
    { id: 'saturation', label: 'Saturación', type: 'color' },
    { id: 'distortion', label: 'Distorsión', type: 'color' },
    { id: 'exciter', label: 'Exciter', type: 'color' },
    
    { id: 'chorus', label: 'Chorus', type: 'modulation' },
    { id: 'flanger', label: 'Flanger', type: 'modulation' },
    { id: 'phaser', label: 'Phaser', type: 'modulation' },
    
    { id: 'autoTune', label: 'Auto-Tune', type: 'pitch' },
    { id: 'harmonizer', label: 'Harmonizer', type: 'pitch' },
];

const StudioRack: React.FC<StudioRackProps> = ({ file, recommendations }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // Settings state
    const [settings, setSettings] = useState<Record<string, number>>({});
    const [eqSettings, setEqSettings] = useState({ low: 0, mid: 0, high: 0 });

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    
    // Node Refs for real-time manipulation
    const nodesRef = useRef<Record<string, AudioNode>>({});

    // Initialize default or recommended settings
    useEffect(() => {
        if (recommendations) {
            setSettings({
                compressor: recommendations.compressor,
                reverb: recommendations.reverb,
                delay: recommendations.delay,
                deEsser: recommendations.deEsser,
                autoTune: recommendations.autoTune,
                saturation: recommendations.saturation,
                distortion: recommendations.distortion,
                gate: recommendations.gate,
                expander: recommendations.expander,
                exciter: recommendations.exciter,
                chorus: recommendations.chorus,
                doubler: recommendations.doubler,
                limiter: recommendations.limiter,
                hpf: recommendations.hpf,
                lpf: recommendations.lpf,
                noiseReduction: recommendations.noiseReduction,
                harmonizer: recommendations.harmonizer,
                flanger: recommendations.flanger,
                phaser: recommendations.phaser,
            });
            setEqSettings(recommendations.eq);
        } else {
             // Defaults
             const defaults: Record<string, number> = {};
             effectsList.forEach(e => defaults[e.id] = 0);
             setSettings(defaults);
             setEqSettings({ low: 0, mid: 0, high: 0 });
        }
    }, [recommendations]);

    // Setup Audio Engine
    useEffect(() => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.crossOrigin = "anonymous";
        audioElementRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });
        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });
        audio.addEventListener('ended', () => setIsPlaying(false));

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceNodeRef.current = source;

        // --- CREATE NODES ---

        // 1. Filters (EQ, HPF, LPF)
        const hpfNode = ctx.createBiquadFilter();
        hpfNode.type = 'highpass';
        
        const lpfNode = ctx.createBiquadFilter();
        lpfNode.type = 'lowpass';

        const eqLow = ctx.createBiquadFilter();
        eqLow.type = 'lowshelf';
        eqLow.frequency.value = 320;

        const eqMid = ctx.createBiquadFilter();
        eqMid.type = 'peaking';
        eqMid.frequency.value = 1000;
        eqMid.Q.value = 1;

        const eqHigh = ctx.createBiquadFilter();
        eqHigh.type = 'highshelf';
        eqHigh.frequency.value = 3200;

        // 2. Dynamics
        const compressorNode = ctx.createDynamicsCompressor();
        const limiterNode = ctx.createDynamicsCompressor();
        limiterNode.ratio.value = 20; // Limiting ratio
        limiterNode.attack.value = 0.001;

        // 3. Distortion/Saturation
        const waveShaper = ctx.createWaveShaper();
        const makeDistortionCurve = (amount: number) => {
            const k = typeof amount === 'number' ? amount : 50;
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            const deg = Math.PI / 180;
            for (let i = 0; i < n_samples; ++i) {
                const x = (i * 2) / n_samples - 1;
                curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
            }
            return curve;
        };
        waveShaper.curve = makeDistortionCurve(0); // Init
        waveShaper.oversample = '4x';

        // 4. Spatial (Reverb / Delay)
        // Delay
        const delayNode = ctx.createDelay(5.0);
        const delayFeedback = ctx.createGain();
        const delayWet = ctx.createGain();
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        
        // Reverb (Convolver)
        const convolver = ctx.createConvolver();
        const reverbWet = ctx.createGain();
        // Generate impulse
        const rate = ctx.sampleRate;
        const length = rate * 2.0;
        const impulse = ctx.createBuffer(2, length, rate);
        for(let i=0; i<length; i++) {
             const n = length - i;
             impulse.getChannelData(0)[i] = ((Math.random() * 2) - 1) * Math.pow(n / length, 0.5);
             impulse.getChannelData(1)[i] = ((Math.random() * 2) - 1) * Math.pow(n / length, 0.5);
        }
        convolver.buffer = impulse;

        // 5. Modulation (Chorus/Flanger/Phaser - Simplified placeholders/gains)
        // Implementing full modulation graphs is complex, we will use Gain nodes to simulate "Wet" mix 
        // effectively toggling signal paths if we had them, or just controlling volume for now for simplicity 
        // where DSP is too heavy. 
        // Actually, let's implement a simple Chorus via delay modulation
        const chorusDelay = ctx.createDelay();
        const chorusOsc = ctx.createOscillator();
        const chorusGain = ctx.createGain(); // LFO depth
        const chorusWet = ctx.createGain();
        chorusOsc.frequency.value = 1.5; 
        chorusOsc.connect(chorusGain);
        chorusGain.connect(chorusDelay.delayTime);
        chorusOsc.start();

        // Master
        const masterGain = ctx.createGain();

        // Connect Graph (Series mainly, with parallel sends for Reverb/Delay)
        
        // Signal Flow: Source -> HPF -> LPF -> EQ -> Compressor -> Distortion -> Limiter -> DryOut
        //                                                                        -> Delay -> Mix
        //                                                                        -> Reverb -> Mix
        //                                                                        -> Chorus -> Mix

        source.connect(hpfNode);
        hpfNode.connect(lpfNode);
        lpfNode.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(compressorNode);
        compressorNode.connect(waveShaper);
        waveShaper.connect(limiterNode);
        
        // Dry path to master
        limiterNode.connect(masterGain);

        // Sends
        limiterNode.connect(delayNode);
        delayNode.connect(delayWet);
        delayWet.connect(masterGain);

        limiterNode.connect(convolver);
        convolver.connect(reverbWet);
        reverbWet.connect(masterGain);

        limiterNode.connect(chorusDelay);
        chorusDelay.connect(chorusWet);
        chorusWet.connect(masterGain);

        masterGain.connect(ctx.destination);

        // Store nodes
        nodesRef.current = {
            hpf: hpfNode,
            lpf: lpfNode,
            eqLow, eqMid, eqHigh,
            compressor: compressorNode,
            limiter: limiterNode,
            distortion: waveShaper,
            delay: delayNode,
            delayFeedback,
            delayWet,
            reverbWet,
            chorusWet,
            chorusGain, // Depth
            masterGain
        };

        return () => {
            audio.pause();
            audio.src = '';
            ctx.close();
        };
    }, [file]);

    // Update DSP when settings change
    useEffect(() => {
        const nodes = nodesRef.current;
        if (!nodes || !audioContextRef.current) return;

        // EQ
        (nodes.eqLow as BiquadFilterNode).gain.value = eqSettings.low; // -100 to 100 dB is too much, map to +/- 20
        (nodes.eqMid as BiquadFilterNode).gain.value = eqSettings.mid; 
        (nodes.eqHigh as BiquadFilterNode).gain.value = eqSettings.high;

        // HPF/LPF
        const hpfVal = settings.hpf || 0;
        // Map 0-100 to 20Hz - 1000Hz
        (nodes.hpf as BiquadFilterNode).frequency.value = 20 + (hpfVal * 10);
        
        const lpfVal = settings.lpf || 0;
        // Map 0-100 to 20000Hz - 1000Hz (Inverse)
        (nodes.lpf as BiquadFilterNode).frequency.value = 20000 - (lpfVal * 150);

        // Compressor
        const compVal = settings.compressor || 0;
        (nodes.compressor as DynamicsCompressorNode).threshold.value = -100 + (100 - compVal); // -100 to 0
        (nodes.compressor as DynamicsCompressorNode).ratio.value = 1 + (compVal / 5); // 1 to 21

        // Distortion
        const distVal = settings.saturation || settings.distortion || 0;
        // Re-generate curve if heavy change, but simplified:
        // We can't update curve easily in realtime without glitches sometimes, but let's try just gain staging or assume curve is fixed and we wet/dry?
        // WaveShaper doesn't have wet/dry. 
        // Let's assume curve was generated for max 100.
        // Actually, simple update:
        // (nodes.distortion as WaveShaperNode).curve = makeDistortionCurve(distVal); 
        // Skipping curve regen to avoid audio glitches in this simple demo.

        // Reverb
        const revVal = settings.reverb || 0;
        (nodes.reverbWet as GainNode).gain.value = revVal / 100;

        // Delay
        const delVal = settings.delay || 0;
        (nodes.delayWet as GainNode).gain.value = delVal / 100;
        (nodes.delayFeedback as GainNode).gain.value = 0.3 + ((delVal/200)); // Dynamic feedback

        // Chorus
        const chorusVal = settings.chorus || 0;
        (nodes.chorusWet as GainNode).gain.value = chorusVal / 100;
        (nodes.chorusGain as GainNode).gain.value = 0.002 + (chorusVal / 20000);

        // Limiter
        const limVal = settings.limiter || 0;
        (nodes.limiter as DynamicsCompressorNode).threshold.value = - (limVal / 2);

        // Others are placeholders in DSP (Gate, etc.) or mapped to similar nodes
    }, [settings, eqSettings]);

    const togglePlay = () => {
        if (!audioElementRef.current || !audioContextRef.current) return;
        
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (isPlaying) {
            audioElementRef.current.pause();
        } else {
            audioElementRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSettingChange = (id: string, value: number) => {
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleEqChange = (band: 'low' | 'mid' | 'high', value: number) => {
        setEqSettings(prev => ({ ...prev, [band]: value }));
    };

    return (
        <div className="bg-slate-900 rounded-xl p-6 ring-1 ring-slate-700 shadow-2xl mt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                    Modo Estudio (Procesador FX)
                </h2>
                <button
                    onClick={togglePlay}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${
                        isPlaying 
                        ? 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
                        : 'bg-cyan-600 hover:bg-cyan-700 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                    }`}
                >
                    {isPlaying ? 'PAUSAR' : 'REPRODUCIR'}
                </button>
            </div>

            {/* Recommendations Info */}
            {recommendations && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300 border border-slate-700">
                    <p className="font-semibold text-cyan-400 mb-1">💡 Sugerencia de la IA:</p>
                    <p>{recommendations.explanation}</p>
                </div>
            )}

            {/* EQ Section */}
            <div className="mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Ecualizador (3-Band)</h3>
                <div className="flex justify-between gap-4">
                    {['low', 'mid', 'high'].map((band) => (
                        <div key={band} className="flex flex-col items-center flex-1">
                            <span className="text-xs uppercase text-slate-400 mb-2">{band}</span>
                            <input
                                type="range"
                                min="-20"
                                max="20"
                                value={eqSettings[band as keyof typeof eqSettings]}
                                onChange={(e) => handleEqChange(band as any, Number(e.target.value))}
                                className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-slate-500 mt-2">{Math.round(eqSettings[band as keyof typeof eqSettings])} dB</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Effects Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {effectsList.map((effect) => (
                    <div key={effect.id} className="flex flex-col items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                        <label className="text-xs font-semibold text-slate-300 mb-2 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center" title={effect.label}>
                            {effect.label}
                        </label>
                        <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                             {/* Knob simulation using CSS/SVG */}
                             <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-slate-700"
                                />
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={175}
                                    strokeDashoffset={175 - (175 * (settings[effect.id] || 0) / 100)}
                                    className={`transition-all duration-100 ${
                                        effect.type === 'dynamics' ? 'text-green-400' :
                                        effect.type === 'spatial' ? 'text-purple-400' :
                                        effect.type === 'filter' ? 'text-yellow-400' :
                                        effect.type === 'color' ? 'text-red-400' :
                                        'text-blue-400'
                                    }`}
                                />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xs font-bold text-slate-200">{Math.round(settings[effect.id] || 0)}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={settings[effect.id] || 0}
                                onChange={(e) => handleSettingChange(effect.id, Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                title="Arrastra para ajustar"
                             />
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{effect.type}</span>
                    </div>
                ))}
            </div>

            {/* Playback Progress */}
            <div className="mt-6 flex items-center gap-3">
                 <span className="text-xs text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
                 <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-cyan-500" 
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                 </div>
                 <span className="text-xs text-slate-400 w-10">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default StudioRack;
