import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 아까 복사한 Firebase 설정 정보 붙여넣기
const firebaseConfig = {
  apiKey: "AIzaSyAfE8IeolvA2IrogQowm6jDdkQmLsXm_1A",
  authDomain: "curvepay-workspace.firebaseapp.com",
  projectId: "curvepay-workspace",
  storageBucket: "curvepay-workspace.firebasestorage.app",
  messagingSenderId: "943867167049",
  appId: "1:943867167049:web:5d661c9b3c95d24ba01a98"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Authentication과 Firestore 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);