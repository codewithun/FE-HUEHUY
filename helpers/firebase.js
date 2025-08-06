// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDAgc1gO1h8U60Iy3ydxIoqeUboA4mZbkI',
  authDomain: 'huehuy-c43c3.firebaseapp.com',
  projectId: 'huehuy-c43c3',
  storageBucket: 'huehuy-c43c3.appspot.com',
  messagingSenderId: '10845575851',
  appId: '1:10845575851:web:ef1e1e1e2c9deaa44c75ee',
  measurementId: 'G-4DEEX27GPF',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app = initializeApp(firebaseConfig);

export const googleProvider = new GoogleAuthProvider();
// export const facebookProvider = new FacebookAuthProvider();
