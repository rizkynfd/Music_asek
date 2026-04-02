import { useEffect, useState } from 'react';

const colorCache = new Map();

/**
 * Extracts dominant colors from an album cover URL.
 * Uses Canvas API + color quantization — no external library needed.
 * Falls back to defaults silently on any error.
 */
function getImageColors(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 80; // sample at small size for speed
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);

                const data = ctx.getImageData(0, 0, size, size).data;

                let r = 0, g = 0, b = 0, count = 0;
                let darkR = 0, darkG = 0, darkB = 0, darkCount = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const pr = data[i], pg = data[i + 1], pb = data[i + 2];
                    const brightness = (pr + pg + pb) / 3;

                    // Vibrant: medium brightness, not white/black
                    if (brightness > 50 && brightness < 220) {
                        r += pr; g += pg; b += pb; count++;
                    }
                    // Dark: low brightness
                    if (brightness > 10 && brightness < 80) {
                        darkR += pr; darkG += pg; darkB += pb; darkCount++;
                    }
                }

                const ar = count ? Math.round(r / count) : 30;
                const ag = count ? Math.round(g / count) : 215;
                const ab = count ? Math.round(b / count) : 96;

                const dr = darkCount ? Math.round(darkR / darkCount) : 18;
                const dg = darkCount ? Math.round(darkG / darkCount) : 18;
                const db = darkCount ? Math.round(darkB / darkCount) : 18;

                resolve({
                    bg:     `rgb(${Math.round(dr * 0.5)}, ${Math.round(dg * 0.5)}, ${Math.round(db * 0.5)})`,
                    bgDim:  `rgba(${dr}, ${dg}, ${db}, 0.5)`,
                    accent: `rgb(${ar}, ${ag}, ${ab})`,
                    muted:  `rgba(${ar}, ${ag}, ${ab}, 0.12)`,
                });
            } catch {
                resolve(null);
            }
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}

const DEFAULTS = {
    bg:     'rgb(18, 18, 18)',
    bgDim:  'rgba(18, 18, 18, 0.5)',
    accent: '#1DB954',
    muted:  'rgba(255,255,255,0.08)',
};

export function useAlbumColors(imageUrl) {
    const [colors, setColors] = useState(DEFAULTS);

    useEffect(() => {
        if (!imageUrl) { setColors(DEFAULTS); return; }

        if (colorCache.has(imageUrl)) {
            setColors(colorCache.get(imageUrl));
            return;
        }

        let mounted = true;
        getImageColors(imageUrl).then((result) => {
            if (!mounted) return;
            const resolved = result || DEFAULTS;
            colorCache.set(imageUrl, resolved);
            setColors(resolved);
        });

        return () => { mounted = false; };
    }, [imageUrl]);

    return colors;
}
