import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HouseLine, MagnifyingGlass } from 'phosphor-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '60vh',
            textAlign: 'center',
            gap: '20px',
            padding: '40px'
        }}>
            {/* Large 404 */}
            <div style={{
                fontSize: '120px',
                fontWeight: 900,
                lineHeight: 1,
                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                userSelect: 'none'
            }}>
                404
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
                Page not found
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.6 }}>
                Looks like this page doesn't exist or was moved. Let's get you back to the music.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '24px',
                        background: 'var(--accent-color)',
                        color: '#000',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px'
                    }}
                >
                    <HouseLine size={18} weight="fill" />
                    Go Home
                </button>
                <button
                    onClick={() => navigate('/search')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '24px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    <MagnifyingGlass size={18} />
                    Browse Music
                </button>
            </div>
        </div>
    );
}
