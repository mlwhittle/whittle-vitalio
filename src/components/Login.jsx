import { useState } from 'react';
import { signInWithEmail, signInWithGoogle, resetPassword } from '../services/authService';
import { Loader, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './Auth.css';

const Login = ({ onSwitch, onSkip }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        const { error: authError } = await signInWithEmail(email, password);

        if (authError) {
            setError(authError);
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const { error: authError } = await signInWithGoogle();

        if (authError) {
            setError(authError);
        }
        setLoading(false);
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Enter your email first to reset password');
            return;
        }
        setError('');
        const { error: resetError } = await resetPassword(email);
        if (resetError) {
            setError(resetError);
        } else {
            setResetSent(true);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card card">
                    <div className="auth-logo">
                        <span className="logo-icon-large">🔥</span>
                        <h1 className="gradient-text">FuelFlow</h1>
                        <p>Welcome back! Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <div className="input-with-icon">
                                <Mail size={20} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-with-icon">
                                <Lock size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && <div className="auth-error">{error}</div>}
                        {resetSent && <div className="auth-success">Password reset email sent! Check your inbox.</div>}

                        <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
                            {loading ? <Loader size={20} className="animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <button className="forgot-link" onClick={handlePasswordReset}>
                        Forgot password?
                    </button>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    {!Capacitor.isNativePlatform() && (
                        <button
                            className="btn btn-secondary btn-lg google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            Continue with Google
                        </button>
                    )}

                    <p className="auth-switch">
                        Don't have an account?{' '}
                        <button onClick={onSwitch}>Sign Up</button>
                    </p>

                    <button className="skip-btn" onClick={onSkip}>
                        Continue without account →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
