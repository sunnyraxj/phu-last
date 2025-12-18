
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { addDocumentNonBlocking } from './non-blocking-updates';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Merges the cart from an anonymous user to a permanent user.
 * @param firestore - The Firestore instance.
 * @param anonymousUid - The UID of the anonymous user.
 * @param permanentUid - The UID of the permanent user.
 */
const mergeCarts = async (firestore: Firestore, anonymousUid: string, permanentUid: string) => {
    const anonCartRef = collection(firestore, 'users', anonymousUid, 'cart');
    const permanentCartRef = collection(firestore, 'users', permanentUid, 'cart');

    const anonCartSnapshot = await getDocs(anonCartRef);
    const permanentCartSnapshot = await getDocs(permanentCartRef);

    const permanentCartItems = new Map(permanentCartSnapshot.docs.map(doc => [doc.data().productId, doc]));

    const batch = writeBatch(firestore);

    anonCartSnapshot.docs.forEach(anonDoc => {
        const anonItem = anonDoc.data();
        const existingPermanentItemDoc = permanentCartItems.get(anonItem.productId);

        if (existingPermanentItemDoc) {
            // Item exists, update quantity
            const newQuantity = existingPermanentItemDoc.data().quantity + anonItem.quantity;
            batch.update(existingPermanentItemDoc.ref, { quantity: newQuantity });
        } else {
            // Item does not exist, add it to the permanent cart
            const newPermanentItemRef = doc(permanentCartRef);
            batch.set(newPermanentItemRef, anonItem);
        }
        // Delete the item from the anonymous cart
        batch.delete(anonDoc.ref);
    });

    await batch.commit();
};


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: auth.currentUser, // Initialize with current user if available
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => { // Auth state determined
        if (!firebaseUser) {
           try {
              // If no user, sign in anonymously
              const anonUserCredential = await signInAnonymously(auth);
              setUserAuthState({ user: anonUserCredential.user, isUserLoading: false, userError: null });
            } catch (error) {
              console.error("Anonymous sign-in failed:", error);
              setUserAuthState({ user: null, isUserLoading: false, userError: error as Error });
            }
        } else {
            setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
        }
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser & { addDocumentNonBlocking: typeof addDocumentNonBlocking, mergeCarts: (anonymousUid: string, permanentUid: string) => Promise<void> } => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  
  const memoizedAddDoc = useMemo(() => addDocumentNonBlocking, []);
  
  const memoizedMergeCarts = useMemo(() => {
    return (anonymousUid: string, permanentUid: string) => mergeCarts(context.firestore!, anonymousUid, permanentUid);
  }, [context.firestore]);

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    addDocumentNonBlocking: memoizedAddDoc,
    mergeCarts: memoizedMergeCarts,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};


/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
