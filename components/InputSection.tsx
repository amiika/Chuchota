
import React from 'react';
import { Globe, Keyboard, Languages, Wand2, Book, BookOpen, Loader2, XCircle } from 'lucide-react';
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
    onClearText?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
    text, setText, language, setLanguage, isIpaMode, setIsIpaMode,
    useDictionary, setUseDictionary,
    loading, dbInitializing, error, displayIpa, selectedIpa, setSelectedIpa, config,
    onSynthesize, onClearText
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
                                disabled={dbInitializing}
                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-all border ${
                                    dbInitializing
                                    ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-wait'
                                    : useDictionary 
                                        ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50 hover:border-emerald-400' 
                                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:border-slate-500'
                                }`}
                                title={dbInitializing ? "Dictionaries are loading in background. Using rules for now..." : (useDictionary ? "Lexicon (Dictionary) enabled" : "Rule-based G2P only")}
                            >
                                {dbInitializing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : useDictionary ? (
                                    <BookOpen className="w-3.5 h-3.5"/>
                                ) : (
                                    <Book className="w-3.5 h-3.5"/>
                                )}
                                <span className="font-bold tracking-tight">
                                    {dbInitializing ? 'LOADING DICT...' : (useDictionary ? 'LEXICON ON' : 'LEXICON OFF')}
                                </span>
                            </button>
                        )}
                        <div className="relative">
                            <Globe className="absolute left-2.5 top-2 w-3.5 h-3.5 text-cyan-500" />
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="pl-8 pr-3 py-1.5 bg-slate-700 text-xs rounded-full text-cyan-400 border-none outline-none hover:bg-slate-600 appearance-none cursor-pointer font-bold uppercase tracking-wider transition-colors"
                            >
                                {Object.entries(LANGUAGES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsIpaMode(!isIpaMode)}
                            className="flex items-center gap-2 text-xs bg-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-600 transition-all text-cyan-400 border border-transparent hover:border-cyan-500/30"
                        >
                            {isIpaMode ? <Keyboard className="w-3.5 h-3.5"/> : <Languages className="w-3.5 h-3.5"/>}
                            <span className="font-bold">{isIpaMode ? 'USE TEXT' : 'USE IPA'}</span>
                        </button>
                    </div>
                </div>
                <div className="relative group">
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 text-cyan-400 font-mono text-lg focus:ring-2 focus:ring-cyan-500/50 focus:outline-none placeholder-slate-600 resize-none transition-all"
                        placeholder={isIpaMode ? "ENTER IPA SYMBOLS (e.g. hɛloʊ)..." : "ENTER TEXT HERE..."}
                    />
                    {text && (
                        <button 
                            onClick={onClearText}
                            className="absolute right-3 top-3 p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Clear Text"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>
                
                <div className="mt-4 flex flex-col gap-4">
                    {/* IPA Clickable Preview */}
                    {!isIpaMode && text && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 font-mono text-sm flex flex-wrap gap-1.5 items-center min-h-[48px] animate-in fade-in duration-300">
                            <span className="text-slate-600 select-none mr-2 font-bold text-xs">IPA:</span>
                            {Array.from(displayIpa).map((char: string, i) => {
                                const lookup = IPA_DATA[char] ? char : (IPA_DATA[char.toLowerCase()] ? char.toLowerCase() : null);
                                const isClickable = !!lookup;
                                const isSelected = lookup === selectedIpa;
                                const isOverridden = lookup && config.phonemeOverrides?.[lookup];

                                if (isClickable) {
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedIpa(lookup)}
                                            className={`min-w-[1.4em] text-center rounded transition-all duration-150 py-0.5 ${
                                                isSelected 
                                                ? 'bg-cyan-600 text-white font-bold ring-2 ring-cyan-400/50 shadow-lg scale-110' 
                                                : isOverridden
                                                    ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
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
                    <div className="flex items-center gap-3 justify-end">
                        <button 
                            onClick={onSynthesize}
                            disabled={loading || !text}
                            className={`flex items-center gap-3 py-3 px-10 rounded-xl font-black text-sm transition-all transform active:scale-[0.97] shadow-xl
                            ${loading || !text 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20'
                            }`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {loading ? 'SYNTHESIZING...' : 'SPEAK'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-900/40 border border-red-500/30 rounded-lg text-red-200 text-sm font-mono animate-in slide-in-from-top-2">
                    <span className="font-bold mr-2">ERROR:</span> {error}
                </div>
            )}
        </div>
    );
};
