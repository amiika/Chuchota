
import { KlattFrame } from './services/ipaData';

export const enum GlottalSourceType { impulsive, natural, noise }

// Parameters for the whole sound.
export interface MainParms {
   sampleRate:                         number;
   glottalSourceType:                  GlottalSourceType; 
}

// Parameters for a sound frame.
export interface FrameParms {
   duration:                           number;                       // frame duration in seconds
   f0:                                 number;                       // fundamental frequency in Hz
   flutterLevel:                       number;                       // F0 flutter level, 0 .. 1
   openPhaseRatio:                     number;                       // relative length of the open phase of the glottis
   breathinessDb:                      number;                       // breathiness in voicing in dB
   tiltDb:                             number;                       // spectral tilt for glottal source in dB
   gainDb:                             number;                       // overall gain (output gain) in dB
   agcRmsLevel:                        number;                       // RMS level for automatic gain control (AGC)
   nasalFormantFreq:                   number;                       // nasal formant frequency in Hz
   nasalFormantBw:                     number;                       // nasal formant bandwidth in Hz
   oralFormantFreq:                    number[];                     // oral format frequencies in Hz
   oralFormantBw:                      number[];                     // oral format bandwidths in Hz

   // Cascade branch:
   cascadeEnabled:                     boolean;
   cascadeVoicingDb:                   number;
   cascadeAspirationDb:                number;
   cascadeAspirationMod:               number;
   nasalAntiformantFreq:               number;
   nasalAntiformantBw:                 number;

   // Parallel branch:
   parallelEnabled:                    boolean;
   parallelVoicingDb:                  number;
   parallelAspirationDb:               number;
   parallelAspirationMod:              number;
   fricationDb:                        number;
   fricationMod:                       number;
   parallelBypassDb:                   number;
   nasalFormantDb:                     number;
   oralFormantDb:                      number[]; 
}

// A simplified structure for Gemini to generate keyframes
export interface PhonemeKeyframe {
    phoneme: string;
    duration: number; // in seconds
    f0: number; // Pitch target
    // We simplify the control for the LLM to just the core formants and voicing
    F1: number;
    F2: number;
    F3: number;
    F4: number;
    F5: number;
    F6: number;
    BW1: number;
    BW2: number;
    BW3: number;
    voicing: boolean; // True for vowels/voiced consonants
    frication: boolean; // True for fricatives
    aspiration: boolean; // True for H, P, T, K aspiration phases
    isVowel?: boolean;
    isVoiced?: boolean;
}

export interface VoiceConfig {
    pitch: number;      // Base Hz (e.g., 130)
    speed: number;      // Duration multiplier (e.g., 1.0)
    declination: number; // gradual F0 drop, 0.0 to 1.0
    throat: number;     // Formant Frequency scale (e.g. 1.0)
    mouth: number;      // Open Phase Ratio scale (e.g., 0.5 - 0.9)
    tongue: number;     // F2 scale (e.g., 1.0)
    breathiness: number; // 0.0 - 1.0
    flutter: number;    // 0.0 - 1.0
    vibratoDepth: number; // 0.0 - 1.0 (Pitch modulation depth)
    vibratoSpeed: number; // Hz (e.g. 6.0)
    tilt: number;         // 0 - 100 (Spectral Tilt / Muffling)
    robotic: number;      // 0.0 - 1.0 (Mix of Sawtooth source)
    phonemeOverrides?: Record<string, Partial<KlattFrame>>;
}
