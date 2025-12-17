
import React from 'react';

interface ControlProps {
    label: string;
    min: number;
    max: number;
    step: number;
    val: number;
    onChange: (val: number) => void;
}

export const Control: React.FC<ControlProps> = ({label, min, max, step, val, onChange}) => (
    <div>
        <div className="flex justify-between mb-1">
            <label className="text-xs font-bold text-slate-400">{label}</label>
        </div>
        <div className="flex items-center gap-3">
            <input 
                type="range" min={min} max={max} step={step}
                value={val}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
            />
             <input 
                type="number" min={min} max={max} step={step}
                value={val}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-xs font-mono text-cyan-400 text-right focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500"
            />
        </div>
    </div>
);
