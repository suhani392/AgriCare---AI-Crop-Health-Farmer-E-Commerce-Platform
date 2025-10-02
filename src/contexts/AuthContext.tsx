
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/lib/firebase/auth';
import { LeafLoader } from '@/components/ui/leaf-loader';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    console.log("AuthContext: Subscribing to auth state changes.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // This is the initial loading phase, keep it true until profile is fetched
      setLoading(true); 
      setCurrentUser(user);
      if (user) {
        try {
          console.log(`AuthContext: User ${user.uid} authenticated. Fetching profile...`);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          console.log("AuthContext: User profile fetched successfully:", profile);
        } catch (error: any) {
          console.error("AuthContext: Failed to fetch user profile for UID:", user.uid, "Error:", error);
          setUserProfile(null); 
        } finally {
            // Loading is complete only after user and profile are processed
            setLoading(false);
             console.log("AuthContext: Loading finished for authenticated user.");
        }
      } else {
        setUserProfile(null);
        setLoading(false); // Loading is also complete if there's no user
        console.log("AuthContext: No user authenticated or user logged out. Loading finished.");
      }
    });

    return () => {
      console.log("AuthContext: Unsubscribing from auth state changes.");
      unsubscribe();
    }
  }, []);

  const logout = async () => {
    await auth.signOut();
  };
  
  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <LeafLoader size={64} />
        <p className="mt-4 text-lg text-muted-foreground">Initializing Session...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
