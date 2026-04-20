import { useSubscription } from '../context/SubscriptionContext';
import { Capacitor } from '@capacitor/core';
import './PremiumGate.css';

const PREMIUM_FEATURE_INFO = {
    photoLogger: {
        icon: '📸',
        name: 'AI Photo Scanner',
        description: 'Snap a photo of your meal and let AI identify every ingredient and nutrient automatically.'
    },
    voiceLogger: {
        icon: '🎤',
        name: 'Voice Logger',
        description: 'Just say what you ate and we\'ll log it for you — hands-free food tracking.'
    },
    recipes: {
        icon: '👨‍🍳',
        name: 'Recipe Manager',
        description: 'Save, organize, and discover healthy recipes with full nutritional breakdowns.'
    },
    mealPlan: {
        icon: '📅',
        name: 'Meal Planner',
        description: 'Plan your weekly meals in advance with smart suggestions based on your goals.'
    },
    groceryList: {
        icon: '🛒',
        name: 'Grocery List',
        description: 'Auto-generate shopping lists from your meal plans — never forget an ingredient.'
    },
    fasting: {
        icon: '⏱️',
        name: 'Fasting Timer',
        description: 'Track intermittent fasting windows with beautiful countdown timers and stats.'
    },
    coach: {
        icon: '🧠',
        name: 'AI Coach',
        description: 'Get personalized nutrition advice and adaptive recommendations powered by AI.'
    },
    progress: {
        icon: '📊',
        name: 'Progress Charts',
        description: 'Visualize your journey with detailed charts for calories, macros, weight trends, and more.'
    },
    social: {
        icon: '👥',
        name: 'Social Feed',
        description: 'Connect with others, share achievements, and stay motivated together.'
    },
    activity: {
        icon: '🏃',
        name: 'Activity Tracker',
        description: 'Log workouts, track steps, and monitor calories burned throughout the day.'
    }
};

export default function PremiumGate({ feature, onBack, onFoundersClick }) {
    const { subscribe, restorePurchases, nativeOfferings } = useSubscription();
    const featureInfo = PREMIUM_FEATURE_INFO[feature] || {
        icon: '⭐',
        name: 'Premium Feature',
        description: 'Unlock this feature with Whittle Vitalio Premium.'
    };

    return (
        <div className="premium-gate">
            <div className="premium-gate-card">
                <div className="premium-gate-icon-row">
                    <span className="premium-gate-lock">🔒</span>
                    <span className="premium-gate-feature-icon">{featureInfo.icon}</span>
                </div>

                <h2 className="premium-gate-title">Unlock {featureInfo.name}</h2>
                <p className="premium-gate-description">{featureInfo.description}</p>

                <div className="premium-gate-divider" />

                <div className="premium-gate-pricing">
                    <span className="premium-gate-price">Free Trial Available</span>
                    {!Capacitor.isNativePlatform() && <span className="premium-gate-period">, then $19.99/month</span>}
                </div>
                <p className="premium-gate-subtitle">Whittle Vitalio Premium Membership</p>

                <ul className="premium-gate-features">
                    <li>📸 AI Food Photo Scanner</li>
                    <li>🎤 Voice Food Logging</li>
                    <li>📊 Advanced Progress Charts</li>
                    <li>📅 Smart Meal Planner</li>
                    <li>🛒 Auto Grocery Lists</li>
                    <li>🧠 AI Nutrition Coach</li>
                    <li>🏃 Activity Tracker</li>
                    <li>👥 Social Community</li>
                </ul>

                {Capacitor.isNativePlatform() && nativeOfferings && nativeOfferings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '16px' }}>
                        {nativeOfferings.map((pkg) => (
                            <button 
                                key={pkg.identifier} 
                                className="premium-gate-subscribe-btn" 
                                onClick={() => subscribe(pkg)}
                                style={{
                                    background: pkg.packageType === 'ANNUAL' ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : '#1e293b',
                                    color: pkg.packageType === 'ANNUAL' ? '#0f1b3d' : '#fff',
                                    border: pkg.packageType === 'ANNUAL' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {pkg.packageType === 'ANNUAL' ? '👑' : '✨'} {pkg.product.title} - {pkg.product.priceString}
                            </button>
                        ))}
                    </div>
                ) : (
                    <button className="premium-gate-subscribe-btn" onClick={() => subscribe()} style={{ marginTop: '16px' }}>
                        ✨ Start Fast Tracking Your Goals
                    </button>
                )}

                {!Capacitor.isNativePlatform() && onFoundersClick && (
                    <button className="premium-gate-founders-btn" onClick={onFoundersClick} style={{ 
                        background: 'transparent',
                        border: '2px solid #eab308',
                        color: '#eab308',
                        padding: '16px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        width: '100%',
                        cursor: 'pointer',
                        marginTop: '12px',
                        fontSize: '1.05rem',
                        transition: 'all 0.2s'
                    }}>
                        👑 Or Join the Founders Club (Save 60%)
                    </button>
                )}

                <button className="premium-gate-back-btn" onClick={onBack} style={{ marginTop: '16px' }}>
                    ← Back to Dashboard
                </button>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                    <button className="premium-gate-back-btn" onClick={restorePurchases} style={{ padding: 0, marginTop: '8px', textDecoration: 'underline', color: '#9ca3af', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        Restore Purchases
                    </button>
                    <div style={{ marginTop: '8px' }}>
                        <a href="https://fuelflow-landing-7a13c.web.app/terms.html" target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Use</a>
                        {' | '}
                        <a href="https://fuelflow-landing-7a13c.web.app/privacy.html" target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
