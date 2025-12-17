
import React, { useState, useCallback, useEffect } from 'react';
import { renderAudio } from './services/klattEngine';
import { convertToIPA, Language } from './services/textToIpa';
import { VoiceConfig } from './types';
import { PERSONAS } from './services/personas';
import { bufferToWave } from './services/audioUtils';
import { IPA_DATA } from './services/ipaData';
import { isLanguagePopulated, seedLanguage } from './services/db';

import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { InputSection } from './components/InputSection';
import { WaveformDisplay } from './components/WaveformDisplay';
import { VoiceDesigner } from './components/VoiceDesigner';
import { IpaEditor } from './components/IpaEditor';

const App: React.FC = () => {
  // State
  const [text, setText] = useState('ALL YOUR BASE ARE BELONG TO US');
  const [isIpaMode, setIsIpaMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [dbInitializing, setDbInitializing] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [config, setConfig] = useState<VoiceConfig>(JSON.parse(JSON.stringify(PERSONAS["Default"])));
  const [selectedIpa, setSelectedIpa] = useState<string>('a');
  const [personaCopied, setPersonaCopied] = useState(false);
  const [displayIpa, setDisplayIpa] = useState('');

  // Initialize DB in background - Parallelized for speed
  useEffect(() => {
    const init = async () => {
      const langs: Language[] = ['en', 'fr', 'fi', 'ja'];
      
      try {
        await Promise.all(langs.map(async (lang) => {
          const populated = await isLanguagePopulated(lang);
          if (!populated) {
            const resp = await fetch(`dictionaries/${lang}.json`);
            if (resp.ok) {
              const data = await resp.json();
              await seedLanguage(lang, data);
            }
          }
        }));
      } catch (e) {
        console.warn("Background dictionary sync interrupted, falling back to rules.", e);
      } finally {
        setDbInitializing(false);
      }
    };
    init();
  }, []);

  // Async IPA Preview
  useEffect(() => {
    let active = true;
    const update = async () => {
      if (isIpaMode) {
        setDisplayIpa(text);
      } else {
        const ipa = await convertToIPA(text, language);
        if (active) setDisplayIpa(ipa);
      }
    };
    update();
    return () => { active = false; };
  }, [text, language, isIpaMode]);

  // Handlers
  const handleSynthesize = async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setChannelData(null);

    try {
      // Synthesis proceeds regardless of dbInitializing state
      // convertToIPA handles the fallback internally
      const buffer = await renderAudio(text, config, language, isIpaMode);
      processAudioBuffer(buffer);
    } catch (err) {
      console.error(err);
      setError("Synthesis Error: " + (err as Error).message);
      setLoading(false);
    }
  };

  const processAudioBuffer = (buffer: AudioBuffer) => {
    const data = buffer.getChannelData(0);
    const wavBlob = bufferToWave(buffer, data.length);
    const url = URL.createObjectURL(wavBlob);
    
    setChannelData(data);
    setAudioUrl(url);
    setLoading(false);
  };

  const updateConfig = (key: keyof VoiceConfig, value: any) => {
      setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updatePhonemeOverride = useCallback((char: string, key: string, value: any) => {
    setConfig(prev => {
        const currentOverrides = { ...(prev.phonemeOverrides || {}) };
        const charOverride = { ...(currentOverrides[char] || {}) };
        const defaultValue = (IPA_DATA[char] as any)?.[key];
        
        if (value === defaultValue) delete (charOverride as any)[key];
        else (charOverride as any)[key] = value;

        if (Object.keys(charOverride).length === 0) delete currentOverrides[char];
        else currentOverrides[char] = charOverride;
        
        return { ...prev, phonemeOverrides: currentOverrides };
    });
  }, []);

  const applyPreset = (name: string) => {
      setConfig(JSON.parse(JSON.stringify(PERSONAS[name])));
  };

  const resetConfig = () => {
    setConfig(JSON.parse(JSON.stringify(PERSONAS["Default"])));
  };

  const handleCopyPersona = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setPersonaCopied(true);
    setTimeout(() => setPersonaCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 lg:px-24 xl:px-48 flex flex-col pb-12">
      <Header onOpenHelp={() => setShowHelp(true)} />
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
            <InputSection 
                text={text} setText={setText}
                language={language} setLanguage={setLanguage}
                isIpaMode={isIpaMode} setIsIpaMode={setIsIpaMode}
                loading={loading}
                error={error}
                dbInitializing={dbInitializing}
                displayIpa={displayIpa}
                selectedIpa={selectedIpa} setSelectedIpa={setSelectedIpa}
                config={config}
                onSynthesize={handleSynthesize}
            />

            {audioUrl && <WaveformDisplay audioUrl={audioUrl} data={channelData} />}
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <IpaEditor 
                    selectedChar={selectedIpa} onSelectChar={setSelectedIpa} 
                    config={config} onUpdateOverride={updatePhonemeOverride}
                />
            </div>
        </div>

        <VoiceDesigner 
            config={config} updateConfig={updateConfig}
            applyPreset={applyPreset} resetConfig={resetConfig}
            onCopyPersona={handleCopyPersona} personaCopied={personaCopied}
        />
      </div>
    </div>
  );
};

export default App;
