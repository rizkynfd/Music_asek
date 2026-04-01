import React from 'react';

/**
 * ErrorBoundary — Catches JavaScript errors in child component trees.
 * Prevents the entire app from crashing when one component fails.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        this.setState({ info });
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, info: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '300px',
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-secondary, #aaa)',
                    gap: '16px'
                }}>
                    <div style={{ fontSize: '48px' }}>⚡</div>
                    <h2 style={{ color: 'var(--text-primary, #fff)', fontSize: '22px', margin: 0 }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>
                        An unexpected error occurred in this section. You can try refreshing or continue using other parts of the app.
                    </p>
                    {this.state.error && (
                        <code style={{
                            display: 'block',
                            background: 'rgba(255,0,0,0.08)',
                            border: '1px solid rgba(255,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '12px',
                            color: '#ff6b6b',
                            maxWidth: '500px',
                            wordBreak: 'break-word'
                        }}>
                            {this.state.error.toString()}
                        </code>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '24px',
                                background: 'var(--accent-color, #00f0ff)',
                                color: '#000',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '14px'
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '24px',
                                background: 'transparent',
                                color: 'var(--text-primary, #fff)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
