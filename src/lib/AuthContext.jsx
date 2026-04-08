import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                                   = useState(null);
  const [isAuthenticated, setIsAuthenticated]             = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]                 = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError]                         = useState(null);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured — render app unauthenticated immediately
      setIsLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Load Firestore profile
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const profile = snap.exists() ? snap.data() : {};
          setUser({ id: firebaseUser.uid, email: firebaseUser.email, full_name: firebaseUser.displayName, ...profile });
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (err) {
          console.error('AuthContext: failed to load user profile', err);
          setAuthError({ type: 'error', message: err.message });
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  const logout = async (shouldRedirect = true) => {
    if (auth) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: () => {},   // no-op — Firebase handles this via onAuthStateChanged
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
