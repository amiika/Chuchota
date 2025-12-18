
import React, { useState, useMemo } from 'react';
import { Edit3, Copy, Check, SlidersHorizontal, Zap, Play } from 'lucide-react';
import { IPA_DATA, KlattFrame } from '../services/ipaData';
import { VoiceConfig } from '../types';
import { renderAudio } from '../services/klattEngine';

interface ParamInputProps {
    label: string;
    k: keyof KlattFrame;
    val: number;
    isActive: boolean;
    min: number;
    max: number;
    step: number;
    onFocus: (config: any) => void;
    onChange: (val: number) => void;
    className?: string;
    isOverridden?: boolean;
}

const ParamInput = React.memo(({ label, k, val, isActive, min, max, step, onFocus, onChange, className, isOverridden }: ParamInputProps) => {
    return (
        <input 
            type="number" 
            value={val}
            onFocus={() => onFocus({ key: k, label, min, max, step })}
            onChange={e => onChange(parseFloat(e.target.value))}
            className={`bg-slate-800 border rounded px-1 py-1 text-xs font-mono text-right transition-all cursor-pointer hover:border-slate-500 focus:outline-none 
                ${isActive ? 'border-cyan-500 bg-slate-700 ring-1 ring-cyan-500/50 text-white' : 'border-slate-700 text-slate-300'} 
                ${isOverridden ? 'text-yellow-400 border-yellow-500/50' : ''} 
                ${className}`}
            title={`${label}${isOverridden ? ' (Overridden)' : ''}`}
        />
    );
});

interface IpaEditorProps {
    selectedChar: string;
    onSelectChar: (char: string) => void;
    config: VoiceConfig;
    onUpdateOverride: (char: string, key: string, value: any) => void;
}

export const IpaEditor: React.FC<IpaEditorProps> = ({ selectedChar, onSelectChar, config, onUpdateOverride }) => {
    const [copied, setCopied] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [activeControl, setActiveControl] = useState<{
        key: keyof KlattFrame;
        label: string;
        min: number;
        max: number;
        step: number;
    } | null>(null);

    const safeChar = IPA_DATA[selectedChar] ? selectedChar : Object.keys(IPA_DATA)[0];
    
    // Merge base data with persona overrides for editing
    const frame = useMemo(() => {
        return { ...IPA_DATA[safeChar], ...(config.phonemeOverrides?.[safeChar] || {}) };
    }, [safeChar, config.phonemeOverrides]);

    const handlePlay = async () => {
        if (playing) return;
        setPlaying(true);
        try {
            const buffer = await renderAudio(safeChar, config, 'en', true);
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.onended = () => setPlaying(false);
            source.start();
        } catch (err) {
            console.error("Error playing phoneme:", err);
            setPlaying(false);
        }
    };

    const handleCopy = () => {
        const groups: (keyof KlattFrame)[][] = [
            ['isStop', 'isNasal', 'isVowel', 'isVoiced', 'copyAdjacent', 'voiceAmplitude', 'aspirationAmplitude', 'fricationAmplitude', 'parallelBypass'],
            ['cf1', 'cf2', 'cf3', 'cf4', 'cf5', 'cf6'],
            ['cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6'],
            ['cfNP', 'cbNP', 'cfN0', 'cbN0', 'caNP'],
            ['pf1', 'pf2', 'pf3', 'pf4', 'pf5', 'pf6'],
            ['pb1', 'pb2', 'pb3', 'pb4', 'pb5', 'pb6'],
            ['pa1', 'pa2', 'pa3', 'pa4', 'pa5', 'pa6'],
            ['baseDuration']
        ];

        const lines: string[] = [];
        groups.forEach(group => {
            const parts: string[] = [];
            group.forEach(key => {
                const val = (frame as any)[key];
                if (val !== undefined && val !== 0 && val !== false) {
                    let valStr = val.toString();
                    if (typeof val === 'number' && Number.isInteger(val) && key.includes('Amplitude')) {
                         valStr = val.toFixed(1); 
                    }
                    parts.push(`${key}: ${valStr}`);
                }
            });
            if (parts.length > 0) lines.push("        " + parts.join(", "));
        });

        navigator.clipboard.writeText(`{\n${lines.join(',\n')}\n    }`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isKeyOverridden = (key: string) => {
        return config.phonemeOverrides?.[safeChar]?.hasOwnProperty(key);
    };

    const updateVal = (key: keyof KlattFrame, val: any) => {
        onUpdateOverride(safeChar, key, val);
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                        <Edit3 className="w-5 h-5" />
                        <h2>PHONEME REFINER</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                            value={safeChar}
                            onChange={e => onSelectChar(e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-slate-100 rounded px-3 py-1 font-mono text-lg focus:ring-1 focus:ring-cyan-500"
                        >
                            {Object.keys(IPA_DATA).map(k => (
                                <option key={k} value={k}>{k} {IPA_DATA[k]._silence ? '(Silence)' : ''}</option>
                            ))}
                        </select>
                        {config.phonemeOverrides?.[safeChar] && (
                             <span title="This phoneme has persona-specific overrides">
                                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                             </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePlay}
                        disabled={playing}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded transition-all duration-300 border ${
                            playing 
                            ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-cyan-400'
                        }`}
                        title="Play Current Phoneme"
                    >
                        <Play className={`w-3 h-3 ${playing ? 'animate-pulse' : ''}`} />
                        {playing ? 'PLAYING ...' : 'PLAY PHONEME'}
                    </button>
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded transition-all duration-300 border ${
                            copied 
                            ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' 
                            : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-cyan-400'
                        }`}
                        title="Copy Current Phoneme State"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'COPIED!' : 'COPY PHONEME'}
                    </button>
                </div>
            </div>

            {/* SHARED SLIDER CONTROL */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 sticky top-0 z-10 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                     <SlidersHorizontal className="w-4 h-4" />
                     PRECISION CONTROL
                </div>
                
                {activeControl ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-end mb-2">
                             <span className="text-cyan-400 font-bold text-sm">
                                {activeControl.label} {isKeyOverridden(activeControl.key) && <span className="text-yellow-500 text-[10px] ml-2">(PERSONA OVERRIDE)</span>}
                             </span>
                             <span className="font-mono text-xl text-white">{(frame as any)[activeControl.key] || 0}</span>
                         </div>
                         <div className="flex items-center gap-4">
                             <input 
                                type="range" 
                                min={activeControl.min} max={activeControl.max} step={activeControl.step}
                                value={(frame as any)[activeControl.key] || 0}
                                onChange={(e) => updateVal(activeControl.key, parseFloat(e.target.value))}
                                className={`flex-1 h-3 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 ${isKeyOverridden(activeControl.key) ? 'bg-yellow-500/30' : 'bg-slate-700'}`}
                             />
                         </div>
                    </div>
                ) : (
                    <div className="h-12 flex items-center justify-center text-slate-600 text-sm italic">
                        Select an input below to edit persona-specific parameters for '{safeChar}'
                    </div>
                )}
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-3 space-y-6">
                     <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Properties</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['isStop', 'isNasal', 'isVowel', 'isVoiced', 'copyAdjacent'].map(k => (
                                <label key={k} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={!!(frame as any)[k]}
                                        onChange={e => updateVal(k as any, e.target.checked)}
                                        className="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-0 focus:ring-offset-0 accent-cyan-500 w-4 h-4"
                                    />
                                    <span className={`text-xs font-mono transition-colors ${isKeyOverridden(k) ? 'text-yellow-500' : 'text-slate-400 group-hover:text-cyan-400'}`}>
                                        {k === 'copyAdjacent' ? 'Transparent' : k.replace('is', '')}
                                    </span>
                                </label>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                             <div className="flex items-center justify-between">
                                 <label className={`text-xs font-mono ${isKeyOverridden('baseDuration') ? 'text-yellow-500' : 'text-slate-400'}`}>Base Duration</label>
                                 <ParamInput 
                                    label="Base Duration" k="baseDuration" 
                                    val={frame.baseDuration}
                                    isActive={activeControl?.key === 'baseDuration'}
                                    isOverridden={isKeyOverridden('baseDuration')}
                                    onFocus={setActiveControl} onChange={(v) => updateVal('baseDuration', v)}
                                    min={10} max={500} step={5} className="w-20 font-bold" 
                                 />
                             </div>
                        </div>
                     </div>

                     <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sources</h3>
                        {[
                            {k:'voiceAmplitude', l:'Voice (AV)', m:0, x:1, s:0.01},
                            {k:'aspirationAmplitude', l:'Asp (AH)', m:0, x:1, s:0.01},
                            {k:'fricationAmplitude', l:'Fric (AF)', m:0, x:1, s:0.01},
                            {k:'parallelBypass', l:'Bypass (AB)', m:0, x:1.5, s:0.01}
                        ].map(s => (
                             <div key={s.k} className="flex items-center justify-between">
                                 <label className={`text-xs font-mono ${isKeyOverridden(s.k) ? 'text-yellow-500' : 'text-slate-400'}`}>{s.l}</label>
                                 <ParamInput 
                                    label={s.l} k={s.k as any} 
                                    val={(frame as any)[s.k]}
                                    isActive={activeControl?.key === s.k}
                                    isOverridden={isKeyOverridden(s.k)}
                                    onFocus={setActiveControl} onChange={(v) => updateVal(s.k as any, v)}
                                    min={s.m} max={s.x} step={s.s} className="w-20" 
                                 />
                             </div>
                        ))}
                     </div>
                </div>

                <div className="xl:col-span-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Cascade Branch</h3>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-center mb-2">
                        <div className="text-[10px] text-slate-600">F</div>
                        <div className="text-[10px] text-slate-600">Hz</div>
                        <div className="text-[10px] text-slate-600">BW</div>
                    </div>
                    {[1,2,3,4,5,6].map(i => (
                         <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                            <div className={`text-xs font-mono text-left pl-2 ${isKeyOverridden(`cf${i}`) ? 'text-yellow-500' : 'text-cyan-600'}`}>F{i}</div>
                            <ParamInput 
                                label={`F${i} Freq`} k={`cf${i}` as any} 
                                val={(frame as any)[`cf${i}`] || 0}
                                isActive={activeControl?.key === `cf${i}`}
                                isOverridden={isKeyOverridden(`cf${i}`)}
                                onFocus={setActiveControl} onChange={v => updateVal(`cf${i}` as any, v)}
                                min={100} max={5000} step={1} className="w-full" 
                            />
                            <ParamInput 
                                label={`F${i} BW`} k={`cb${i}` as any} 
                                val={(frame as any)[`cb${i}`] || 0}
                                isActive={activeControl?.key === `cb${i}`}
                                isOverridden={isKeyOverridden(`cb${i}`)}
                                onFocus={setActiveControl} onChange={v => updateVal(`cb${i}` as any, v)}
                                min={40} max={1000} step={1} className="w-full" 
                            />
                         </div>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Nasal Pole/Zero</h4>
                         {[
                            {k:'cfNP', b:'cbNP', l:'NP', fl:'Nasal Pole'},
                            {k:'cfN0', b:'cbN0', l:'NZ', fl:'Nasal Zero'}
                         ].map(n => (
                            <div key={n.k} className="grid grid-cols-3 gap-2 items-center mb-2">
                                <div className={`text-xs font-mono text-left pl-2 ${isKeyOverridden(n.k) ? 'text-yellow-500' : 'text-purple-400'}`}>{n.l}</div>
                                <ParamInput 
                                    label={`${n.fl} Freq`} k={n.k as any} 
                                    val={(frame as any)[n.k]}
                                    isActive={activeControl?.key === n.k}
                                    isOverridden={isKeyOverridden(n.k)}
                                    onFocus={setActiveControl} onChange={v => updateVal(n.k as any, v)}
                                    min={100} max={3000} step={1} className="w-full" 
                                />
                                <ParamInput 
                                    label={`${n.fl} BW`} k={n.b as any} 
                                    val={(frame as any)[n.b]}
                                    isActive={activeControl?.key === n.b}
                                    isOverridden={isKeyOverridden(n.b)}
                                    onFocus={setActiveControl} onChange={v => updateVal(n.b as any, v)}
                                    min={40} max={1000} step={1} className="w-full" 
                                />
                            </div>
                         ))}
                    </div>
                </div>

                <div className="xl:col-span-5 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Parallel Branch</h3>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-center mb-2">
                        <div className="text-[10px] text-slate-600">F</div>
                        <div className="text-[10px] text-slate-600">Hz</div>
                        <div className="text-[10px] text-slate-600">BW</div>
                        <div className="text-[10px] text-slate-600">Gain</div>
                    </div>
                    {[1,2,3,4,5,6].map(i => (
                         <div key={i} className="grid grid-cols-4 gap-1 items-center mb-2">
                            <div className={`text-xs font-mono text-center ${isKeyOverridden(`pa${i}`) ? 'text-yellow-500' : 'text-slate-700'}`}>F{i}</div>
                            <ParamInput 
                                label={`Par F${i} Freq`} k={`pf${i}` as any} 
                                val={(frame as any)[`pf${i}`] || 0}
                                isActive={activeControl?.key === `pf${i}`}
                                isOverridden={isKeyOverridden(`pf${i}`)}
                                onFocus={setActiveControl} onChange={v => updateVal(`pf${i}` as any, v)}
                                min={100} max={5000} step={1} className="w-full" 
                            />
                            <ParamInput 
                                label={`Par F${i} BW`} k={`pb${i}` as any} 
                                val={(frame as any)[`pb${i}`] || 0}
                                isActive={activeControl?.key === `pb${i}`}
                                isOverridden={isKeyOverridden(`pb${i}`)}
                                onFocus={setActiveControl} onChange={v => updateVal(`pb${i}` as any, v)}
                                min={40} max={1000} step={1} className="w-full" 
                            />
                            <ParamInput 
                                label={`Par F${i} Gain`} k={`pa${i}` as any} 
                                val={(frame as any)[`pa${i}`] || 0}
                                isActive={activeControl?.key === `pa${i}`}
                                isOverridden={isKeyOverridden(`pa${i}`)}
                                onFocus={setActiveControl} onChange={v => updateVal(`pa${i}` as any, v)}
                                min={0} max={2.0} step={0.01} className="w-full font-bold" 
                            />
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
