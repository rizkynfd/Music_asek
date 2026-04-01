import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Visualizer({ 
    width = 200, 
    height = 60, 
    activeColor = 'var(--accent-color)', 
    idleColor = 'rgba(255,255,255,0.1)' 
}) {
    const canvasRef = useRef(null);
    const { analyser, isPlaying } = usePlayerStore();
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let dataArray;

        if (analyser) {
            // Buffer size = half of fftSize
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            ctx.clearRect(0, 0, width, height);

            if (!analyser || (!isPlaying && dataArray && dataArray.every(val => val === 0))) {
                // Draw idle flat line if no analyser or music stopped and bars dropped
                ctx.fillStyle = idleColor;
                ctx.fillRect(0, height / 2 - 1, width, 2);
                return;
            }

            analyser.getByteFrequencyData(dataArray);

            const barCount = dataArray.length / 2;
            const barWidth = (width / barCount) - 2;
            let x = 0;

            for (let i = 0; i < barCount; i++) {
                const barHeight = (dataArray[i] / 255) * height;

                // Create a neon gradient
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, '#1DB954'); // Spotify green
                gradient.addColorStop(0.5, '#1ed760');
                gradient.addColorStop(1, '#60efff'); // Cyan top

                ctx.fillStyle = gradient;
                
                const y = (height - barHeight) / 2;
                
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(30, 215, 96, 0.5)';

                // Draw rounded rectangle
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, barWidth, Math.max(2, barHeight), 2);
                } else {
                    ctx.rect(x, y, barWidth, Math.max(2, barHeight));
                }
                ctx.fill();

                x += barWidth + 2;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, isPlaying, width, height, activeColor, idleColor]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            style={{ display: 'block' }}
        />
    );
}
