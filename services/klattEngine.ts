
import { VoiceConfig } from '../types';
import { convertToIPA, Language } from './textToIpa';
import { IPA_DATA, KlattFrame } from './ipaData';

const KlattWorkletCode = `
class Resonator {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.reset();
    }
    
    reset() {
        this.a = 0; this.b = 0; this.c = 0;
        this.p1 = 0; this.p2 = 0;
        this.f = 0; this.bw = 0;
    }

    set(f, bw) {
        // Stability clamping - Keep f below Nyquist and bw above 0
        f = Math.min(f, this.sampleRate / 2 - 200); 
        bw = Math.max(50, bw); // Increased min bandwidth to 50Hz to reduce ring/hiss

        if (f === this.f && bw === this.bw) return;
        this.f = f; this.bw = bw;
        
        const r = Math.exp(-Math.PI * bw / this.sampleRate);
        const c = -(r * r);
        const b = 2 * r * Math.cos(2 * Math.PI * f / this.sampleRate);
        const a = 1 - b - c;
        
        this.a = a; this.b = b; this.c = c;
    }

    process(x) {
        if (isNaN(x)) x = 0;
        let y = this.a * x + this.b * this.p1 + this.c * this.p2;
        
        // Stability Check - Reset if filter blows up
        if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1000) {
            y = 0;
            this.reset();
        }
        
        this.p2 = this.p1;
        this.p1 = y;
        return y;
    }
}

class Antiresonator {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.reset();
    }
    
    reset() {
        this.a = 0; this.b = 0; this.c = 0;
        this.p1 = 0; this.p2 = 0;
        this.f = 0; this.bw = 0;
    }

    set(f, bw) {
        if (f === this.f && bw === this.bw) return;
        this.f = f; this.bw = bw;
        
        const r = Math.exp(-Math.PI * bw / this.sampleRate);
        const c = -(r * r);
        const b = 2 * r * Math.cos(2 * Math.PI * f / this.sampleRate);
        const a = 1 - b - c;
        
        if (Math.abs(a) < 1e-5) return; 
        this.a = 1/a;
        this.b = -b/a;
        this.c = -c/a;
    }

    process(x) {
        if (isNaN(x)) x = 0;
        const y = this.a * x + this.b * this.p1 + this.c * this.p2;
        
        // Check for NaN
        if (isNaN(y) || !isFinite(y)) return 0;

        this.p2 = this.p1;
        this.p1 = x; 
        return y;
    }
}

class TiltFilter {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.a = 1; this.b = 0; this.y1 = 0;
        this.currentTilt = -1;
    }

    set(tilt) {
        if (tilt === this.currentTilt) return;
        this.currentTilt = tilt;
        
        if (tilt <= 0) {
            this.a = 1; this.b = 0;
            return;
        }
        
        // Map 0-100 tilt to a one-pole lowpass coefficient
        // Increased max from 0.95 to 0.99 for stronger muffling effect
        const b = Math.min(0.99, (tilt / 100) * 0.99);
        this.b = b;
        this.a = 1 - b;
    }

    process(x) {
        const y = this.a * x + this.b * this.y1;
        this.y1 = y;
        return y;
    }
}

class NoiseGen {
    constructor() { this.last = 0; }
    next() {
        const white = Math.random() * 2 - 1;
        this.last = (this.last + white) * 0.5;
        return this.last;
    }
}

class GlottalSource {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = 0;
        this.nGen = new NoiseGen();
        this.tiltFilter = new TiltFilter(sampleRate);
    }
    
    process(f0, av, ah, openQ, flutter, tilt, globalTime, robotic) {
        if (f0 <= 0) return 0;
        
        let effectiveF0 = f0;
        if (flutter > 0) {
            // Use globalTime for continuous low-frequency oscillation
            // Use sum of sines (approx Klatt's 12.7, 7.1, 4.7 Hz)
            const time = globalTime / this.sampleRate;
            const wobble = (Math.sin(time * 2 * Math.PI * 12.7) + 
                           Math.sin(time * 2 * Math.PI * 7.1) + 
                           Math.sin(time * 2 * Math.PI * 4.7)) / 3.0;
                           
            // Increase max depth to 20% (was 5%)
            effectiveF0 = f0 * (1 + wobble * 0.20 * flutter);
        }

        const period = this.sampleRate / effectiveF0;
        this.phase += 1;
        
        if (this.phase >= period) {
            this.phase -= period;
        }

        // Natural Glottal Pulse (Rosenberg C / Klatt)
        let natural = 0;
        const openPhaseLen = period * openQ;
        
        if (this.phase < openPhaseLen) {
            const x = this.phase / openPhaseLen;
            natural = 4 * x * (1 - x); 
            natural = natural * natural; 
            natural = -natural; 
        }

        // Apply Robotic Source (Sawtooth / Buzz)
        let robot = 0;
        if (robotic > 0) {
            // Basic Aliased Sawtooth - Rich in harmonics, very buzzy
            robot = 1.0 - (2.0 * (this.phase / period));
            
            // Add Digital Grit/Noise at high levels to simulate broken/harsh synthesis
            if (robotic > 0.5) {
                // Scale noise based on how far past 50% we are
                const grit = (robotic - 0.5) * 0.8; 
                robot += (Math.random() * 2 - 1) * grit;
            }

            robot *= 0.5; // Attenuate to match approximate loudness of natural pulse
        }

        // Blend Sources
        let voice = natural;
        if (robotic > 0) {
            voice = natural * (1 - robotic) + robot * robotic;
        }

        // Apply Spectral Tilt
        this.tiltFilter.set(tilt || 0);
        voice = this.tiltFilter.process(voice);

        const noise = this.nGen.next();
        return (voice * av) + (noise * ah * 0.5);
    }
}

class KlattProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const opts = options.processorOptions;
        this.frames = opts.frames || [];
        this.sampleRate = 44100;
        this.params = opts.params; 
        
        this.r1 = new Resonator(this.sampleRate);
        this.r2 = new Resonator(this.sampleRate);
        this.r3 = new Resonator(this.sampleRate);
        this.r4 = new Resonator(this.sampleRate);
        this.r5 = new Resonator(this.sampleRate);
        this.r6 = new Resonator(this.sampleRate);
        this.rNP = new Resonator(this.sampleRate);
        this.rNZ = new Antiresonator(this.sampleRate);
        
        this.p1 = new Resonator(this.sampleRate);
        this.p2 = new Resonator(this.sampleRate);
        this.p3 = new Resonator(this.sampleRate);
        this.p4 = new Resonator(this.sampleRate);
        this.p5 = new Resonator(this.sampleRate);
        this.p6 = new Resonator(this.sampleRate);
        
        this.glottal = new GlottalSource(this.sampleRate);
        this.fricationGen = new NoiseGen();
        
        this.sampleCount = 0;
        this.frameIndex = 0;
        this.globalTime = 0;
    }

    process(inputs, outputs) {
        const out = outputs[0][0];
        const framesLen = this.frames.length;
        
        // Safety: If no frames, output silence
        if (!framesLen) return true;

        const vibratoSpeed = this.params.vibratoSpeed || 6;
        const vibratoDepth = this.params.vibratoDepth || 0;
        const tilt = this.params.tilt || 0;
        const pitchBase = this.params.pitch;

        for (let i = 0; i < out.length; i++) {
            // End of buffer handling: 
            // If we are at the last frame, output silence (clearing buffer)
            if (this.frameIndex >= framesLen) {
                out[i] = 0;
                continue;
            }
            
            const cur = this.frames[this.frameIndex];
            // Safety: Ensure next frame exists, or clamp to current (which leads to silence if logic holds)
            const next = this.frames[this.frameIndex + 1] || cur;
            
            const baseDur = cur.baseDuration || 60;
            const dur = Math.max(1, (baseDur / this.params.speed) * (this.sampleRate / 1000.0));
            const t = Math.min(1, Math.max(0, this.sampleCount / dur));
            const L = (a, b) => (a || 0) + ((b || 0) - (a || 0)) * t;
            
            // Vibrato Logic
            let f0 = pitchBase;
            if (vibratoDepth > 0) {
                // Use internal global time counter for smooth, continuous vibrato
                const time = this.globalTime / this.sampleRate;
                // Supports Audio Rate Modulation (FM) if speed is high (>20Hz)
                const mod = Math.sin(time * 2 * Math.PI * vibratoSpeed) * 0.05 * vibratoDepth;
                f0 = f0 * (1 + mod);
            }
            
            // Global Params
            const breath = this.params.breathiness || 0;
            const flutter = this.params.flutter || 0;
            const openQ = this.params.mouth || 0.5; // Maps to Open Phase
            const robotic = this.params.robotic || 0;

            // Interpolate Params
            const AV = L(cur.voiceAmplitude, next.voiceAmplitude);
            let AH = L(cur.aspirationAmplitude, next.aspirationAmplitude);
            const AF = L(cur.fricationAmplitude, next.fricationAmplitude);
            const AB = L(cur.parallelBypass, next.parallelBypass);
            const ANP = L(cur.caNP, next.caNP);
            
            // Add Global Breathiness floor
            if (AV > 0) AH = Math.max(AH, breath * 0.5 * AV);

            const F1 = L(cur.cf1, next.cf1); const B1 = L(cur.cb1, next.cb1);
            const F2 = L(cur.cf2, next.cf2); const B2 = L(cur.cb2, next.cb2);
            const F3 = L(cur.cf3, next.cf3); const B3 = L(cur.cb3, next.cb3);
            const F4 = L(cur.cf4, next.cf4); const B4 = L(cur.cb4, next.cb4);
            const F5 = L(cur.cf5, next.cf5); const B5 = L(cur.cb5, next.cb5);
            const F6 = L(cur.cf6, next.cf6); const B6 = L(cur.cb6, next.cb6);
            const FNP = L(cur.cfNP, next.cfNP); const BNP = L(cur.cbNP, next.cbNP);
            const FNZ = L(cur.cfN0, next.cfN0); const BNZ = L(cur.cbN0, next.cbN0);

            const PF1 = L(cur.pf1, next.pf1); const PB1 = L(cur.pb1, next.pb1); const PA1 = L(cur.pa1, next.pa1);
            const PF2 = L(cur.pf2, next.pf2); const PB2 = L(cur.pb2, next.pb2); const PA2 = L(cur.pa2, next.pa2);
            const PF3 = L(cur.pf3, next.pf3); const PB3 = L(cur.pb3, next.pb3); const PA3 = L(cur.pa3, next.pa3);
            const PF4 = L(cur.pf4, next.pf4); const PB4 = L(cur.pb4, next.pb4); const PA4 = L(cur.pa4, next.pa4);
            const PF5 = L(cur.pf5, next.pf5); const PB5 = L(cur.pb5, next.pb5); const PA5 = L(cur.pa5, next.pa5);
            const PF6 = L(cur.pf6, next.pf6); const PB6 = L(cur.pb6, next.pb6); const PA6 = L(cur.pa6, next.pa6);

            // Generation
            let source = this.glottal.process(f0, AV, AH, openQ, flutter, tilt, this.globalTime, robotic);
            let casc = source;
            
            // Cascade Branch
            this.rNP.set(FNP, BNP);
            this.rNZ.set(FNZ, BNZ);
            if (ANP > 0) {
                // Nasal coupling
                casc = this.rNP.process(this.rNZ.process(casc));
            }
            
            // Series Resonators
            this.r6.set(F6, B6); casc = this.r6.process(casc);
            this.r5.set(F5, B5); casc = this.r5.process(casc);
            this.r4.set(F4, B4); casc = this.r4.process(casc);
            this.r3.set(F3, B3); casc = this.r3.process(casc);
            this.r2.set(F2, B2); casc = this.r2.process(casc);
            this.r1.set(F1, B1); casc = this.r1.process(casc);
            
            // Parallel Branch
            let noise = this.fricationGen.next() * AF;
            let par = noise * AB;
            
            this.p1.set(PF1, PB1); par += (this.p1.process(noise) - noise) * PA1;
            this.p2.set(PF2, PB2); par += (this.p2.process(noise) - noise) * PA2;
            this.p3.set(PF3, PB3); par += (this.p3.process(noise) - noise) * PA3;
            this.p4.set(PF4, PB4); par += (this.p4.process(noise) - noise) * PA4;
            this.p5.set(PF5, PB5); par += (this.p5.process(noise) - noise) * PA5;
            this.p6.set(PF6, PB6); par += (this.p6.process(noise) - noise) * PA6;
            
            // Output mixing and gain
            let val = (casc + par) * 0.4;
            
            // Soft clipping (Saturation) to prevent loud cracking/digital clipping
            val = Math.tanh(val);

            // Global Fadeout on the last frame to prevent clicks
            if (this.frameIndex === framesLen - 1) {
                const remaining = dur - this.sampleCount;
                if (remaining < 2000) { // last ~45ms at 44.1k
                    val *= (remaining / 2000);
                }
            }

            out[i] = val;
            
            this.sampleCount++;
            this.globalTime++;
            if (this.sampleCount >= dur) {
                this.sampleCount = 0;
                this.frameIndex++;
            }
        }
        return this.frameIndex < framesLen || this.sampleCount > 0;
    }
}
registerProcessor('klatt-full', KlattProcessor);
`;

let workletUrl: string | null = null;
const getWorkletUrl = () => {
  if (!workletUrl) {
    const blob = new Blob([KlattWorkletCode], { type: 'application/javascript' });
    workletUrl = URL.createObjectURL(blob);
  }
  return workletUrl;
};

// Calculate phoneme duration based on type and context
function calculateDuration(frame: KlattFrame, speed: number): number {
    if (frame._preStopGap) return 41;
    if (frame._postStopAspiration) return 20;
    if (frame._silence) return 150;
    
    // Use the explicit baseDuration from data
    return frame.baseDuration || 60;
}

export async function renderAudio(input: string, config: VoiceConfig, language: Language = 'en', isIpa: boolean = false): Promise<AudioBuffer> {
    const ipaText = isIpa ? input : convertToIPA(input, language);
    let sequence: KlattFrame[] = [];
    
    // Initial silence
    sequence.push({ ...IPA_DATA[' '], baseDuration: 100 });

    const chars = Array.from(ipaText);
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        
        if (char === ' ') {
            sequence.push({ ...IPA_DATA[' '], baseDuration: 100 });
            continue;
        }

        if (char === 'ː') {
            const prev = sequence[sequence.length - 1];
            if (prev) prev.baseDuration = (prev.baseDuration || 60) * 1.5;
            continue;
        }

        if (char === 'ˈ' || char === 'ˌ') continue; 

        const lookupChar = IPA_DATA[char] ? char : (IPA_DATA[char.toLowerCase()] ? char.toLowerCase() : null);
        if (!lookupChar) continue;

        let data = { ...IPA_DATA[lookupChar], ...(config.phonemeOverrides?.[lookupChar] || {}) };
        
        let frame = JSON.parse(JSON.stringify(data));
        
        // Stop handling: Pre-silence sequence
        if (frame.isStop) {
             // 1. Gap (Maintains silence or previous state decay)
             const gap = JSON.parse(JSON.stringify(IPA_DATA[' ']));
             gap._preStopGap = true;
             gap.baseDuration = 40;
             sequence.push(gap);

             // 2. Anchor (Ensures attack starts from 0 amplitude)
             const anchor = JSON.parse(JSON.stringify(IPA_DATA[' ']));
             anchor.baseDuration = 10; // 10ms Attack time for the burst
             sequence.push(anchor);
        }

        sequence.push(frame);
    }
    
    // Post-Process
    for (let i = 0; i < sequence.length; i++) {
        const cur = sequence[i];
        
        // Copy formants for 'h'
        if (cur.copyAdjacent) {
            const neighbor = sequence[i+1] || sequence[i-1];
            if (neighbor && !neighbor._silence) {
                ['cf1','cf2','cf3','cf4','cf5','cf6'].forEach(k => {
                    if ((neighbor as any)[k]) (cur as any)[k] = (neighbor as any)[k];
                });
            }
        }
        
        if (!cur.baseDuration) {
            cur.baseDuration = calculateDuration(cur, config.speed);
        }
        
        // Formant & Bandwidth Scales (Throat/Tongue)
        const formantKeys = ['cf1','cf2','cf3','cf4','cf5','cf6','pf1','pf2','pf3','pf4','pf5','pf6'];
        const bwKeys = ['cb1','cb2','cb3','cb4','cb5','cb6','pb1','pb2','pb3','pb4','pb5','pb6'];

        formantKeys.forEach(k => {
             if((cur as any)[k]) (cur as any)[k] *= config.throat;
        });

        bwKeys.forEach(k => {
             if((cur as any)[k]) (cur as any)[k] *= config.throat;
        });

        if (cur.cf2) cur.cf2 *= config.tongue;
    }

    // Final Silence
    const lastFrame = sequence[sequence.length - 1];
    const finalSilence = JSON.parse(JSON.stringify(IPA_DATA[' ']));
    
    finalSilence.voiceAmplitude = 0;
    finalSilence.aspirationAmplitude = 0;
    finalSilence.fricationAmplitude = 0;
    finalSilence.parallelBypass = 0;
    finalSilence.baseDuration = 400; 

    if (lastFrame) {
        ['cf1','cf2','cf3','cf4','cf5','cf6',
         'cb1','cb2','cb3','cb4','cb5','cb6',
         'pf1','pf2','pf3','pf4','pf5','pf6',
         'pb1','pb2','pb3','pb4','pb5','pb6'].forEach(k => {
             if ((lastFrame as any)[k] !== undefined) {
                 (finalSilence as any)[k] = (lastFrame as any)[k];
             }
         });
    }
    sequence.push(finalSilence);

    const totalDurationMs = sequence.reduce((a, b) => a + (b.baseDuration || 60), 0);
    const totalSeconds = (totalDurationMs / config.speed) / 1000 + 0.2;
    
    const sampleRate = 44100;
    const ctx = new OfflineAudioContext(1, Math.ceil(totalSeconds * sampleRate), sampleRate);
    
    await ctx.audioWorklet.addModule(getWorkletUrl());
    
    const node = new AudioWorkletNode(ctx, 'klatt-full', {
        processorOptions: {
            frames: sequence,
            params: config
        }
    });
    
    node.connect(ctx.destination);
    return await ctx.startRendering();
}
