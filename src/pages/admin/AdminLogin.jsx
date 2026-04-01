import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginAdmin } = usePlayerStore();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginAdmin(password)) {
            navigate('/admin');
        } else {
            setError('Invalid password. Hint: try "admin"');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '350px', textAlign: 'center', borderRadius: '16px' }}>
                <h2 style={{ marginBottom: '8px' }}>Admin Login</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Simulator Credentials Required</p>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--bg-glass-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                    {error && <p style={{ color: '#ff4444', fontSize: '13px', margin: 0 }}>{error}</p>}
                    <button type="submit" style={{
                        background: 'var(--accent-color)',
                        color: '#000',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>
                        Enter Dashboard
                    </button>
                    <button type="button" onClick={() => navigate('/')} style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}>
                        Return to Player
                    </button>
                </form>
            </div>
        </div>
    );
}
