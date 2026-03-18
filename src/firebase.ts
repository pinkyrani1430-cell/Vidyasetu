import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'TODO_KEYHERE';

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock-key",
  authDomain: "mock-auth",
  projectId: "mock-project",
  storageBucket: "mock-storage",
  messagingSenderId: "mock-sender",
  appId: "mock-app"
});

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig?.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);
