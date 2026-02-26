import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 這裡會自動從你的 .env.local 抓取變數值
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 正式初始化 Firebase 連線
const app = initializeApp(firebaseConfig);

// 匯出資料庫窗口 db，讓其他頁面可以呼叫雲端資料
export const db = getFirestore(app);