
import React from 'react';
import { Bot, HelpCircle } from 'lucide-react';

interface HeaderProps {
    onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp }) => (
    <header className="mb-6 flex flex-col items-center justify-center relative">
         <button 
            onClick={onOpenHelp}
            className="absolute right-0 top-0 text-slate-500 hover:text-cyan-400 transition-colors"
            title="Help & Documentation"
         >
             <HelpCircle className="w-6 h-6" />
         </button>

        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 flex items-center justify-center gap-3 tracking-tighter">
          <Bot className="w-10 h-10 text-cyan-400" />
          CHUCHOTA
        </h1>
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Data-Driven IPA Formant Synthesis Development Toolkit</p>
    </header>
);
