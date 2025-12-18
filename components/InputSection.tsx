
import React from 'react';
import { Globe, Keyboard, Languages, Wand2, Database, Book, BookOpen } from 'lucide-react';
import { Language, LANGUAGES } from '../services/textToIpa';
import { IPA_DATA } from '../services/ipaData';
import { VoiceConfig } from '../types';

interface InputSectionProps {
    text: string;
    setText: (s: string) => void;
    language: Language;
    setLanguage: (l: Language) => void;
    isIpaMode: boolean;
    setIsIpaMode: (b: boolean) => void;
    useDictionary: boolean;
    setUseDictionary: (b: boolean) => void;
    loading: boolean;
    dbInitializing?: boolean;
    error: string | null;
    displayIpa: string;
    selectedIpa: string;
    setSelectedIpa: (s: string) => void;
    config: VoiceConfig;
    onSynthesize: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
    text, setText, language, setLanguage, isIpaMode, setIsIpaMode,
    useDictionary, setUseDictionary,
    loading, dbInitializing, error, displayIpa, selectedIpa, setSelectedIpa, config,
    onSynthesize
}) => {
    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="mb-2">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-400">INPUT</label>
                    <div className="flex gap-2">
                        {!isIpaMode && (
                            <button 
                                onClick={() => setUseDictionary(!useDictionary)}
                                className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full transition-all border ${
                                    useDictionary 
                                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' 
                                    : 'bg-slate-700 border-slate-600 text-slate-400'
                                }`}
                                title={useDictionary ? "Dictionary enabled (Lexicon Lookup)" : "Dictionary disabled (Rule-based G2P only)"}
                            >
                                {useDictionary ? <BookOpen className="w-3 h-3"/> : <Book className="w-3 h-3"/>}
                                {useDictionary ? 'LEXICON ON' : 'LEXICON OFF'}
                            </button>
                        )}
                        <div className="relative">
                            <Globe className="absolute left-2 top-1.5 w-3 h-3 text-cyan-500" />
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="pl-7 pr-3 py-1 bg-slate-700 text-xs rounded-full text-cyan-400 border-none outline-none hover:bg-slate-600 appearance-none cursor-pointer font-bold uppercase tracking-wider"
                            >
                                {Object.entries(LANGUAGES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsIpaMode(!isIpaMode)}
                            className="flex items-center gap-2 text-xs bg-slate-700 px-3 py-1 rounded-full hover:bg-slate-600 transition-colors text-cyan-400"
                        >
                            {isIpaMode ? <Keyboard className="w-3 h-3"/> : <Languages className="w-3 h-3"/>}
                            {isIpaMode ? 'SWITCH TO TEXT' : 'SWITCH TO IPA'}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 text-cyan-400 font-mono text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-600 resize-none"
                    placeholder={isIpaMode ? "ENTER IPA SYMBOLS (e.g. hɛloʊ)..." : "ENTER TEXT HERE..."}
                    />
                </div>
                
                {/* Footer Area with IPA Preview and Buttons on New Row */}
                <div className="mt-4 flex flex-col gap-4">
                    {/* IPA Clickable Preview */}
                    {!isIpaMode && text && (
                        <div className="p-2 bg-slate-900/50 rounded border border-slate-700 font-mono text-sm flex flex-wrap gap-1 items-center min-h-[40px]">
                            <span className="text-slate-600 select-none mr-2">IPA:</span>
                            {Array.from(displayIpa).map((char, i) => {
                                const lookup = IPA_DATA[char] ? char : (IPA_DATA[char.toLowerCase()] ? char.toLowerCase() : null);
                                const isClickable = !!lookup;
                                const isSelected = lookup === selectedIpa;
                                const isOverridden = lookup && config.phonemeOverrides?.[lookup];

                                if (isClickable) {
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => {
                                                setSelectedIpa(lookup);
                                            }}
                                            className={`min-w-[1.2em] text-center rounded transition-all duration-150 ${
                                                isSelected 
                                                ? 'bg-cyan-600 text-white font-bold ring-2 ring-cyan-400/50 shadow-lg scale-110' 
                                                : isOverridden
                                                    ? 'text-yellow-400 bg-yellow-400/10'
                                                    : 'text-cyan-500 hover:bg-slate-700 hover:text-cyan-300'
                                            }`}
                                            title={isOverridden ? `Persona Overridden: '${lookup}'` : `Refine '${lookup}'`}
                                        >
                                            {char}
                                        </button>
                                    );
                                }
                                return <span key={i} className="text-slate-500 min-w-[0.5em] text-center">{char}</span>;
                            })}
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2">
                             {dbInitializing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full border border-slate-600/50 animate-pulse">
                                    <Database className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">Initializing Dictionaries...</span>
                                </div>
                             )}
                        </div>
                        <button 
                            onClick={onSynthesize}
                            disabled={loading || !text}
                            className={`flex items-center gap-3 py-2.5 px-8 rounded-lg font-black text-sm transition-all transform active:scale-[0.95]
                            ${loading || !text 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg'
                            }`}
                        >
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Wand2 className="w-4 h-4" />}
                            {loading ? 'BUSY...' : 'SPEAK'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm font-mono">
                    {error}
                </div>
            )}
        </div>
    );
};
