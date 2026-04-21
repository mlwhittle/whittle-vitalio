// Firebase Authentication Service
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    OAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { auth, db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, displayName) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        return { user: result.user, error: null };
    } catch (error) {
        console.error('Sign up error:', error.code, error.message);
        return { user: null, error: `[${error.code}]: ${error.message}` };
    }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error) {
        console.error('Sign in error:', error.code, error.message);
        return { user: null, error: `[${error.code}]: ${error.message}` };
    }
};

/**
 * Sign in with Google (popup)
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, error: null };
    } catch (error) {
        console.error('Google sign-in error:', error.code, error.message);
        return { user: null, error: `[${error.code}]: ${error.message}` };
    }
};

/**
 * Sign in with Apple (Native iOS via Capacitor)
 */
export const signInWithAppleNative = async () => {
    try {
        const result = await SignInWithApple.authorize({
            clientId: 'com.mlwhittle.fuelflow',
            scopes: 'email name',
            nonce: 'whittlevitalio123'
        });
        
        if (result.response && result.response.identityToken) {
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: result.response.identityToken,
                rawNonce: 'whittlevitalio123'
            });
            
            const userCredential = await signInWithCredential(auth, credential);
            
            // Store the Apple user identifier in Firestore to survive reinstalls
            if (result.response.user) {
                const userRef = doc(db, 'users', userCredential.user.uid);
                await setDoc(userRef, { appleUserId: result.response.user }, { merge: true });
            }
            
            return { user: userCredential.user, error: null };
        } else {
            throw new Error('Apple Sign-In authorization failed.');
        }
    } catch (error) {
        console.error('Apple sign-in error:', error);
        return { user: null, error: error.message || 'Apple Sign-In cancelled.' };
    }
};

/**
 * Delete User Account & Local Data
 */
export const deleteUserAccount = async () => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is logged in.');

        const uid = user.uid;

        // 1. Delete Firestore records and subcollections
        const subcollections = ['foodLog', 'measurements', 'recipes', 'mealPlans', 'spiritualDiary'];
        const batch = writeBatch(db);

        // Queue deletions for all documents in known subcollections
        for (const subcol of subcollections) {
            const querySnapshot = await getDocs(collection(db, 'users', uid, subcol)).catch(() => ({ forEach: () => {} }));
            querySnapshot.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });
        }

        // Add parent user document to the batch
        const userRef = doc(db, 'users', uid);
        batch.delete(userRef);

        // Add daily metric to the batch
        const todayStr = new Date().toISOString().split('T')[0];
        const userMetricsRef = doc(db, 'userMetrics', `${uid}_${todayStr}`);
        batch.delete(userMetricsRef);

        // Commit the batch deletion
        await batch.commit();

        // 2. Delete Auth Account
        // Note: if Stripe Extension connects, it will observe this Auth trigger.
        await user.delete();

        // 3. Clear Local Storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('fuelflow_') || key.startsWith('whittlevitalio_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        return { error: null };
    } catch (error) {
        console.error('Delete account error:', error);
        
        // Handle "requires-recent-login" safely
        if (error.code === 'auth/requires-recent-login') {
            return { error: 'For security reasons, please log out and log back in before deleting your account.' };
        }
        
        return { error: error.message || 'Failed to delete account. Please try again.' };
    }
};

/**
 * Sign out
 */
export const logOut = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error) {
        return { error: getErrorMessage(error.code) };
    }
};

/**
 * Listen for auth state changes
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Get user-friendly error messages
 */
const getErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Enable it in Firebase Console.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed. Please try again.';
        case 'auth/popup-blocked':
            return 'Popup blocked by browser. Please allow popups for this site.';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized. Check Firebase Console > Authentication > Settings.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        default:
            return `Sign-in error (${errorCode || 'unknown'}). Please try again.`;
    }
};
