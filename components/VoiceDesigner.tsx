
import React from 'react';
import { Settings2, RotateCcw, Users, Zap, Copy, Check } from 'lucide-react';
import { VoiceConfig } from '../types';
import { PERSONAS } from '../services/personas';
import { Control } from './Control';

interface VoiceDesignerProps {
    config: VoiceConfig;
    updateConfig: (key: keyof VoiceConfig, value: any) => void;
    applyPreset: (name: string) => void;
    resetConfig: () => void;
    onCopyPersona: () => void;
    personaCopied: boolean;
}

export const VoiceDesigner: React.FC<VoiceDesignerProps> = ({ 
    config, updateConfig, applyPreset, resetConfig, onCopyPersona, personaCopied 
}) => {
    const activeOverrides = Object.keys(config.phonemeOverrides || {});

    const clearOverrides = () => {
        updateConfig('phonemeOverrides', {});
    };

    return (
        <div className="w-full lg:w-96 bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-5 h-fit shrink-0">
            <div className="flex items-center justify-between text-cyan-400 border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    <h2 className="font-bold uppercase tracking-tight">VOICE DESIGNER</h2>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={resetConfig}
                        className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
                        title="Reset All"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                    </button>
                </div>
            </div>

            {/* PRESETS ROW */}
            <div className="space-y-3">
                 <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Users className="w-3 h-3" />
                    Personas (Presets)
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.keys(PERSONAS).map(name => (
                        <button
                            key={name}
                            onClick={() => applyPreset(name)}
                            className="bg-slate-700 hover:bg-cyan-900/50 text-slate-300 hover:text-cyan-400 text-xs py-2 rounded border border-slate-600 hover:border-cyan-700 transition-all text-left px-3"
                        >
                            {name}
                        </button>
                    ))}
                 </div>

                 {/* COPY PERSONA Button - Moved here */}
                 <button 
                    onClick={onCopyPersona}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all transform active:scale-[0.98] border mt-2 ${
                        personaCopied 
                        ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border-white/5 shadow-sm'
                    }`}
                >
                    {personaCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {personaCopied ? 'COPIED!' : 'COPY PERSONA'}
                </button>
            </div>

            {/* OVERRIDES SECTION */}
            {activeOverrides.length > 0 && (
                <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-3">
                         <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            Persona Overrides ({activeOverrides.length})
                         </div>
                         <button onClick={clearOverrides} className="text-[10px] text-yellow-600 hover:text-yellow-400 underline">CLEAR ALL</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {activeOverrides.map(char => (
                            <span key={char} className="px-2 py-0.5 bg-yellow-500 text-slate-900 font-bold rounded text-xs font-mono">
                                {char}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 gap-5">
                {/* Standard Params */}
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base</h3>
                    
                    <Control 
                        label="PITCH (F0)" 
                        min={10} max={1000} step={1} val={config.pitch} 
                        onChange={(v: number) => updateConfig('pitch', v)} 
                    />
                    <Control 
                        label="SPEED" 
                        min={0.1} max={5.0} step={0.01} val={config.speed} 
                        onChange={(v: number) => updateConfig('speed', v)} 
                    />
                    <Control 
                        label="DECLINATION (PITCH DROP)" 
                        min={0.0} max={0.5} step={0.01} val={config.declination} 
                        onChange={(v: number) => updateConfig('declination', v)} 
                    />
                </div>

                {/* Timbre Params */}
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timbre (Formants)</h3>
                    
                    <Control 
                        label="THROAT (TRACT LENGTH)" 
                        min={0.5} max={3.0} step={0.01} val={config.throat} 
                        onChange={(v: number) => updateConfig('throat', v)} 
                    />
                    <Control 
                        label="MOUTH (OPEN PHASE)"
                        min={0.05} max={0.95} step={0.01} val={config.mouth} 
                        onChange={(v: number) => updateConfig('mouth', v)} 
                    />
                    <Control 
                        label="TONGUE (F2 SHIFT)"
                        min={0.5} max={2.5} step={0.01} val={config.tongue} 
                        onChange={(v: number) => updateConfig('tongue', v)} 
                    />
                     <Control 
                        label="TILT (MUFFLING)" 
                        min={0} max={100} step={1} val={config.tilt} 
                        onChange={(v: number) => updateConfig('tilt', v)} 
                    />
                </div>

                 {/* Effects Params */}
                 <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effects</h3>
                    
                    <Control 
                        label="BREATHINESS" 
                        min={0} max={3.0} step={0.01} val={config.breathiness} 
                        onChange={(v: number) => updateConfig('breathiness', v)} 
                    />
                     <Control 
                        label="FLUTTER (TREMOR)" 
                        min={0} max={3.0} step={0.01} val={config.flutter} 
                        onChange={(v: number) => updateConfig('flutter', v)} 
                    />
                     <Control 
                        label="ROBOTIC" 
                        min={0} max={1.0} step={0.01} val={config.robotic || 0} 
                        onChange={(v: number) => updateConfig('robotic', v)} 
                    />
                    
                    <Control 
                        label="VIBRATO DEPTH" 
                        min={0} max={5.0} step={0.01} val={config.vibratoDepth} 
                        onChange={(v: number) => updateConfig('vibratoDepth', v)} 
                    />
                    <Control 
                        label="VIBRATO RATE" 
                        min={0.1} max={100.0} step={0.1} val={config.vibratoSpeed} 
                        onChange={(v: number) => updateConfig('vibratoSpeed', v)} 
                    />
                </div>
            </div>
        </div>
    );
};
