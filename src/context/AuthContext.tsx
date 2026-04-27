import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  manualLogin: (username: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        // Automatically sign in anonymously to allow open management
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error('Auto anonymous sign-in failed:', e);
          setLoading(false);
        }
        return;
      }
      
      setUser(authUser);
      // Fetch or create profile
      const userDoc = doc(db, 'users', authUser.uid);
      const docSnap = await getDoc(userDoc);
      
      // Everyone is an admin now as per "openly manageable" request
      const intendedRole = 'admin';

      if (docSnap.exists()) {
        const currentProfile = docSnap.data() as UserProfile;
        if (currentProfile.role !== intendedRole) {
          await setDoc(userDoc, { ...currentProfile, role: intendedRole }, { merge: true });
          setProfile({ ...currentProfile, role: intendedRole });
        } else {
          setProfile(currentProfile);
        }
      } else {
        const newProfile: UserProfile = {
          uid: authUser.uid,
          email: authUser.email || (authUser.isAnonymous ? 'anonymous@almuhajirin.com' : ''),
          displayName: authUser.displayName || (authUser.isAnonymous ? 'Pengelola Masjid' : 'Ikhwan Al-Muhajirin'),
          photoURL: authUser.photoURL || (authUser.isAnonymous ? `https://api.dicebear.com/7.x/avataaars/svg?seed=admin` : null),
          role: intendedRole
        };
        await setDoc(userDoc, newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const manualLogin = async (username: string, pass: string) => {
    if (username === 'admin' && pass === 'masukaja') {
      try {
        await signInAnonymously(auth);
        sessionStorage.setItem('manualUser', 'true');
        return true;
      } catch (error: any) {
        console.error('Firebase Auth Error:', error);
        throw error;
      }
    }
    return false;
  };

  const logout = async () => {
    sessionStorage.removeItem('manualUser');
    sessionStorage.removeItem('manualUid');
    sessionStorage.removeItem('manualProfile');
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const isAdmin = true; // Openly manageable

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, manualLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
