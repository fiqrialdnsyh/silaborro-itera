"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";

// Tambahkan fungsi signOut di sini
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, googleProvider, db } from "../../firebase";

export default function LoginPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("theme") === "dark";
    setIsDark(darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, []);

  // FUNGSI PENGECEKAN ROLE YANG SUDAH DIPERKETAT
  const cekRoleDanArahkan = async (user) => {
    try {
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      // JIKA EMAIL TIDAK ADA DI DATABASE FIREBASE
      if (querySnapshot.empty) {
        // Langsung paksa logout akun Google/Email tersebut dari memori Firebase
        await signOut(auth); 
        
        alert("⛔ Akses Ditolak: Email Anda tidak terdaftar di sistem SILABOR ITERA. Silakan hubungi Admin TIK.");
        
        // Matikan efek loading
        setIsLoading(false);
        setIsGoogleLoading(false);
        return; // Hentikan proses pembacaan kode ke bawah
      }

      // JIKA EMAIL TERDAFTAR DI DATABASE
      const userRole = querySnapshot.docs[0].data().role;
      localStorage.setItem("user_role", userRole);
      
      alert(`Berhasil masuk sebagai ${userRole.toUpperCase()}!`);
      
      if (userRole === "laboran") {
        router.push("/laboran");
      } else {
        router.push("/layanan/peminjaman-ruangan");
      }
    } catch (error) {
      console.error("Error mengecek database:", error);
      alert("Terjadi kesalahan saat memverifikasi data pengguna.");
      setIsLoading(false);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await cekRoleDanArahkan(userCredential.user);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Gagal masuk. Periksa kembali Email dan Kata Sandi Anda.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await cekRoleDanArahkan(userCredential.user);
    } catch (error) {
      console.error("Google Login Error:", error);
      // Jika user menutup pop-up Google sebelum selesai
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Gagal masuk dengan Google. Silakan coba lagi.");
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0f15] transition-colors duration-500 px-6 relative">
      <Link href="/" className="absolute top-6 left-6 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 transition">
        &larr; Kembali
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200/60 dark:border-white/10 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Selamat Datang 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Masuk untuk mengakses portal SILABOR ITERA</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@itera.ac.id" className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kata Sandi</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white" required />
          </div>

          <motion.button type="submit" disabled={isLoading || isGoogleLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`w-full py-2.5 font-semibold rounded-lg shadow-sm transition ${isLoading ? 'bg-gray-400 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {isLoading ? "Memproses..." : "Masuk"}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="px-3 bg-white dark:bg-gray-900 text-gray-500">atau</span></div>
        </div>

        <motion.button type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`w-full flex items-center justify-center gap-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 transition ${isGoogleLoading ? 'opacity-70' : ''}`}>
          <FcGoogle className="w-5 h-5" />
          {isGoogleLoading ? "Memproses Google..." : "Masuk dengan Google"}
        </motion.button>
      </motion.div>
    </main>
  );
}