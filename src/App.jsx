import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { onAuthChange } from './services/authService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import PhotoLogger from './components/PhotoLogger';
import VoiceLogger from './components/VoiceLogger';
import AdaptiveCoach from './components/AdaptiveCoach';
import FastingTimer from './components/FastingTimer';
import ProgressCharts from './components/ProgressCharts';
import BodyMeasurements from './components/BodyMeasurements';
import RecipeManager from './components/RecipeManager';
import MealPlanner from './components/MealPlanner';
import GroceryList from './components/GroceryList';
import SocialFeed from './components/SocialFeed';
import SpiritTracker from './components/SpiritTracker';
import PastorDashboard from './components/PastorDashboard';
import Settings from './components/Settings';
import Login from './components/Login';
import SignUp from './components/SignUp';
import PremiumGate from './components/PremiumGate';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import MedicalDisclaimerModal from './components/MedicalDisclaimerModal';
import OnboardingFlow from './components/OnboardingFlow';
import FoundersClubUpsell from './components/FoundersClubUpsell';
import UserManual from './components/UserManual';
import './index.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [authUser, setAuthUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [skipAuth, setSkipAuth] = useState(() => {
    return localStorage.getItem('fuelflow_skipAuth') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(true);
  const { isPremium, isTrialExpired, isFeaturePremium } = useSubscription();

  const [hasOnboarded, setHasOnboarded] = useState(() => {
    return localStorage.getItem('fuelflow_onboarded') === 'true';
  });

  const handleCompleteOnboarding = () => {
    localStorage.setItem('fuelflow_onboarded', 'true');
    setHasOnboarded(true);
    // 30-Day Free Trial: Allow them into the dashboard directly unless 30 days have expired
    const isAppleReviewAccount = localStorage.getItem('fuelflow_demo_account') === 'true';
    if (!isPremium && isTrialExpired && !isAppleReviewAccount) {
      setCurrentView('premiumGate:dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  // Check for subscription success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      setCurrentView('subscriptionSuccess');
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    console.log('[App Init] 1/3 - Starting Firebase Auth listener');
    
    // 10-second fallback timeout to prevent hanging on "Preparing your sanctuary"
    const timeoutId = setTimeout(() => {
      console.warn('[App Init] WARNING - Auth listener timed out after 10s! Forcing app to unlock bypass.');
      setAuthLoading(false);
    }, 10000);

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthChange((user) => {
        console.log('[App Init] 2/3 - Auth check resolved. User ID:', user ? user.uid : 'null');
        setAuthUser(user);
        setAuthLoading(false);
        clearTimeout(timeoutId);
      });
    } catch (err) {
      console.error('[App Init] FATAL ERROR during Firebase auth load:', err);
      setAuthLoading(false);
      clearTimeout(timeoutId);
    }
    
    return () => {
      console.log('[App Init] 3/3 - Cleaning up auth listener bindings');
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSkipAuth = () => {
    setSkipAuth(true);
    localStorage.setItem('fuelflow_skipAuth', 'true');
  };

  // Navigate to a view - check premium status
  const navigateToView = (view) => {
    // APPLE REVIEW BYPASS - Ensure they never hit a paywall while reviewing
    const isAppleReviewAccount = localStorage.getItem('fuelflow_demo_account') === 'true';
    
    if (isFeaturePremium(view) && !isPremium && isTrialExpired && !isAppleReviewAccount) {
      // Show premium gate for this feature only if the 30-day Free Trial is mathematically over
      setCurrentView('premiumGate:' + view);
    } else {
      setCurrentView(view);
    }
  };

  // Show auth screen if not logged in and not skipped
  if (authLoading) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '4rem' }}>🕊️</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Preparing your Sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!authUser && !skipAuth) {
    if (authView === 'signup') {
      return <SignUp onSwitch={() => setAuthView('login')} onSkip={handleSkipAuth} />;
    }
    return <Login onSwitch={() => setAuthView('signup')} onSkip={handleSkipAuth} />;
  }

  // Inject the Sunk-Cost Onboarding Funnel completely blocking the main app architecture
  if (!hasOnboarded) {
    return (
      <div className="app">
        <MedicalDisclaimerModal />
        <main className="main-content" style={{ padding: 0 }}>
          <OnboardingFlow onComplete={handleCompleteOnboarding} />
        </main>
      </div>
    );
  }

  const renderView = () => {
    // Handle subscription success page
    if (currentView === 'subscriptionSuccess') {
      return (
        <SubscriptionSuccess
          onContinue={() => {
            window.history.replaceState({}, '', window.location.pathname);
            setCurrentView('dashboard');
          }}
        />
      );
    }

    // Handle premium gate
    if (currentView.startsWith('premiumGate:')) {
      const feature = currentView.split(':')[1];
      return (
        <PremiumGate
          feature={feature}
          onBack={() => setCurrentView('dashboard')}
          onFoundersClick={() => setCurrentView('foundersClub')}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={navigateToView} />;
      case 'logger':
        return <FoodLogger />;
      case 'photoLogger':
        return <PhotoLogger />;
      case 'voiceLogger':
        return <VoiceLogger />;
      case 'measurements':
        return <BodyMeasurements />;
      case 'progress':
        return <ProgressCharts />;
      case 'fasting':
        return <FastingTimer />;
      case 'coach':
        return <AdaptiveCoach />;
      case 'mealPlan':
        return <MealPlanner />;
      case 'groceryList':
        return <GroceryList />;
      case 'social':
        return <SocialFeed />;
      case 'spirit':
        return <SpiritTracker />;
      case 'admin':
        return <PastorDashboard />;
      case 'recipes':
        return <RecipeManager />;
      case 'foundersClub':
        return <FoundersClubUpsell onDecline={() => setCurrentView('dashboard')} />;
      case 'settings':
        return <Settings setCurrentView={navigateToView} />;
      case 'manual':
        return <UserManual />;
      default:
        return <Dashboard setCurrentView={navigateToView} />;
    }
  };

  return (
    <div className="app">
      <MedicalDisclaimerModal />
      <Header
        currentView={currentView}
        setCurrentView={navigateToView}
        authUser={authUser}
      />
      <main className="main-content">
        {renderView()}
      </main>
      <footer className="footer">
        <p>© 2026 Whittle Vitalio - Fueling the Temple, Flowing in the Spirit ✨</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </AppProvider>
  );
}

export default App;
