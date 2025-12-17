
import { VoiceConfig } from '../types';
import { convertToIPA, Language } from './textToIpa';
import { IPA_DATA, KlattFrame } from './ipaData';

const KlattWorkletCode = `
class Resonator {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.reset();
    }
    reset() { this.a = 0; this.b = 0; this.c = 0; this.p1 = 0; this.p2 = 0; this.f = 0; this.bw = 0; }
    set(f, bw) {
        f = Math.min(f, this.sampleRate / 2 - 200); bw = Math.max(50, bw);
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
        if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1000) { y = 0; this.reset(); }
        this.p2 = this.p1; this.p1 = y; return y;
    }
}

class Antiresonator {
    constructor(sampleRate) { this.sampleRate = sampleRate; this.reset(); }
    reset() { this.a = 0; this.b = 0; this.c = 0; this.p1 = 0; this.p2 = 0; this.f = 0; this.bw = 0; }
    set(f, bw) {
        if (f === this.f && bw === this.bw) return;
        this.f = f; this.bw = bw;
        const r = Math.exp(-Math.PI * bw / this.sampleRate);
        const c = -(r * r);
        const b = 2 * r * Math.cos(2 * Math.PI * f / this.sampleRate);
        const a = 1 - b - c;
        if (Math.abs(a) < 1e-5) return; 
        this.a = 1/a; this.b = -b/a; this.c = -c/a;
    }
    process(x) {
        if (isNaN(x)) x = 0;
        const y = this.a * x + this.b * this.p1 + this.c * this.p2;
        if (isNaN(y) || !isFinite(y)) return 0;
        this.p2 = this.p1; this.p1 = x; return y;
    }
}

class TiltFilter {
    constructor(sampleRate) { this.sampleRate = sampleRate; this.a = 1; this.b = 0; this.y1 = 0; this.currentTilt = -1; }
    set(tilt) {
        if (tilt === this.currentTilt) return;
        this.currentTilt = tilt;
        if (tilt <= 0) { this.a = 1; this.b = 0; return; }
        const b = Math.min(0.99, (tilt / 100) * 0.99);
        this.b = b; this.a = 1 - b;
    }
    process(x) { const y = this.a * x + this.b * this.y1; this.y1 = y; return y; }
}

class NoiseGen { constructor() { this.last = 0; } next() { const white = Math.random() * 2 - 1; this.last = (this.last + white) * 0.5; return this.last; } }

class GlottalSource {
    constructor(sampleRate) { this.sampleRate = sampleRate; this.phase = 0; this.nGen = new NoiseGen(); this.tiltFilter = new TiltFilter(sampleRate); }
    process(f0, av, ah, openQ, flutter, tilt, globalTime, robotic) {
        if (f0 <= 0) return 0;
        let effectiveF0 = f0;
        if (flutter > 0) {
            const time = globalTime / this.sampleRate;
            const wobble = (Math.sin(time * 2 * Math.PI * 12.7) + Math.sin(time * 2 * Math.PI * 7.1) + Math.sin(time * 2 * Math.PI * 4.7)) / 3.0;
            effectiveF0 = f0 * (1 + wobble * 0.20 * flutter);
        }
        const period = this.sampleRate / effectiveF0;
        this.phase += 1;
        if (this.phase >= period) this.phase -= period;
        let natural = 0; const openPhaseLen = period * openQ;
        if (this.phase < openPhaseLen) { const x = this.phase / openPhaseLen; natural = 4 * x * (1 - x); natural = natural * natural; natural = -natural; }
        let robot = 0;
        if (robotic > 0) { robot = 1.0 - (2.0 * (this.phase / period)); if (robotic > 0.5) { const grit = (robotic - 0.5) * 0.8; robot += (Math.random() * 2 - 1) * grit; } robot *= 0.5; }
        let voice = natural * (1 - robotic) + robot * robotic;
        this.tiltFilter.set(tilt || 0);
        voice = this.tiltFilter.process(voice);
        return (voice * av) + (this.nGen.next() * ah * 0.5);
    }
}

class KlattProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const opts = options.processorOptions;
        this.frames = opts.frames || [];
        this.sampleRate = 44100;
        this.params = opts.params; 
        this.r1 = new Resonator(this.sampleRate); this.r2 = new Resonator(this.sampleRate); this.r3 = new Resonator(this.sampleRate);
        this.r4 = new Resonator(this.sampleRate); this.r5 = new Resonator(this.sampleRate); this.r6 = new Resonator(this.sampleRate);
        this.rNP = new Resonator(this.sampleRate); this.rNZ = new Antiresonator(this.sampleRate);
        this.p1 = new Resonator(this.sampleRate); this.p2 = new Resonator(this.sampleRate); this.p3 = new Resonator(this.sampleRate);
        this.p4 = new Resonator(this.sampleRate); this.p5 = new Resonator(this.sampleRate); this.p6 = new Resonator(this.sampleRate);
        this.glottal = new GlottalSource(this.sampleRate); this.fricationGen = new NoiseGen();
        this.sampleCount = 0; this.frameIndex = 0; this.globalTime = 0;
    }
    process(inputs, outputs) {
        const out = outputs[0][0]; const framesLen = this.frames.length;
        if (!framesLen) return true;
        const {vibratoSpeed = 6, vibratoDepth = 0, tilt = 0, pitch: pitchBase, speed, mouth: openQ, robotic, breathiness: breath, flutter} = this.params;
        for (let i = 0; i < out.length; i++) {
            if (this.frameIndex >= framesLen) { out[i] = 0; continue; }
            const cur = this.frames[this.frameIndex]; const next = this.frames[this.frameIndex + 1] || cur;
            const dur = Math.max(1, (cur.baseDuration || 60) / speed * (this.sampleRate / 1000.0));
            const t = Math.min(1, Math.max(0, this.sampleCount / dur));
            const L = (a, b) => (a || 0) + ((b || 0) - (a || 0)) * t;
            let f0 = pitchBase;
            if (vibratoDepth > 0) f0 = f0 * (1 + Math.sin(this.globalTime / this.sampleRate * 2 * Math.PI * vibratoSpeed) * 0.05 * vibratoDepth);
            let AV = L(cur.voiceAmplitude, next.voiceAmplitude); let AH = L(cur.aspirationAmplitude, next.aspirationAmplitude);
            if (AV > 0) AH = Math.max(AH, breath * 0.5 * AV);
            const source = this.glottal.process(f0, AV, AH, openQ, flutter, tilt, this.globalTime, robotic);
            let casc = source;
            this.rNP.set(L(cur.cfNP, next.cfNP), L(cur.cbNP, next.cbNP));
            this.rNZ.set(L(cur.cfN0, next.cfN0), L(cur.cbN0, next.cbN0));
            if (L(cur.caNP, next.caNP) > 0) casc = this.rNP.process(this.rNZ.process(casc));
            this.r6.set(L(cur.cf6, next.cf6), L(cur.cb6, next.cb6)); casc = this.r6.process(casc);
            this.r5.set(L(cur.cf5, next.cf5), L(cur.cb5, next.cb5)); casc = this.r5.process(casc);
            this.r4.set(L(cur.cf4, next.cf4), L(cur.cb4, next.cb4)); casc = this.r4.process(casc);
            this.r3.set(L(cur.cf3, next.cf3), L(cur.cb3, next.cb3)); casc = this.r3.process(casc);
            this.r2.set(L(cur.cf2, next.cf2), L(cur.cb2, next.cb2)); casc = this.r2.process(casc);
            this.r1.set(L(cur.cf1, next.cf1), L(cur.cb1, next.cb1)); casc = this.r1.process(casc);
            let noise = this.fricationGen.next() * L(cur.fricationAmplitude, next.fricationAmplitude);
            let par = noise * L(cur.parallelBypass, next.parallelBypass);
            this.p1.set(L(cur.pf1, next.pf1), L(cur.pb1, next.pb1)); par += (this.p1.process(noise) - noise) * L(cur.pa1, next.pa1);
            this.p2.set(L(cur.pf2, next.pf2), L(cur.pb2, next.pb2)); par += (this.p2.process(noise) - noise) * L(cur.pa2, next.pa2);
            this.p3.set(L(cur.pf3, next.pf3), L(cur.pb3, next.pb3)); par += (this.p3.process(noise) - noise) * L(cur.pa3, next.pa3);
            this.p4.set(L(cur.pf4, next.pf4), L(cur.pb4, next.pb4)); par += (this.p4.process(noise) - noise) * L(cur.pa4, next.pa4);
            this.p5.set(L(cur.pf5, next.pf5), L(cur.pb5, next.pb5)); par += (this.p5.process(noise) - noise) * L(cur.pa5, next.pa5);
            this.p6.set(L(cur.pf6, next.pf6), L(cur.pb6, next.pb6)); par += (this.p6.process(noise) - noise) * L(cur.pa6, next.pa6);
            let val = Math.tanh((casc + par) * 0.4);
            if (this.frameIndex === framesLen - 1 && dur - this.sampleCount < 2000) val *= (dur - this.sampleCount) / 2000;
            out[i] = val; this.sampleCount++; this.globalTime++;
            if (this.sampleCount >= dur) { this.sampleCount = 0; this.frameIndex++; }
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

export async function renderAudio(input: string, config: VoiceConfig, language: Language = 'en', isIpa: boolean = false): Promise<AudioBuffer> {
    const ipaText = isIpa ? input : await convertToIPA(input, language);
    let sequence: KlattFrame[] = [{ ...IPA_DATA[' '], baseDuration: 100 }];
    const chars = Array.from(ipaText);
    for (const char of chars) {
        if (char === ' ') { sequence.push({ ...IPA_DATA[' '], baseDuration: 100 }); continue; }
        if (char === 'ː') { const prev = sequence[sequence.length - 1]; if (prev) prev.baseDuration = (prev.baseDuration || 60) * 1.5; continue; }
        if (char === 'ˈ' || char === 'ˌ') continue; 
        const lookup = IPA_DATA[char] ? char : (IPA_DATA[char.toLowerCase()] ? char.toLowerCase() : null);
        if (!lookup) continue;
        const frame = JSON.parse(JSON.stringify({ ...IPA_DATA[lookup], ...(config.phonemeOverrides?.[lookup] || {}) }));
        if (frame.isStop) {
             sequence.push({ ...IPA_DATA[' '], _preStopGap: true, baseDuration: 40 });
             sequence.push({ ...IPA_DATA[' '], baseDuration: 10 });
        }
        sequence.push(frame);
    }
    for (let i = 0; i < sequence.length; i++) {
        const cur = sequence[i];
        if (cur.copyAdjacent) {
            const neighbor = sequence[i+1] || sequence[i-1];
            if (neighbor && !neighbor._silence) ['cf1','cf2','cf3','cf4','cf5','cf6'].forEach(k => (cur as any)[k] = (neighbor as any)[k]);
        }
        if (!cur.baseDuration) cur.baseDuration = cur._silence ? 150 : 60;
        ['cf1','cf2','cf3','cf4','cf5','cf6','pf1','pf2','pf3','pf4','pf5','pf6'].forEach(k => { if((cur as any)[k]) (cur as any)[k] *= config.throat; });
        ['cb1','cb2','cb3','cb4','cb5','cb6','pb1','pb2','pb3','pb4','pb5','pb6'].forEach(k => { if((cur as any)[k]) (cur as any)[k] *= config.throat; });
        if (cur.cf2) cur.cf2 *= config.tongue;
    }
    const finalSilence = JSON.parse(JSON.stringify(IPA_DATA[' ']));
    finalSilence.baseDuration = 400; 
    sequence.push(finalSilence);
    const sampleRate = 44100;
    const totalSeconds = (sequence.reduce((a, b) => a + (b.baseDuration || 60), 0) / config.speed) / 1000 + 0.2;
    const ctx = new OfflineAudioContext(1, Math.ceil(totalSeconds * sampleRate), sampleRate);
    await ctx.audioWorklet.addModule(getWorkletUrl());
    new AudioWorkletNode(ctx, 'klatt-full', { processorOptions: { frames: sequence, params: config } }).connect(ctx.destination);
    return await ctx.startRendering();
}
