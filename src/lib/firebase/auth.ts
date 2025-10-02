
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "./index";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, getDocs, limit, updateDoc } from "firebase/firestore";
import type { UserProfile } from '@/types';

export const signUpWithEmailPassword = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Update the Firebase Auth user's profile first
  await updateProfile(userCredential.user, { displayName });
  // Then create our own user document in Firestore
  await createUserProfileDocument(userCredential.user);
  return userCredential;
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    if (userCredential.user) {
      // Ensure a user profile document is created or exists
      await createUserProfileDocument(userCredential.user);
    }
    return userCredential;
  } catch (error) {
    // Handle common errors like popup closed by user, network error, etc.
    console.error("Error during Google sign-in:", error);
    throw error; // Re-throw to be caught by the calling component
  }
};

export const signOutUser = async (): Promise<void> => {
  return signOut(auth);
};

export const createUserProfileDocument = async (user: FirebaseUser) => {
  if (!user) return;

  const userRef = doc(db, `users/${user.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, uid, photoURL } = user;
    const createdAt = new Date().toISOString();
    
    // Check if this is the first user to make them an admin
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, limit(1));
    const existingUsersSnapshot = await getDocs(q);
    const isFirstUser = existingUsersSnapshot.empty;
    const role = isFirstUser ? 'admin' : 'farmer';

    try {
      await setDoc(userRef, {
        uid,
        email,
        displayName: displayName || email?.split('@')[0] || 'User',
        photoURL: photoURL || null,
        createdAt,
        role, // Use the determined role
        status: 'active',
      });
    } catch (error) {
      console.error("Error creating user document", error);
      throw error;
    }
  } else {
    // If user exists, update their photoURL and displayName if it's different (e.g. from Google)
    const existingData = snapshot.data() as UserProfile;
    const updates: Partial<UserProfile> = {};
    if (user.photoURL && existingData.photoURL !== user.photoURL) {
      updates.photoURL = user.photoURL;
    }
    if (user.displayName && existingData.displayName !== user.displayName) {
        updates.displayName = user.displayName;
    }
    if (Object.keys(updates).length > 0) {
        try {
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error("Error updating user profile on sign-in", error);
        }
    }
  }
  return userRef;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, `users/${uid}`);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    // Convert Firestore Timestamp to ISO string for client-side compatibility
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    return { ...data, uid, createdAt } as UserProfile;
  }
  return null;
};
