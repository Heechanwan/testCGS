// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 🌟 Используем import.meta.env для доступа к переменным из .env.local
const firebaseConfig = {
    apiKey: "AIzaSyCOvljy59DRG-5DJpF5bpLLd7j8jSgAczU",
    authDomain: "testcgs-e72e0.firebaseapp.com",
    projectId: "testcgs-e72e0",
    storageBucket: "testcgs-e72e0.firebasestorage.app",
    messagingSenderId: "515165536123",
    appId: "1:515165536123:web:178e82521bc10e283d47de"

};

// Инициализация
const app = initializeApp(firebaseConfig);

// Экспорт инициализированного Firestore
export const db = getFirestore(app);