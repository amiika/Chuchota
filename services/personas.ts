
import { VoiceConfig } from '../types';

export const PERSONAS: Record<string, VoiceConfig> = {
    "Default": {
        pitch: 65, speed: 1.2, declination: 0.15, throat: 0.8, mouth: 0.6, tongue: 1.0,
        breathiness: 0.5, flutter: 0.0, vibratoDepth: 0, vibratoSpeed: 6.0, tilt: 50, robotic: 0.0,
        phonemeOverrides: {}
        },
    "Clear": {
        pitch: 220, speed: 1.0, declination: 0.1, throat: 1.3, mouth: 0.8, tongue: 1.2,
        breathiness: 0.5, flutter: 0.05, vibratoDepth: 0.1, vibratoSpeed: 5.5, tilt: 35, robotic: 0,
        phonemeOverrides: {}
    },
    "Child": {
        pitch: 280, speed: 1.1, declination: 0.05, throat: 1.4, mouth: 0.75, tongue: 1.2,
        breathiness: 0.4, flutter: 0.1, vibratoDepth: 0.0, vibratoSpeed: 6.0, tilt: 50, robotic: 0,
        phonemeOverrides: {}
    },
    "Creaky": {
        pitch: 85, speed: 0.9, declination: 0.3, throat: 0.95, mouth: 0.4, tongue: 0.9,
        breathiness: 0.0, flutter: 0.4, vibratoDepth: 0.2, vibratoSpeed: 3.0, tilt: 0, robotic: 0,
        phonemeOverrides: {
            's': { baseDuration: 180, fricationAmplitude: 0.2 },
            'f': { baseDuration: 150 }
        }
    },
    "Robot": {
        pitch: 120, speed: 1.0, declination: 0.0, throat: 1.0, mouth: 0.5, tongue: 1.0,
        breathiness: 0.0, flutter: 0.0, vibratoDepth: 0.15, vibratoSpeed: 30.0, tilt: 0, robotic: 1.0,
        phonemeOverrides: {
            'a': { baseDuration: 80 },
            'e': { baseDuration: 80 },
            'i': { baseDuration: 80 },
            'o': { baseDuration: 80 },
            'u': { baseDuration: 80 }
        }
    },
    "Slither": {
        pitch: 70, speed: 1.0, declination: 0.4, throat: 1.8, mouth: 0.7, tongue: 0.9,
        breathiness: 0.8, flutter: 0.1, vibratoDepth: 0, vibratoSpeed: 6.0, tilt: 0, robotic: 0.0,
        phonemeOverrides: {
        's': { baseDuration: 350 }
        }
      }
};
