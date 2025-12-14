'use client';

import { ReactNode, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { useMessaging, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export function FirebaseMessagingProvider({ children }: { children: ReactNode }) {
  const messaging = useMessaging();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const requestPermissionAndToken = async () => {
      if (!messaging || !user || user.isAnonymous) {
        return;
      }
      
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          // VAPID key is a security measure for web push, generated in Firebase console
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.error('Missing VAPID key. Cannot get FCM token.');
            return;
          }

          const token = await getToken(messaging, { vapidKey });
          
          if (token) {
            console.log('FCM Token:', token);
            // Save the token to Firestore for this user
            const tokenRef = doc(firestore, 'users', user.uid, 'fcmTokens', token);
            await setDocumentNonBlocking(tokenRef, {
              token: token,
              createdAt: new Date(),
              ua: navigator.userAgent
            }, {});
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        // Inform user about the issue if needed.
        toast({
          variant: 'destructive',
          title: 'Notification Error',
          description: 'Could not set up notifications. Please try again later.'
        });
      }
    };

    requestPermissionAndToken();
  }, [messaging, user, firestore, toast]);

  return <>{children}</>;
}
