import { useSubscription } from '../context/SubscriptionContext';
import { Crown, Sparkles, TrendingUp, Shield, Star, CheckCircle2 } from 'lucide-react';
import './FoundersClubUpsell.css';

export default function FoundersClubUpsell({ onDecline }) {
    const { subscribe, restorePurchases, PRICING_TIERS } = useSubscription();

    const handleAccept = () => {
        // Trigger Stripe Checkout for the Annual plan with the passed Price ID
        subscribe(PRICING_TIERS.annual.id);
    };

    return (
        <div className="founders-club animate-fadeIn">
            <div className="fc-background">
                <div className="fc-glow"></div>
            </div>

            <div className="fc-content">
                <div className="fc-header">
                    <div className="fc-badge">
                        <Crown size={16} className="fc-gold" />
                        <span>VIP INVITATION</span>
                    </div>
                    <h1 className="fc-title">
                        Join the <span className="fc-text-gold">Founders Club</span>
                    </h1>
                    <p className="fc-subtitle">
                        Lock in lifetime savings before FuelFlow goes mainstream. Get 12 months of unrestricted premium access for the price of 5.
                    </p>
                </div>

                <div className="fc-pricing-card">
                    <div className="fc-discount-tag">Save 60% Instantly</div>
                    
                    <div className="fc-price-comparison">
                        <div className="fc-price-col">
                            <span className="fc-col-label">Monthly Plan</span>
                            <span className="fc-strike-price">$239.88</span>
                            <span className="fc-col-suffix">/year ($19.99/mo)</span>
                        </div>
                        <div className="fc-price-divider"></div>
                        <div className="fc-price-col fc-highlight">
                            <span className="fc-col-label fc-gold">Founders Deal</span>
                            <span className="fc-main-price">$99.99</span>
                            <span className="fc-col-suffix">/year (Billed Annually)</span>
                        </div>
                    </div>

                    <div className="fc-savings-banner">
                        <Sparkles size={18} />
                        You save $139.89 right now
                    </div>

                    <ul className="fc-benefits">
                        <li>
                            <CheckCircle2 className="fc-gold-icon" size={20} />
                            <span><strong>Full Year of Premium</strong>: AI Coach, Fasting Tracker, Meal Planner, & Custom Macros.</span>
                        </li>
                        <li>
                            <CheckCircle2 className="fc-gold-icon" size={20} />
                            <span><strong>Grandfathered Rate</strong>: Your renewal price will never increase, even when our rates double.</span>
                        </li>
                        <li>
                            <CheckCircle2 className="fc-gold-icon" size={20} />
                            <span><strong>Priority Pastor Mel Support</strong>: Skip the queue for War Room spiritual guidance.</span>
                        </li>
                    </ul>

                    <div className="fc-actions">
                        <button className="fc-btn-primary" onClick={handleAccept}>
                            Claim 60% Off Now
                        </button>
                        <button className="fc-btn-secondary" onClick={onDecline}>
                            No thanks, I'll pay full price ($19.99/mo)
                        </button>
                    </div>
                </div>

                <div className="fc-trust">
                    <div className="fc-trust-item">
                        <Shield size={16} /> Secure Checkout
                    </div>
                    <div className="fc-trust-item">
                        <Star size={16} /> Cancel Anytime
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                    <button onClick={restorePurchases} style={{ background: 'transparent', border: 'none', padding: 0, textDecoration: 'underline', color: '#9ca3af', cursor: 'pointer', marginBottom: '8px' }}>
                        Restore Purchases
                    </button>
                    <div>
                        <a href="https://fuelflow-landing-7a13c.web.app/terms.html" target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Use</a>
                        {' | '}
                        <a href="https://fuelflow-landing-7a13c.web.app/privacy.html" target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
