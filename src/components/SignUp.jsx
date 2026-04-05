import { useState } from 'react';
import { signUpWithEmail, signInWithGoogle } from '../services/authService';
import { Loader, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './Auth.css';

const SignUp = ({ onSwitch, onSkip }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        const { error: authError } = await signUpWithEmail(email, password, name);

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

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card card">
                    <div className="auth-logo">
                        <span className="logo-icon-large">🔥</span>
                        <h1 className="gradient-text">FuelFlow</h1>
                        <p>Create your account and start tracking</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <div className="input-with-icon">
                                <User size={20} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

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
                                    placeholder="Password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
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

                        <div className="form-group">
                            <div className="input-with-icon">
                                <Lock size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
                            {loading ? <Loader size={20} className="animate-spin" /> : 'Create Account'}
                        </button>
                    </form>

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
                        Already have an account?{' '}
                        <button onClick={onSwitch}>Sign In</button>
                    </p>

                    <button className="skip-btn" onClick={onSkip}>
                        Continue without account →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
