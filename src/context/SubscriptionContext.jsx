import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { collection, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider');
    }
    return context;
};

// RevenueCat Integration Scaffolding (For Apple App Store IAP)
// You will need to install @revenuecat/purchases-capacitor when building the iOS bundle
const RC_PUBLIC_SDK_KEY = 'appl_test_dPuHmIdXTECgbLRlPMIfTtESSME';

// Stripe Firebase Extension Pricing Tiers
export const PRICING_TIERS = {
    monthly: {
        // Note: The user provided Product IDs (prod_...). Typically, Stripe requires Price IDs (price_...)
        // for checkout sessions. If the extension expects the price ID, this may need updating,
        // but for now we map the provided IDs directly.
        id: 'price_1THFrbIunC29aUxhlW1DPwiD',
        price: '$19.99',
        interval: 'month',
        trialDays: 12
    },
    annual: {
        id: 'price_1THDNMIunC29aUxhNOYTbGFg',
        price: '$99.99',
        interval: 'year',
        trialDays: 12,
        savings: 'Save $140 / year (Founders Deal)'
    }
};

// Free features that don't require subscription
const FREE_FEATURES = ['dashboard', 'logger', 'settings', 'recipes', 'fasting'];

// Premium features that require subscription
const PREMIUM_FEATURES = [
    'photoLogger', 'voiceLogger', 'mealPlan',
    'groceryList', 'coach', 'progress',
    'social', 'activity'
];

export const SubscriptionProvider = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [isTrialExpired, setIsTrialExpired] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [nativeOfferings, setNativeOfferings] = useState(null);

    // Watch for subscription changes directly from Stripe via Firebase Extension
    useEffect(() => {
        let unsubscribe = () => { };
        let timeoutId;

        const setupSubscriptionListener = async () => {
            console.log('[Sub Init] 1/4 - Booting real-time subscription bridge (Firebase Stripe)');
            
            // Unconditional 5-second fallback timeout
            timeoutId = setTimeout(() => {
                console.log('[Sub Init] 5s timeout fired');
                console.warn('[Sub Init] WARNING - Subscription check timed out after 5s! Defaulting fallback.');
                setSubscriptionLoading(false);
            }, 5000);

            const user = auth.currentUser;
            if (user) {
                // Mathematically Evaluate 30-Day Cardless Free Trial based on account creation
                if (user.metadata && user.metadata.creationTime) {
                    const creationTime = new Date(user.metadata.creationTime).getTime();
                    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                    setIsTrialExpired((Date.now() - creationTime) > THIRTY_DAYS_MS);
                } else {
                    setIsTrialExpired(true); // Failsafe protect
                }

                const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');

                try {
                    console.log('[Sub Init] 2/4 - Attaching Firestore Snapshot block');
                    unsubscribe = onSnapshot(subscriptionsRef, (snapshot) => {
                        console.log('[Sub Init] 3/4 - Firestore Snapshot triggered');
                        let activeSub = null;

                        snapshot.docs.forEach((doc) => {
                            const subData = doc.data();
                            if (subData.status === 'active' || subData.status === 'trialing') {
                                activeSub = subData;
                            }
                        });

                        if (activeSub || (user && user.email === 'mlwhittle@gmail.com')) {
                            setIsPremium(true);
                            setSubscriptionData(activeSub || { status: 'vip', plan: 'Lifetime Access' });
                            localStorage.setItem('fuelflow_premium', 'true');
                        } else {
                            setIsPremium(false);
                            setSubscriptionData(null);
                            localStorage.setItem('fuelflow_premium', 'false');
                        }
                        
                        console.log('[Sub Init] 4/4 - Snapshot resolved! Removing loaders.');
                        setSubscriptionLoading(false);
                        clearTimeout(timeoutId);
                    }, (error) => {
                        console.error("[Sub Init] Subscription listener error:", error);
                        // Fallback to local storage if listener fails (e.g. permission error during boot)
                        const cached = localStorage.getItem('fuelflow_premium');
                        if (cached === 'true') {
                            setIsPremium(true);
                        }
                        setSubscriptionLoading(false);
                        clearTimeout(timeoutId);
                    });
                } catch (err) {
                    console.error('[Sub Init] FATAL ERROR attaching subscription hook:', err);
                    setSubscriptionLoading(false);
                    clearTimeout(timeoutId);
                }
            } else {
                console.log('[Sub Init] No active Auth profile. Skipping subscription attach.');
                setIsPremium(false);
                setIsTrialExpired(true); // Failsafe
                setSubscriptionData(null);
                setSubscriptionLoading(false);
                clearTimeout(timeoutId);
            }
        };

        const authUnsubscribe = auth.onAuthStateChanged((user) => {
            setupSubscriptionListener();
        });

        return () => {
            authUnsubscribe();
            unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    // Authenticate and fetch offerings from RevenueCat
    const initializeRevenueCat = async () => {
        try {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            if (auth.currentUser) {
                await Purchases.configure({ apiKey: RC_PUBLIC_SDK_KEY, appUserID: auth.currentUser.uid });
            } else {
                await Purchases.configure({ apiKey: RC_PUBLIC_SDK_KEY });
            }
            console.log('RevenueCat initialized for Apple App Store.');
            
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
                setNativeOfferings(offerings.current.availablePackages);
            }
        } catch (e) {
            console.error('RevenueCat config error:', e);
        }
    };

    // Securely trigger Stripe Checkout via Firebase Extension or RevenueCat natively
    const subscribe = async (packageId = PRICING_TIERS.monthly.id) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in or create an account to unlock Premium Features!');
            return;
        }

        try {
            setSubscriptionLoading(true);
            
            // APPLE COMPLIANCE: If running natively on iOS/Android, we MUST use Apple/Google IAP via RevenueCat
            if (Capacitor.isNativePlatform()) {
                console.log('Initiating native App Store purchase via RevenueCat...');
                try {
                    // Expecting packageId to be the actual `PurchasesPackage` object passed from UI
                    if (packageId && packageId.product) {
                        const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageId });
                        if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                            setIsPremium(true);
                            setSubscriptionData({ status: 'active', plan: 'App Store Subscription' });
                        }
                    } else {
                        alert("Invalid package selected. Please try again.");
                    }
                } catch (e) {
                    if (!e.userCancelled) {
                        alert(`App Store Error: ${e.message}`);
                    }
                }
                setSubscriptionLoading(false);
                return;
            }

            // WEB FLOW: Proceed with existing Stripe Checkout
            console.log(`Triggering Stripe Checkout (Web) for product/price: ${packageId}...`);
            const checkoutSessionRef = await addDoc(collection(db, 'customers', user.uid, 'checkout_sessions'), {
                price: packageId,
                success_url: window.location.origin,
                cancel_url: window.location.origin
            });

            onSnapshot(checkoutSessionRef, (snap) => {
                const { error, url } = snap.data() || {};
                
                if (error) {
                    console.error("Stripe Extension Error:", error.message);
                    alert(`Stripe Error: ${error.message}`);
                    setSubscriptionLoading(false);
                }
                
                if (url) {
                    window.location.assign(url);
                }
            });

        } catch (error) {
            console.error('Error starting checkout:', error);
            alert('Could not generate the secure payment page. Please try again soon.');
            setSubscriptionLoading(false);
        }
    };

    // Restore Apple/Google Purchases
    const restorePurchases = async () => {
        try {
            setSubscriptionLoading(true);
            if (Capacitor.isNativePlatform()) {
                const { customerInfo } = await Purchases.restorePurchases();
                if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                    setIsPremium(true);
                    alert('Successfully restored your Premium access!');
                } else {
                    alert('No active subscriptions found for this Apple ID.');
                }
            } else {
                alert('Purchase restoration is only required on the mobile app. Web subscriptions sync automatically.');
            }
        } catch (e) {
            alert(`Restore Error: ${e.message}`);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    // Open standard Apple Subscription Management Settings
    const manageSubscription = async () => {
        try {
            // RevenueCat provides a direct link to the user's Apple ID subscription settings
            const { customerInfo } = await Purchases.getCustomerInfo();
            if (customerInfo && customerInfo.managementURL) {
                window.location.assign(customerInfo.managementURL);
            } else {
                alert('Deep linking to Native iOS Subscription Settings (Simulation in Web)...');
            }
        } catch (error) {
            console.error("Portal error:", error);
        }
    };

    const isFeaturePremium = (featureName) => {
        return PREMIUM_FEATURES.includes(featureName);
    };

    const isFeatureFree = (featureName) => {
        return FREE_FEATURES.includes(featureName);
    };

    const value = {
        isPremium,
        isTrialExpired,
        subscriptionLoading,
        subscriptionData,
        nativeOfferings,
        subscribe,
        restorePurchases,
        manageSubscription,
        isFeaturePremium,
        isFeatureFree,
        PRICING_TIERS
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
