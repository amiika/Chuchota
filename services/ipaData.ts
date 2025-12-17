// Acoustic definition for IPA symbols

export interface KlattFrame {
    // Functional Flags (Behavioral)
    isNasal?: boolean;      // Toggles Nasal Branch (ANP)
    isStop?: boolean;       // Triggers Gap + Burst generation
    copyAdjacent?: boolean; // For 'h' to inherit formants
    
    // Internal timing flags (runtime)
    _preStopGap?: boolean;
    _postStopAspiration?: boolean;
    _silence?: boolean;

    // Voicing Source
    voiceAmplitude: number;      // AV
    aspirationAmplitude: number; // AH
    fricationAmplitude: number;  // AF
    
    // Cascade Branch
    cf1: number; cb1: number;
    cf2: number; cb2: number;
    cf3: number; cb3: number;
    cf4: number; cb4: number;
    cf5: number; cb5: number;
    cf6: number; cb6: number;
    cfNP: number; cbNP: number; // Nasal Pole
    cfN0: number; cbN0: number; // Nasal Zero
    caNP: number;               // Nasal Pole Amplitude (Controlled by isNasal)

    // Parallel Branch
    pf1: number; pb1: number; pa1: number;
    pf2: number; pb2: number; pa2: number;
    pf3: number; pb3: number; pa3: number;
    pf4: number; pb4: number; pa4: number;
    pf5: number; pb5: number; pa5: number;
    pf6: number; pb6: number; pa6: number;
    parallelBypass: number;     // AB
    
    // Explicit Duration (ms)
    baseDuration: number; 
}

const DEFAULTS: KlattFrame = {
    isNasal: false, isStop: false,
    
    voiceAmplitude: 0, aspirationAmplitude: 0, fricationAmplitude: 0,
    
    cf1: 500, cb1: 60,
    cf2: 1500, cb2: 90,
    cf3: 2500, cb3: 150,
    cf4: 3300, cb4: 250,
    cf5: 3750, cb5: 200,
    cf6: 4900, cb6: 1000,
    cfNP: 200, cbNP: 100,
    cfN0: 250, cbN0: 100,
    caNP: 0,

    pf1: 500, pb1: 100, pa1: 0,
    pf2: 1500, pb2: 100, pa2: 0,
    pf3: 2500, pb3: 100, pa3: 0,
    pf4: 3300, pb4: 250, pa4: 0,
    pf5: 3750, pb5: 200, pa5: 0,
    pf6: 4900, pb6: 1000, pa6: 0,
    parallelBypass: 0,
    
    baseDuration: 60
};

const d = (p: Partial<KlattFrame>): KlattFrame => ({ ...DEFAULTS, ...p });

export const IPA_DATA: Record<string, KlattFrame> = {
    'I': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 400, cf2: 1800, cf3: 2570, cf4: 3300, cf5: 3750, cf6: 4900,
        cb1: 55, cb2: 75, cb3: 105,
        pf1: 400, pf2: 1800, pf3: 2570, pf4: 3300, pf5: 3750, pf6: 4900,
        pb1: 50, pb2: 100, pb3: 140,
    }),
    'e': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 480, cf2: 1720, cf3: 2520,
        cb1: 77, cb2: 75, cb3: 150,
        pf1: 480, pf2: 1720, pf3: 2520,
        pb1: 70, pb2: 100, pb3: 200,
    }),
    'i': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 310, cf2: 2020, cf3: 2960,
        cb1: 49.5, cb2: 150, cb3: 300,
        pf1: 310, pf2: 2020, pf3: 2960,
        pb1: 45, pb2: 200, pb3: 400,
    }),
    'o': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 540, cf2: 1100, cf3: 2300,
        cb1: 88, cb2: 52.5, cb3: 52.5,
        pf1: 540, pf2: 1100, pf3: 2300,
        pb1: 80, pb2: 70, pb3: 70,
    }),
    'u': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 290, cf2: 1350, cf3: 2280,
        cb1: 71.5, cb2: 82.5, cb3: 105,
        pf1: 350, pf2: 1250, pf3: 2200,
        pb1: 65, pb2: 110, pb3: 140,
    }),
    'æ': d({
        voiceAmplitude: 1.0, baseDuration: 200,
        cf1: 620, cf2: 1660, cf3: 2430, cf4: 3300, cf5: 3750, cf6: 4900,
        cb1: 77, cb2: 112.5, cb3: 240, cb4: 250, cb5: 200, cb6: 1000,
        cfNP: 200, cbNP: 100, cfN0: 250, cbN0: 100,
        pf1: 620, pf2: 1660, pf3: 2430, pf4: 3300, pf5: 3750, pf6: 4900,
        pb1: 70, pb2: 150, pb3: 320, pb4: 250, pb5: 200, pb6: 1000,
    }),
    'ɑ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 700, cf2: 1220, cf3: 2600,
        cb1: 143, cb2: 52.5, cb3: 120,
        pf1: 700, pf2: 1220, pf3: 2600,
        pb1: 130, pb2: 70, pb3: 160,
    }),
    'ɔ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 450, cf2: 870, cf3: 2570,
        cb1: 99, cb2: 75, cb3: 60,
        pf1: 600, pf2: 990, pf3: 2570,
        pb1: 90, pb2: 100, pb3: 80,
    }),
    'ə': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 500, cf2: 1400, cf3: 2300,
        cb1: 110, cb2: 45, cb3: 82.5,
        pf1: 500, pf2: 1400, pf3: 2300,
        pb1: 100, pb2: 60, pb3: 110,
    }),
    'ɛ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 530, cf2: 1680, cf3: 2500,
        cb1: 66, cb2: 67.5, cb3: 150,
        pf1: 530, pf2: 1680, pf3: 2500,
        pb1: 60, pb2: 90, pb3: 200,
    }),
    'ʊ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 405, cf2: 900, cf3: 2420,
        cb1: 88, cb2: 75, cb3: 60,
        pf1: 450, pf2: 1100, pf3: 2350,
        pb1: 80, pb2: 100, pb3: 80,
    }),
    'ʌ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 620, cf2: 1220, cf3: 2550,
        cb1: 88, cb2: 37.5, cb3: 105,
        pf1: 620, pf2: 1220, pf3: 2550,
        pb1: 80, pb2: 50, pb3: 140,
    }),
    'ɪ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 360, cf2: 1800, cf3: 2570,
        cb1: 55, cb2: 75, cb3: 105,
        pf1: 400, pf2: 1800, pf3: 2570,
        pb1: 50, pb2: 100, pb3: 140,
    }),
    'ɜ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 500, cf2: 1400, cf3: 2300,
        cb1: 110, cb2: 45, cb3: 82.5,
        pf1: 500, pf2: 1400, pf3: 2300,
        pb1: 100, pb2: 60, pb3: 110,
    }),
    'a': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 650, cf2: 1430, cf3: 2500,
        cb1: 116.6, cb2: 76.5, cb3: 178,
        pf1: 700, pf2: 1220, pf3: 2600,
        pb1: 130, pb2: 70, pb3: 160,
    }),
    'y': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 300, cf2: 1700, cf3: 2100,
        cb1: 50, cb2: 100, cb3: 150,
        pf1: 300, pf2: 1700, pf3: 2100,
        pb1: 50, pb2: 100, pb3: 150,
    }),
    'ø': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 400, cf2: 1600, cf3: 2300,
        cb1: 60, cb2: 90, cb3: 150,
        pf1: 400, pf2: 1600, pf3: 2300,
        pb1: 60, pb2: 90, pb3: 150,
    }),
    'ɯ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 300, cf2: 1200, cf3: 2500,
        cb1: 60, cb2: 100, cb3: 150,
        pf1: 300, pf2: 1200, pf3: 2500,
        pb1: 60, pb2: 100, pb3: 150,
    }),
    'œ': d({
        voiceAmplitude: 1.0, baseDuration: 130,
        cf1: 500, cf2: 1300, cf3: 2300,
        cb1: 80, cb2: 80, cb3: 120,
        pf1: 500, pf2: 1300, pf3: 2300,
        pb1: 80, pb2: 80, pb3: 120,
    }),

    // Stops (baseDuration: 30)
    'b': d({
        isStop: true, voiceAmplitude: 1.0, baseDuration: 30,
        parallelBypass: 0.1, 
        fricationAmplitude: 0.1, 
        cf1: 200, cf2: 1100, cf3: 2150, 
        cb1: 66, cb2: 75, cb3: 97.5,
        pf1: 200, pf2: 1100, pf3: 2150,
        pb1: 60, pb2: 100, pb3: 130,
    }),
    'd': d({
        isStop: true, voiceAmplitude: 1.0, fricationAmplitude: 0.1, baseDuration: 30,
        cf1: 200, cf2: 1600, cf3: 2600,
        cb1: 66, cb2: 75, cb3: 127.5,
        pf1: 200, pf2: 1600, pf3: 2600,
        pb1: 60, pb2: 100, pb3: 170,
        pa2: 0.05, pa3: 0.05, pa6: 0.1,
    }),
    'g': d({
        isStop: true, voiceAmplitude: 1.0, fricationAmplitude: 0.1, baseDuration: 30,
        cf1: 200, cf2: 1990, cf3: 2850,
        cb1: 66, cb2: 112.5, cb3: 210,
        pf1: 200, pf2: 1990, pf3: 2650,
        pb1: 60, pb2: 150, pb3: 200,
        pa2: 0.1, pa3: 0.1, pa4: 0.05, pa5: 0.05, pa6: 0.05,
    }),
    'k': d({
        isStop: true, fricationAmplitude: 0.15, baseDuration: 30,
        cf1: 300, cf2: 1990, cf3: 2850,
        cb1: 275, cb2: 120, cb3: 247.5,
        pf1: 300, pf2: 1990, pf3: 2650,
        pb1: 250, pb2: 130, pb3: 200,
        pa2: 0.15, pa3: 0.1, pa4: 0.05, pa5: 0.05, pa6: 0.05,
    }),
    'p': d({
        isStop: true, fricationAmplitude: 0.4, parallelBypass: 0.15, baseDuration: 30,
        cf1: 400, cf2: 1100, cf3: 2150,
        cb1: 330, cb2: 112.5, cb3: 165,
        pf1: 400, pf2: 1100, pf3: 2150,
        pb1: 300, pb2: 150, pb3: 220,
    }),
    't': d({
        isStop: true, fricationAmplitude: 0.1,
        cf1: 400, cf2: 1600, cf3: 2600, cf4: 3300, cf5: 3750, cf6: 4900,
        cb1: 330, cb2: 90, cb3: 187.5, cb4: 250, cb5: 200, cb6: 1000,
        cfNP: 200, cbNP: 100, cfN0: 250, cbN0: 100,
        pf1: 400, pf2: 1600, pf3: 2600, pf4: 3300, pf5: 3750, pf6: 4900,
        pb1: 300, pb2: 120, pb3: 250, pb4: 250, pb5: 200, pb6: 1000,
        pa2: 0.1, pa3: 0.1, pa6: 0.3,
        baseDuration: 30
    }),
    'm': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 70,
        cf1: 472, cf2: 1100, cf3: 2130, cfNP: 216, cfN0: 450,
        cb1: 44, cb2: 150, cb3: 150,
        pf1: 480, pf2: 1270, pf3: 2130,
        pb1: 40, pb2: 200, pb3: 200,
    }),
    'n': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 70,
        cf1: 280, cf2: 1700, cf3: 2740, cfNP: 216, cfN0: 450,
        cb1: 44, cb2: 225, cb3: 225,
        pf1: 480, pf2: 1340, pf3: 2470,
        pb1: 40, pb2: 300, pb3: 300,
    }),
    'ŋ': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 70,
        cf1: 480, cf2: 2000, cf3: 2900, cfNP: 216, cfN0: 450,
        cb1: 44, cb2: 225, cb3: 225,
        pf1: 480, pf2: 2000, pf3: 2900,
        pb1: 40, pb2: 300, pb3: 300,
    }),
    'ɲ': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 70,
        cf1: 250, cf2: 2000, cf3: 3000, cfNP: 216, cfN0: 450,
        cb1: 50, cb2: 200, cb3: 300,
        pf1: 250, pf2: 2000, pf3: 3000,
        pb1: 50, pb2: 200, pb3: 300,
    }),
    'ɛ̃': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 130,
        cf1: 550, cf2: 1500, cf3: 2500, cfNP: 250, cfN0: 500,
        cb1: 80, cb2: 100, cb3: 150,
        pf1: 550, pf2: 1500, pf3: 2500,
        pb1: 80, pb2: 100, pb3: 150,
    }),
    'ɑ̃': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 130,
        cf1: 700, cf2: 1100, cf3: 2500, cfNP: 250, cfN0: 500,
        cb1: 120, cb2: 100, cb3: 150,
        pf1: 700, pf2: 1100, pf3: 2500,
        pb1: 120, pb2: 100, pb3: 150,
    }),
    'ɔ̃': d({
        isNasal: true, voiceAmplitude: 1.0, caNP: 1.0, baseDuration: 130,
        cf1: 450, cf2: 900, cf3: 2500, cfNP: 250, cfN0: 500,
        cb1: 90, cb2: 100, cb3: 150,
        pf1: 450, pf2: 900, pf3: 2500,
        pb1: 90, pb2: 100, pb3: 150,
    }),
    'l': d({
        voiceAmplitude: 1.0, baseDuration: 70,
        cf1: 310, cf2: 1050, cf3: 2880,
        cb1: 55, cb2: 75, cb3: 210,
        pf1: 310, pf2: 1050, pf3: 2880,
        pb1: 50, pb2: 100, pb3: 280,
    }),
    'ɹ': d({
        voiceAmplitude: 1.0, baseDuration: 70,
        cf1: 310, cf2: 1050, cf3: 1350,
        cb1: 77, cb2: 75, cb3: 112.5,
        pf1: 310, pf2: 1050, pf3: 2050,
        pb1: 70, pb2: 100, pb3: 150,
    }),
    'j': d({
        voiceAmplitude: 1.0, baseDuration: 70,
        cf1: 260, cf2: 2070, cf3: 3020,
        cb1: 44, cb2: 187.5, cb3: 375,
        pf1: 260, pf2: 2070, pf3: 3020,
        pb1: 40, pb2: 250, pb3: 500,
    }),
    'w': d({
        voiceAmplitude: 1.0, baseDuration: 70,
        cf1: 290, cf2: 610, cf3: 2150,
        cb1: 55, cb2: 60, cb3: 45,
        pf1: 290, pf2: 610, pf3: 2150,
        pb1: 50, pb2: 80, pb3: 60,
    }),
    'ɥ': d({
        voiceAmplitude: 1.0, baseDuration: 70,
        cf1: 280, cf2: 1700, cf3: 2100,
        cb1: 60, cb2: 100, cb3: 150,
        pf1: 280, pf2: 1700, pf3: 2100,
        pb1: 60, pb2: 100, pb3: 150,
    }),
    'ɾ': d({
        voiceAmplitude: 1.0,
        baseDuration: 25, // Short
        cf1: 300, cf2: 1500, cf3: 2200,
        cb1: 60, cb2: 100, cb3: 150,
        pf1: 300, pf2: 1500, pf3: 2200,
        pb1: 60, pb2: 100, pb3: 150,
    }),
    'ʁ': d({
        voiceAmplitude: 0.8, fricationAmplitude: 0.3, baseDuration: 70,
        cf1: 400, cf2: 1100, cf3: 2200,
        cb1: 100, cb2: 120, cb3: 200,
        pf1: 400, pf2: 1100, pf3: 2200,
        pb1: 100, pb2: 120, pb3: 200,
    }),
    'f': d({
        fricationAmplitude: 0.3, parallelBypass: 0.1, baseDuration: 80,
        cf1: 340, cf2: 1100, cf3: 2080,
        cb1: 220, cb2: 90, cb3: 112.5,
        pf1: 340, pf2: 1100, pf3: 2080,
        pb1: 200, pb2: 120, pb3: 150,
    }),
    'h': d({
        aspirationAmplitude: 1.0, copyAdjacent: true, baseDuration: 80,
    }),
    's': d({
        fricationAmplitude: 0.3, baseDuration: 80,
        cf1: 320, cf2: 1390, cf3: 2530,
        cb1: 220, cb2: 60, cb3: 150,
        pf1: 320, pf2: 1390, pf3: 2530, pf6: 5250,
        pb1: 200, pb2: 80, pb3: 200,
        pa6: 0.2,
    }),
    'ʃ': d({
        fricationAmplitude: 0.25, baseDuration: 80,
        cf1: 300, cf2: 1840, cf3: 2750,
        cb1: 220, cb2: 75, cb3: 225,
        pf1: 300, pf2: 1840, pf3: 2750,
        pb1: 200, pb2: 100, pb3: 300,
        pa3: 0.15, pa4: 0.1, pa5: 0.1, pa6: 0.1,
    }),
    'θ': d({
        fricationAmplitude: 0.15, parallelBypass: 0.1, baseDuration: 80,
        cf1: 320, cf2: 1290, cf3: 2540,
        cb1: 220, cb2: 67.5, cb3: 150,
        pf1: 320, pf2: 1290, pf3: 2540,
        pb1: 200, pb2: 90, pb3: 200,
        pa6: 0.05,
    }),
    'v': d({
        voiceAmplitude: 1.0, fricationAmplitude: 0.1, parallelBypass: 0.05, baseDuration: 60,
        cf1: 220, cf2: 1100, cf3: 2080,
        cb1: 66, cb2: 67.5, cb3: 90,
        pf1: 220, pf2: 1100, pf3: 2080,
        pb1: 60, pb2: 90, pb3: 120,
    }),
    'z': d({
        voiceAmplitude: 1.0, fricationAmplitude: 0.3, baseDuration: 60,
        cf1: 240, cf2: 1390, cf3: 2530,
        cb1: 77, cb2: 45, cb3: 135,
        pf1: 240, pf2: 1390, pf3: 2530,
        pb1: 70, pb2: 60, pb3: 180,
        pa6: 0.2,
    }),
    'ð': d({
        voiceAmplitude: 1.0, fricationAmplitude: 1.0, parallelBypass: 0.63, baseDuration: 60,
        cf1: 270, cf2: 1290, cf3: 2540,
        cb1: 66, cb2: 60, cb3: 127.5,
        pf1: 270, pf2: 1290, pf3: 2540,
        pb1: 60, pb2: 80, pb3: 170,
        pa6: 0.46,
    }),
    'ʒ': d({
        voiceAmplitude: 0.3, fricationAmplitude: 0.05,
        cf1: 300, cf2: 1840, cf3: 2750, cf4: 3300, cf5: 3750, cf6: 4900,
        cb1: 77, cb2: 45, cb3: 210, cb4: 250, cb5: 200, cb6: 1000,
        cfNP: 200, cbNP: 100, cfN0: 250, cbN0: 100,
        pf1: 300, pf2: 1840, pf3: 2750, pf4: 3300, pf5: 3750, pf6: 4900,
        pb1: 70, pb2: 60, pb3: 280, pb4: 250, pb5: 200, pb6: 1000,
        pa3: 0.46, pa4: 0.4, pa5: 0.4, pa6: 0.38,
        baseDuration: 60
    }),
    'ʔ': d({ _silence: true, baseDuration: 60 }),
    ' ': d({ _silence: true, baseDuration: 150 }),
    '.': d({ _silence: true, baseDuration: 150 }),
    ',': d({ _silence: true, baseDuration: 150 }),
};
