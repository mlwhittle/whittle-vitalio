import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSubscription } from '../context/SubscriptionContext';
import { User, Target, Activity as ActivityIcon, Download, Upload, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { deleteUserAccount } from '../services/authService';
import { calculateBMR, calculateTDEE, calculateCalorieGoal, calculateMacros, calculateBMI, getBMICategory } from '../utils/calculations';
import './Settings.css';

const Settings = ({ setCurrentView }) => {
    const { user, setUser } = useApp();
    const { isPremium, subscribe, manageSubscription, subscriptionData, nativeOfferings } = useSubscription();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (isPremium && Capacitor.isNativePlatform()) {
            const goToSub = window.confirm("Apple Subscriptions cannot be canceled automatically. Please tap OK to open App Store Subscriptions and cancel your Whittle Vitalio plan, then return here and tap Delete Account again.");
            if (goToSub) {
                manageSubscription();
                return;
            }
        }

        const confirmDelete = window.confirm("WARNING: Irreversible Action\n\nThis will permanently delete your account, wipe all stored metrics from this device and the Cloud, and instantly cancel web subscriptions. Are you absolutely certain?");
        
        if (confirmDelete) {
            setIsDeleting(true);
            const { error } = await deleteUserAccount();
            if (error) {
                alert(error);
                setIsDeleting(false);
            } else {
                alert("Your account has been successfully deleted.");
                window.location.reload(); 
            }
        }
    };

    const handleUserUpdate = (updates) => {
        const updatedUser = { ...user, ...updates };

        // Recalculate goals if relevant fields changed
        if (updates.weight || updates.height || updates.age || updates.gender || updates.activityLevel || updates.goal) {
            const bmr = calculateBMR(updatedUser.weight, updatedUser.height, updatedUser.age, updatedUser.gender);
            const tdee = calculateTDEE(bmr, updatedUser.activityLevel);
            const dailyCalories = calculateCalorieGoal(tdee, updatedUser.goal);
            const macros = calculateMacros(dailyCalories, updatedUser.goal);

            updatedUser.dailyCalories = dailyCalories;
            updatedUser.macros = macros;
        }

        setUser(updatedUser);
    };

    const handleExportData = () => {
        const data = {
            user,
            foodLogs: JSON.parse(localStorage.getItem('fuelflow_foodLogs') || '[]'),
            waterIntake: JSON.parse(localStorage.getItem('fuelflow_waterIntake') || '0'),
            exerciseLogs: JSON.parse(localStorage.getItem('fuelflow_exerciseLogs') || '[]'),
            recipes: JSON.parse(localStorage.getItem('fuelflow_recipes') || '[]'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fuelflow-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result);
                if (data.user) localStorage.setItem('fuelflow_user', JSON.stringify(data.user));
                if (data.foodLogs) localStorage.setItem('fuelflow_foodLogs', JSON.stringify(data.foodLogs));
                if (data.waterIntake) localStorage.setItem('fuelflow_waterIntake', JSON.stringify(data.waterIntake));
                if (data.exerciseLogs) localStorage.setItem('fuelflow_exerciseLogs', JSON.stringify(data.exerciseLogs));
                if (data.recipes) localStorage.setItem('fuelflow_recipes', JSON.stringify(data.recipes));

                alert('Data imported successfully! Please refresh the page.');
                window.location.reload();
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    const bmi = calculateBMI(user.weight, user.height);
    const bmiCategory = getBMICategory(parseFloat(bmi));

    return (
        <div className="settings animate-fadeIn">
            <div className="settings-header">
                <h1>Settings ⚙️</h1>
                <p>Manage your profile and preferences</p>
            </div>

            {/* Personal Information */}
            <div className="settings-section card">
                <div className="section-header">
                    <User size={24} />
                    <h3>Personal Information</h3>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user.name}
                            onChange={(e) => handleUserUpdate({ name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Age</label>
                        <input
                            type="number"
                            className="form-input"
                            value={user.age}
                            onChange={(e) => handleUserUpdate({ age: parseInt(e.target.value) || 30 })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={user.height}
                            onChange={(e) => handleUserUpdate({ height: parseInt(e.target.value) || 170 })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Weight (kg)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={user.weight}
                            onChange={(e) => handleUserUpdate({ weight: parseFloat(e.target.value) || 70 })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                            className="form-select"
                            value={user.gender}
                            onChange={(e) => handleUserUpdate({ gender: e.target.value })}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Activity Level</label>
                        <select
                            className="form-select"
                            value={user.activityLevel}
                            onChange={(e) => handleUserUpdate({ activityLevel: e.target.value })}
                        >
                            <option value="sedentary">Sedentary (little/no exercise)</option>
                            <option value="light">Light (1-3 days/week)</option>
                            <option value="moderate">Moderate (3-5 days/week)</option>
                            <option value="active">Active (6-7 days/week)</option>
                            <option value="veryActive">Very Active (intense daily)</option>
                        </select>
                    </div>
                </div>

                {/* BMI Display */}
                <div className="bmi-display">
                    <div className="bmi-value">
                        <span className="bmi-number">{bmi}</span>
                        <span className="bmi-label">BMI</span>
                    </div>
                    <div className="bmi-category" style={{ color: bmiCategory.color }}>
                        {bmiCategory.category}
                    </div>
                </div>
            </div>

            {/* Goals */}
            <div className="settings-section card">
                <div className="section-header">
                    <Target size={24} />
                    <h3>Goals</h3>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Goal</label>
                        <select
                            className="form-select"
                            value={user.goal}
                            onChange={(e) => handleUserUpdate({ goal: e.target.value })}
                        >
                            <option value="lose">Lose Weight</option>
                            <option value="maintain">Maintain Weight</option>
                            <option value="gain">Gain Weight</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Weight (kg)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={user.targetWeight}
                            onChange={(e) => handleUserUpdate({ targetWeight: parseFloat(e.target.value) || 70 })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Daily Calorie Goal</label>
                        <input
                            type="number"
                            className="form-input"
                            value={user.dailyCalories}
                            onChange={(e) => handleUserUpdate({ dailyCalories: parseInt(e.target.value) || 2000 })}
                        />
                    </div>
                </div>

                <div className="macros-section">
                    <h4>Macro Goals (grams)</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Protein</label>
                            <input
                                type="number"
                                className="form-input"
                                value={user.macros.protein}
                                onChange={(e) => handleUserUpdate({
                                    macros: { ...user.macros, protein: parseInt(e.target.value) || 150 }
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Carbs</label>
                            <input
                                type="number"
                                className="form-input"
                                value={user.macros.carbs}
                                onChange={(e) => handleUserUpdate({
                                    macros: { ...user.macros, carbs: parseInt(e.target.value) || 200 }
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Fats</label>
                            <input
                                type="number"
                                className="form-input"
                                value={user.macros.fats}
                                onChange={(e) => handleUserUpdate({
                                    macros: { ...user.macros, fats: parseInt(e.target.value) || 65 }
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Management */}
            <div className="settings-section card">
                <div className="section-header">
                    <span style={{ fontSize: '1.5rem' }}>💎</span>
                    <h3>Subscription</h3>
                </div>

                {isPremium ? (
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 230, 118, 0.1))',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            border: '1px solid rgba(0, 200, 83, 0.3)'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <div>
                                <strong style={{ color: '#00c853' }}>Whittle Vitalio Premium — Active</strong>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.25rem 0 0' }}>
                                    $19.99/month • All features unlocked
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}>
                            To manage or cancel your subscription, visit Stripe's customer portal:
                        </p>

                        <button
                            onClick={manageSubscription}
                            className="btn btn-outline"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            ⚙️ Manage / Cancel Subscription
                        </button>

                        <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.75rem', textAlign: 'center' }}>
                            You can cancel anytime. Your access continues until the end of your billing period.
                        </p>
                    </div>
                ) : (
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🆓</span>
                            <div>
                                <strong>Free Plan</strong>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.25rem 0 0' }}>
                                    Dashboard, Food Logger, Settings
                                </p>
                            </div>
                        </div>

                        {Capacitor.isNativePlatform() && nativeOfferings && nativeOfferings.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                {nativeOfferings.map((pkg) => (
                                    <button 
                                        key={pkg.identifier} 
                                        className="btn btn-primary" 
                                        onClick={() => subscribe(pkg)}
                                        style={{
                                            width: '100%',
                                            background: pkg.packageType === 'ANNUAL' ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : '#1e293b',
                                            color: pkg.packageType === 'ANNUAL' ? '#0f1b3d' : '#fff',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            padding: '0.9rem',
                                            border: pkg.packageType === 'ANNUAL' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {pkg.packageType === 'ANNUAL' ? '👑' : '✨'} Upgrade: {pkg.product.title} - {pkg.product.priceString}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => subscribe()}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
                                    color: '#0f1b3d',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    padding: '0.9rem'
                                }}
                            >
                                ✨ Upgrade to Premium — $19.99/month
                            </button>
                        )}
                        
                        <button
                            onClick={() => setCurrentView('foundersClub')}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '2px solid #eab308',
                                color: '#eab308',
                                fontWeight: 800,
                                fontSize: '1rem',
                                padding: '0.9rem',
                                borderRadius: '12px',
                                marginTop: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            👑 Or Join the Founders Club (Save 60%)
                        </button>
                    </div>
                )}
            </div>

            {/* Data Management */}
            <div className="settings-section card">
                <div className="section-header">
                    <ActivityIcon size={24} />
                    <h3>Data Management</h3>
                </div>

                <p className="section-description">
                    Export your data to backup or import previously saved data.
                </p>

                <div className="data-actions">
                    <button className="btn btn-outline" onClick={handleExportData}>
                        <Download size={20} />
                        Export Data
                    </button>

                    <label className="btn btn-outline">
                        <Upload size={20} />
                        Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div className="section-header">
                    <AlertTriangle size={24} color="#ef4444" />
                    <h3 style={{ color: '#ef4444' }}>Danger Zone</h3>
                </div>
                <p className="section-description" style={{ marginBottom: '1rem' }}>
                    Permanently delete your account, settings, active subscriptions, and all logged data. This action cannot be undone.
                </p>
                <button 
                    className="btn btn-outline" 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    style={{ 
                        color: '#ef4444', 
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        width: '100%',
                        justifyContent: 'center'
                    }}
                >
                    {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
