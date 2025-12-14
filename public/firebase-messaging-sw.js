// This file must be in the public directory
// It allows the app to receive notifications while in the background

// Scripts for Firebase App and Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCx3OqrF2Rm0QWszTTunb-uTPudKRo4SsY",
  authDomain: "studio-2155773668-701c7.firebaseapp.com",
  projectId: "studio-2155773668-701c7",
  storageBucket: "studio-2155773668-701c7.appspot.com",
  messagingSenderId: "386183913384",
  appId: "1:386183913384:web:ef4a51d261582afe7f879d"
};


// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Optional: a URL to an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
