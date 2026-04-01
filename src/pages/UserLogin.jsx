import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { EnvelopeSimple, Lock, MusicNote, WarningCircle, X } from 'phosphor-react';
import { useAuthStore } from '../store/useAuthStore';

export default function UserLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorPopup, setErrorPopup] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const showError = (msg) => {
        setErrorPopup(msg);
        setTimeout(() => setErrorPopup(''), 4000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorPopup('');
        setIsLoading(true);

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            if (result.isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } else {
            showError(result.error || 'Akun tidak ditemukan. Periksa email dan password kamu.');
        }
    };

    return (
        <div className="auth-page">
            {/* Error Popup Toast */}
            {errorPopup && (
                <div className="auth-toast auth-toast-error">
                    <WarningCircle size={20} weight="fill" />
                    <span>{errorPopup}</span>
                    <button className="auth-toast-close" onClick={() => setErrorPopup('')}>
                        <X size={16} weight="bold" />
                    </button>
                </div>
            )}

            <div className="auth-card glass-panel">
                {/* Logo */}
                <div className="auth-logo">
                    <MusicNote size={32} weight="fill" color="var(--accent-color)" />
                    <span className="auth-logo-text">SpotiClone</span>
                </div>

                <h1 className="auth-title">Log in to SpotiClone</h1>
                <p className="auth-subtitle">Millions of songs. Free to explore.</p>

                <form onSubmit={handleLogin} className="auth-form">
                    {/* Email Field */}
                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <div className="auth-input-wrapper">
                            <EnvelopeSimple size={18} className="auth-input-icon" />
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                        {isLoading ? <span className="auth-spinner" /> : 'Log In'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                {/* Footer Links */}
                <p className="auth-footer-text">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-link">Sign Up</Link>
                </p>
                <button className="auth-btn-ghost" onClick={() => navigate('/')}>
                    Continue without login
                </button>
            </div>
        </div>
    );
}
