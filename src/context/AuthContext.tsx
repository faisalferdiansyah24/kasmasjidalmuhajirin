import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(userDoc);
        
        const adminEmails = ['faisalferdiansyah69@gmail.com'];
        const intendedRole = adminEmails.includes(authUser.email || '') ? 'admin' : 'viewer';

        if (docSnap.exists()) {
          const currentProfile = docSnap.data() as UserProfile;
          // Force update role if it should be admin but isn't
          if (currentProfile.role !== intendedRole && intendedRole === 'admin') {
            await setDoc(userDoc, { ...currentProfile, role: 'admin' }, { merge: true });
            setProfile({ ...currentProfile, role: 'admin' });
          } else {
            setProfile(currentProfile);
          }
        } else {
          // Create default profile
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
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
