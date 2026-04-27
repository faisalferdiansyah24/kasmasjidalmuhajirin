import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  // Persistence for manual login (session only)
  useEffect(() => {
    const savedManualUser = sessionStorage.getItem('manualUser');
    if (savedManualUser) {
      const data = JSON.parse(savedManualUser);
      setUser(data.user);
      setProfile(data.profile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      // Only handle Firebase auth changes if we don't have a manual session
      if (!sessionStorage.getItem('manualUser')) {
        setUser(authUser);
        if (authUser) {
          // Fetch or create profile
          const userDoc = doc(db, 'users', authUser.uid);
          const docSnap = await getDoc(userDoc);
          
          const adminEmails = ['faisalferdiansyah69@gmail.com'];
          const intendedRole = adminEmails.includes(authUser.email || '') ? 'admin' : 'viewer';

          if (docSnap.exists()) {
            const currentProfile = docSnap.data() as UserProfile;
            if (currentProfile.role !== intendedRole && intendedRole === 'admin') {
              await setDoc(userDoc, { ...currentProfile, role: 'admin' }, { merge: true });
              setProfile({ ...currentProfile, role: 'admin' });
            } else {
              setProfile(currentProfile);
            }
          } else {
            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || 'Ikhwan Al-Muhajirin',
              photoURL: authUser.photoURL || '',
              role: intendedRole
            };
            await setDoc(userDoc, newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
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
      const mockUser = {
        uid: 'admin-manual',
        email: 'admin@almuhajirin.com',
        displayName: 'Administrator Masjid',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`
      } as User;
      
      const mockProfile: UserProfile = {
        uid: mockUser.uid,
        email: mockUser.email!,
        displayName: mockUser.displayName!,
        photoURL: mockUser.photoURL!,
        role: 'admin'
      };

      setUser(mockUser);
      setProfile(mockProfile);
      sessionStorage.setItem('manualUser', JSON.stringify({ user: mockUser, profile: mockProfile }));
      return true;
    }
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('manualUser');
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

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
