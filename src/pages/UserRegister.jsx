import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { EnvelopeSimple, Lock, User, MusicNote } from 'phosphor-react';
import { useAuthStore } from '../store/useAuthStore';

export default function UserRegister() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Password tidak cocok.');
            return;
        }

        setIsLoading(true);
        
        try {
            const result = await register(username, email, password);
            setIsLoading(false);

            if (result.success) {
                if (result.needsConfirmation) {
                    alert(result.error || 'Cek email kamu untuk konfirmasi akun.');
                    navigate('/login');
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                setError(result.error || 'Gagal mendaftar. Silakan coba lagi.');
            }
        } catch (err) {
            setIsLoading(false);
            setError('Terjadi kesalahan jaringan.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass-panel">
                {/* Logo */}
                <div className="auth-logo">
                    <MusicNote size={32} weight="fill" color="var(--accent-color)" />
                    <span className="auth-logo-text">Musik Asek</span>
                </div>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join millions of music lovers.</p>

                <form onSubmit={handleRegister} className="auth-form">
                    {/* Username */}
                    <div className="auth-field">
                        <label className="auth-label">Username</label>
                        <div className="auth-input-wrapper">
                            <User size={18} className="auth-input-icon" />
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
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

                    {/* Password */}
                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-field">
                        <label className="auth-label">Confirm Password</label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && <p className="auth-error">{error}</p>}

                    {/* Submit */}
                    <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                        {isLoading ? <span className="auth-spinner" /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Log In</Link>
                </p>
                <button className="auth-btn-ghost" onClick={() => navigate('/')}>
                    Continue without login
                </button>
            </div>
        </div>
    );
}
