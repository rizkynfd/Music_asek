import React from 'react';

/**
 * SkeletonLoader — Reusable animated placeholder cards for loading states.
 * 
 * Usage:
 *   <SkeletonLoader type="card" count={6} />
 *   <SkeletonLoader type="row" count={5} />
 *   <SkeletonLoader type="genre" count={8} />
 */

function SkeletonPulse({ style }) {
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '8px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                ...style
            }}
        />
    );
}

function CardSkeleton() {
    return (
        <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <SkeletonPulse style={{ width: '100%', paddingTop: '100%', borderRadius: '8px', marginBottom: '12px' }} />
            <SkeletonPulse style={{ height: '14px', width: '80%', marginBottom: '8px' }} />
            <SkeletonPulse style={{ height: '12px', width: '55%' }} />
        </div>
    );
}

function RowSkeleton() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
            <SkeletonPulse style={{ width: '24px', height: '14px', borderRadius: '4px', flexShrink: 0 }} />
            <SkeletonPulse style={{ width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonPulse style={{ height: '13px', width: '45%' }} />
                <SkeletonPulse style={{ height: '11px', width: '30%' }} />
            </div>
            <SkeletonPulse style={{ width: '40px', height: '12px', borderRadius: '4px' }} />
        </div>
    );
}

function GenreSkeleton() {
    return (
        <SkeletonPulse style={{
            height: '130px',
            borderRadius: '12px',
        }} />
    );
}

export default function SkeletonLoader({ type = 'card', count = 6 }) {
    const map = {
        card: CardSkeleton,
        row: RowSkeleton,
        genre: GenreSkeleton,
    };
    const Component = map[type] || CardSkeleton;

    const containerStyle = type === 'card' || type === 'genre'
        ? {
            display: 'grid',
            gridTemplateColumns: type === 'genre'
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '24px'
        }
        : { display: 'flex', flexDirection: 'column' };

    return (
        <>
            <div style={containerStyle}>
                {Array.from({ length: count }).map((_, i) => (
                    <Component key={i} />
                ))}
            </div>

            <style>{`
                @keyframes skeleton-pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            `}</style>
        </>
    );
}
