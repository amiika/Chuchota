
import React from 'react';
import { Info, X, Edit3, Settings2 } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 sticky top-0">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About Chuchota
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6 space-y-6 text-slate-300 leading-relaxed">
                <p>
                    <strong>Chuchota</strong> is a specialized development toolkit designed for refining the Klatt Formant Synthesizer. 
                    It is not just a text-to-speech tool, but a workbench for crafting the acoustic definition of speech itself.
                </p>

                <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-cyan-500" /> 
                        1. Phoneme Refinement (Phoneme Editor)
                    </h3>
                    <p className="text-sm">
                        This is the core engineering tool. It allows you to fine-tune the acoustic properties of specific IPA symbols.
                        If a vowel sounds "off" or a consonant lacks punch, you can adjust its formants (F1-F6), bandwidths, and source amplitudes here.
                        Changes apply immediately to the current session.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-slate-400 pl-4">
                        <li>Click any IPA symbol in the preview area to load it into the editor.</li>
                        <li>Tweak parameters to improve pronunciation.</li>
                        <li>Use the "Copy JSON" button to export your improvements for the engine's source code.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-purple-500" /> 
                        2. Persona Creation (Voice Designer)
                    </h3>
                    <p className="text-sm">
                        This panel controls the global voice characteristics that are applied on top of the base phonemes.
                        It simulates different vocal tract sizes and prosody styles. Use this to define "Personas" for end-users.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-slate-400 pl-4">
                        <li>Adjust pitch, throat size, and effects like flutter or breathiness.</li>
                        <li>Use "Copy Persona" to save your voice configuration.</li>
                    </ul>
                </div>
            </div>
            <div className="p-6 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
                <button 
                onClick={onClose}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    </div>
);
