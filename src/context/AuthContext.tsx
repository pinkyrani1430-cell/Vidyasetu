import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, isConfigValid } from '../firebase';
import { firestoreService, handleFirestoreError, OperationType } from '../services/firestoreService';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  language: string;
  coins: number;
  level: number;
  xp: number;
  streak: number;
  lastActive: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE: UserProfile = {
  uid: 'guest-user',
  name: 'Guest Student',
  email: 'guest@vidyasetu.app',
  role: 'student',
  language: 'en',
  coins: 500,
  level: 1,
  xp: 0,
  streak: 1,
  lastActive: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user && isConfigValid) {
        // Listen to profile changes
        const profileRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // New user profile initialization
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              role: 'student',
              language: 'en',
              coins: 100,
              level: 1,
              xp: 0,
              streak: 1,
              lastActive: new Date().toISOString(),
            };
            setDoc(profileRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          // Fallback to guest on error if needed, but usually we want to see the error
          setLoading(false);
        });
      } else {
        // No user logged in, use guest profile
        setProfile(GUEST_PROFILE);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user && isConfigValid) {
      await firestoreService.updateDocument('users', user.uid, data);
    } else {
      // Update guest profile locally
      setProfile(prev => prev ? { ...prev, ...data } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
