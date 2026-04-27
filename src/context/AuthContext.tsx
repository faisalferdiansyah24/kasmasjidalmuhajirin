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

  // Persistence for manual login (session only)
  useEffect(() => {
    const manualUserType = sessionStorage.getItem('manualUser');
    if (manualUserType === 'local') {
      const savedProfile = sessionStorage.getItem('manualProfile');
      const savedUserUid = sessionStorage.getItem('manualUid');
      
      if (savedProfile && savedUserUid) {
        setUser({ uid: savedUserUid } as User);
        setProfile(JSON.parse(savedProfile));
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      // If we have a local manual session, skip Google/Firebase auth sync
      if (sessionStorage.getItem('manualUser') === 'local') {
        setLoading(false);
        return;
      }
      setUser(authUser);
      if (authUser) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(userDoc);
        
        const manualUserHint = sessionStorage.getItem('manualUser');
        const adminEmails = ['faisalferdiansyah69@gmail.com'];
        const isGoogleAdmin = adminEmails.includes(authUser.email || '');
        const isAnonAdmin = authUser.isAnonymous && manualUserHint;
        
        const intendedRole = (isGoogleAdmin || isAnonAdmin) ? 'admin' : 'viewer';

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
            displayName: authUser.displayName || (authUser.isAnonymous ? 'Administrator Masjid' : 'Ikhwan Al-Muhajirin'),
            photoURL: authUser.photoURL || (authUser.isAnonymous ? `https://api.dicebear.com/7.x/avataaars/svg?seed=admin` : ''),
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
        // Sign in anonymously to Firebase so we have a valid auth context for Firestore
        await signInAnonymously(auth);
        sessionStorage.setItem('manualUser', 'true');
        return true;
      } catch (error: any) {
        console.error('Manual login anon error:', error);
        
        // FALLBACK: If API key is invalid, still let them in with a mock session
        // This is a last resort to allow the user to use the dashboard
        if (error.message.includes('api-key-not-valid') || error.message.includes('apiKey')) {
          const manualUid = 'manual-admin-' + Date.now();
          const mockUser = {
            uid: manualUid,
            isAnonymous: true,
            displayName: 'Administrator Masjid (Local Mode)',
            email: 'admin@local'
          } as User;
          
          const mockProfile: UserProfile = {
            uid: mockUser.uid,
            email: mockUser.email!,
            displayName: mockUser.displayName!,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
            role: 'admin'
          };
          
          setUser(mockUser);
          setProfile(mockProfile);
          sessionStorage.setItem('manualUser', 'local');
          sessionStorage.setItem('manualUid', manualUid);
          sessionStorage.setItem('manualProfile', JSON.stringify(mockProfile));
          setLoading(false);
          return true;
        }
        return false;
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
