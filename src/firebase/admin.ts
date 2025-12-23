import * as admin from 'firebase-admin';
import serviceAccount from '@/serviceAccount.json';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage(),
    };
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
  } catch(e) {
    console.error('firebase-admin initialization error', e);
  }

  return {
    firestore: admin.firestore(),
    auth: admin.auth(),
    storage: admin.storage(),
  };
}
