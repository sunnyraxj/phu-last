
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { addDocumentNonBlocking } from './non-blocking-updates';
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User; // User will never be null after initial loading
  isUserLoading: boolean; // Tracks the initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser()
export interface UserHookResult {
  user: User | null; // Can be null during initial load
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Merges the cart from an anonymous user to a permanent user.
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
            const newQuantity = existingPermanentItemDoc.data().quantity + anonItem.quantity;
            batch.update(existingPermanentItemDoc.ref, { quantity: newQuantity });
        } else {
            const newPermanentItemRef = doc(permanentCartRef);
            batch.set(newPermanentItemRef, anonItem);
        }
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsLoading(false);
        } else {
          // If no user, sign in anonymously to ensure services are always available
          try {
            const { user: anonUser } = await signInAnonymously(auth);
            setUser(anonUser);
          } catch (e) {
            console.error("FirebaseProvider: Anonymous sign-in failed.", e);
            setError(e as Error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      (e) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", e);
        setError(e);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => {
    if (isLoading || !user) {
      return undefined; // Services are not ready
    }
    return {
      firebaseApp,
      firestore,
      auth,
      storage,
      user,
      isUserLoading: isLoading,
      userError: error,
    };
  }, [firebaseApp, firestore, auth, storage, user, isLoading, error]);

  if (isLoading || !contextValue) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <PottersWheelSpinner />
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if used outside a ready FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextState & { addDocumentNonBlocking: typeof addDocumentNonBlocking, mergeCarts: (anonymousUid: string, permanentUid: string) => Promise<void> } => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider and after initial auth check.');
  }
  
  const memoizedAddDoc = useMemo(() => addDocumentNonBlocking, []);
  
  const memoizedMergeCarts = useMemo(() => {
    return (anonymousUid: string, permanentUid: string) => mergeCarts(context.firestore!, anonymousUid, permanentUid);
  }, [context.firestore]);

  return {
    ...context,
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
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  // This might be called before provider is ready, so handle undefined context gracefully.
  return { 
    user: context?.user ?? null, 
    isUserLoading: !context, 
    userError: context?.userError ?? null 
  };
};
