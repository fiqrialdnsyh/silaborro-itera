// 1. Pastikan getFirestore di-import
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 2. Masukkan konfigurasi asli kamu dari dashboard Firebase di sini
const firebaseConfig = {
  apiKey: "AIzaSyCUrJZxOQk5yOH6apqwcRBuEX2V63SdWlA",
  authDomain: "silabor-ro-itera.firebaseapp.com",
  projectId: "silabor-ro-itera",
  storageBucket: "silabor-ro-itera.firebasestorage.app",
  messagingSenderId: "15373714850",
  appId: "1:15373714850:web:18987b98cbddcbe3975efb",
  measurementId: "G-6D0QT5543Y"
};

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// 4. BAGIAN PALING PENTING: Ekspor variabel db agar bisa dibaca file lain
export const db = getFirestore(app);

// 5. Ekspor juga auth dan provider jika kamu ingin menggunakan fitur autentikasi Google
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();