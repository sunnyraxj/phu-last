
import * as admin from 'firebase-admin';

function getServiceAccount() {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error(
      'Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set.'
    );
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}


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
    const serviceAccount = getServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`
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
