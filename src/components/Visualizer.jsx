import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Visualizer({ 
    width = 200, 
    height = 32,
}) {
    const canvasRef = useRef(null);
    const { analyser, isPlaying } = usePlayerStore();
    const animationRef = useRef(null);
    const frameCountRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const BAR_COUNT = 42;
        const BAR_GAP = 2;
        const barWidth = (width - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

        let dataArray;
        if (analyser) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            frameCountRef.current++;

            ctx.clearRect(0, 0, width, height);

            if (analyser && isPlaying && dataArray) {
                // ── Live mode: real frequency data ──
                analyser.getByteFrequencyData(dataArray);

                for (let i = 0; i < BAR_COUNT; i++) {
                    // Sample across lower 65% of freq bins (bass + mid)
                    const dataIndex = Math.floor((i / BAR_COUNT) * (dataArray.length * 0.65));
                    const rawValue = dataArray[dataIndex];

                    // Power curve to boost sensitivity for quieter signals
                    const normalized = Math.pow(rawValue / 255, 0.75);
                    const barH = Math.max(3, normalized * height);

                    const x = i * (barWidth + BAR_GAP);
                    const y = (height - barH) / 2;

                    const gradient = ctx.createLinearGradient(0, height, 0, 0);
                    gradient.addColorStop(0, 'rgba(29, 185, 84, 0.9)');
                    gradient.addColorStop(0.5, 'rgba(30, 215, 96, 1)');
                    gradient.addColorStop(1, 'rgba(96, 239, 255, 0.9)');

                    ctx.shadowBlur = barH > 8 ? 10 : 0;
                    ctx.shadowColor = 'rgba(30, 215, 96, 0.5)';
                    ctx.fillStyle = gradient;

                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, y, barWidth, barH, 2);
                    } else {
                        ctx.rect(x, y, barWidth, barH);
                    }
                    ctx.fill();
                }
            } else {
                // ── Idle mode: gentle sine-wave pulse animation ──
                const t = frameCountRef.current * 0.02;
                ctx.shadowBlur = 0;

                for (let i = 0; i < BAR_COUNT; i++) {
                    const phase = (i / BAR_COUNT) * Math.PI * 2;
                    const sinVal = (Math.sin(t + phase) + 1) / 2; // 0..1
                    const barH = 2 + sinVal * (height * 0.3);

                    const x = i * (barWidth + BAR_GAP);
                    const y = (height - barH) / 2;

                    ctx.fillStyle = `rgba(30, 215, 96, ${0.12 + sinVal * 0.18})`;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, y, barWidth, barH, 1);
                    } else {
                        ctx.rect(x, y, barWidth, barH);
                    }
                    ctx.fill();
                }
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, isPlaying, width, height]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            style={{ display: 'block' }}
        />
    );
}
