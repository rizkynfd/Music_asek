import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Users, UserCircle, EnvelopeSimple, CalendarBlank, Crown } from 'phosphor-react';

export default function AdminUsers() {
    const { registeredUsers, fetchAllUsers } = useAuthStore();

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const formatDate = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Users size={32} weight="fill" style={{ color: 'var(--accent-color)' }} />
                <h1 style={{ margin: 0 }}>User Management</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                All registered users — {registeredUsers.length} account{registeredUsers.length !== 1 ? 's' : ''} found.
            </p>

            {registeredUsers.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '80px', gap: '16px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
                    border: '1px solid var(--bg-glass-border)'
                }}>
                    <UserCircle size={64} weight="thin" style={{ color: 'var(--text-tertiary)' }} />
                    <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>No registered users yet</h3>
                    <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '14px' }}>
                        Users will appear here once they sign up on the platform.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: '1px solid var(--bg-glass-border)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserCircle size={14} /> User
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <EnvelopeSimple size={14} /> Email
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CalendarBlank size={14} /> Joined
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registeredUsers.map((user, idx) => (
                                <tr
                                    key={user.id}
                                    style={{
                                        borderBottom: idx < registeredUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: user.avatarColor || 'var(--accent-purple)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '16px', color: '#fff', flexShrink: 0
                                            }}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{user.username}</p>
                                                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>ID: {user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(user.createdAt)}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 10px', borderRadius: '24px',
                                            background: 'rgba(107, 203, 119, 0.15)',
                                            color: '#6bcb77', fontSize: '12px', fontWeight: 600
                                        }}>
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info note */}
            <div style={{
                marginTop: '16px', padding: '12px 16px',
                background: 'rgba(0,240,255,0.05)', borderRadius: '8px',
                border: '1px solid rgba(0,240,255,0.1)',
                color: 'var(--text-secondary)', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <Crown size={14} style={{ color: 'var(--accent-color)' }} />
                Full user management (ban, role assignment) will be available after backend integration.
            </div>
        </div>
    );
}
