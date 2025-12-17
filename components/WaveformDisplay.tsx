
import React, { useRef, useEffect } from 'react';

interface WaveformDisplayProps {
    audioUrl: string;
    data: Float32Array | null;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ audioUrl, data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!data || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a'; 
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();

        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            let hasData = false;
            
            for (let j = 0; j < step; j++) {
                const index = i * step + j;
                if (index >= data.length) break;
                
                hasData = true;
                const datum = data[index];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            if (!hasData) {
                ctx.lineTo(i, height/2);
                continue;
            }

            if (max < min) max = min;
            
            // To prevent drawing noise for near-silence
            if (Math.abs(max) < 0.001 && Math.abs(min) < 0.001) {
                ctx.lineTo(i, height/2);
            } else {
                // Draw based on the max amplitude of the chunk to simulate an envelope
                // Using max ensures we see the peaks clearly at this zoom level
                ctx.lineTo(i, (1 - max) * amp + (height/2 - amp)); 
            }
        }
        ctx.stroke();
    }, [data]);

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 animate-fade-in">
            <div className="mb-4 bg-black rounded-lg border border-slate-600 overflow-hidden relative h-32 group">
                <canvas ref={canvasRef} width={600} height={128} className="w-full h-full opacity-80" />
                <div className="absolute top-2 left-2 text-xs text-cyan-700 font-mono">OSCILLOSCOPE</div>
            </div>
            
            <div className="flex items-center gap-4">
            <audio controls src={audioUrl} className="flex-1 w-full h-10 accent-cyan-500" autoPlay />
            <a href={audioUrl} download="speech.wav" className="text-xs text-cyan-400 hover:text-cyan-300 underline">DOWNLOAD .WAV</a>
            </div>
        </div>
    );
};
