"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, CalendarDays, Clock, FileText, 
  Users, Building, Link as LinkIcon, CheckCircle2,
  X, Info, ArrowRight, Power, AlertCircle, Mail, Phone
} from "lucide-react";

import { collection, addDoc, serverTimestamp, onSnapshot, query, where, getDocs } from "firebase/firestore"; 
import { db } from "../../../firebase"; 

export default function PeminjamanRuangan() {
  const router = useRouter();
  const [role, setRole] = useState("mahasiswa"); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filterRuangan, setFilterRuangan] = useState("Lab IoT");
  
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today - tzOffset)).toISOString().split('T')[0];
  const [filterTanggal, setFilterTanggal] = useState(localISOTime);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role"); 
    if (userRole === "dosen") {
      setRole("dosen");
    } else {
      setRole("mahasiswa");
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pengajuan_lab"), where("ruangan", "==", filterRuangan));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        const startHour = parseInt(data.jam_mulai?.split(':')[0] || 0);
        const endHour = parseInt(data.jam_selesai?.split(':')[0] || 0);
        const duration = endHour - startHour;
        const startHourIdx = startHour - 7;

        return { id: doc.id, ...data, startHourIdx, duration };
      });
      setEvents(fetchedEvents);
    });

    return () => unsubscribe();
  }, [filterRuangan]);

  const getWeekDates = (dateString) => {
    const curr = new Date(dateString);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(curr.setDate(diff));

    return Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    });
  };

  const weekDates = getWeekDates(filterTanggal);
  const hours = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, "0")}:00`); 
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    setRole("mahasiswa");
    alert("Berhasil Logout!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);

    const formData = new FormData(e.target);
    const dataObjek = Object.fromEntries(formData.entries());
    
    if (dataObjek.ruangan === "") {
      alert("Harap pilih ruangan terlebih dahulu!");
      setIsLoading(false);
      return;
    }

    try {
      // 1. CEK DOUBLE BOOKING (BENTROK JADWAL)
      const qCek = query(
        collection(db, "pengajuan_lab"),
        where("ruangan", "==", dataObjek.ruangan),
        where("tanggal", "==", dataObjek.tanggal),
        where("status", "in", ["pending", "disetujui"])
      );
      
      const snapshotCek = await getDocs(qCek);
      let isConflict = false;

      snapshotCek.forEach((doc) => {
        const jadwalEksis = doc.data();
        if (
          dataObjek.jam_mulai < jadwalEksis.jam_selesai && 
          dataObjek.jam_selesai > jadwalEksis.jam_mulai
        ) {
          isConflict = true;
        }
      });

      if (isConflict) {
        alert("⚠️ Maaf, jam peminjaman ini bentrok dengan jadwal lain yang sudah ada (sedang pending / disetujui). Silakan pilih jam atau ruangan lain.");
        setIsLoading(false);
        return; 
      }

      // 2. SIMPAN DATA KE FIREBASE
      dataObjek.role = role;
      dataObjek.waktuPengajuan = serverTimestamp();
      dataObjek.status = "pending";

      await addDoc(collection(db, "pengajuan_lab"), dataObjek);

      // 3. KIRIM NOTIFIKASI EMAIL KE LABORAN
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: dataObjek.nama_peminjam,
            ruangan: dataObjek.ruangan,
            tanggal: dataObjek.tanggal,
            jam: `${dataObjek.jam_mulai} - ${dataObjek.jam_selesai}`,
            keperluan: dataObjek.keperluan
          }),
        });
      } catch (emailError) {
        console.error("Email gagal dikirim, tapi data tetap masuk", emailError);
      }

      // 4. RESET FORM & TAMPILKAN SUKSES
      setIsSuccess(true);
      e.target.reset();
      
      setFilterRuangan(dataObjek.ruangan);
      setFilterTanggal(dataObjek.tanggal);

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Error Firebase:", error);
      alert("Gagal mengirim data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800 relative">
      
      {/* MODAL DETAIL JADWAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10">
              <div className={`p-6 text-white flex justify-between items-start ${selectedEvent.status === 'disetujui' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : selectedEvent.status === 'ditolak' ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}>
                <div>
                  <span className="inline-block px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold mb-2 backdrop-blur-md">
                    {selectedEvent.status === 'disetujui' ? '✅ Telah Disetujui' : selectedEvent.status === 'ditolak' ? '❌ Ditolak' : '⏳ Menunggu Persetujuan'}
                  </span>
                  <h3 className="text-xl font-bold leading-tight">{selectedEvent.keperluan}</h3>
                  <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5"><Clock size={14}/> {selectedEvent.tanggal} | {selectedEvent.jam_mulai} - {selectedEvent.jam_selesai}</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-500"><User size={24}/></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Peminjam</p>
                    <p className="font-bold text-slate-800 text-base">{selectedEvent.nama_peminjam}</p>
                    <p className="text-sm text-slate-500 capitalize">{selectedEvent.role} {selectedEvent.instansi ? `- ${selectedEvent.instansi}` : ''}</p>
                    
                    <div className="mt-2 flex flex-col gap-1 text-xs font-medium text-slate-500">
                      {selectedEvent.email && <span className="flex items-center gap-1.5"><Mail size={12}/> {selectedEvent.email}</span>}
                      {selectedEvent.no_hp && <span className="flex items-center gap-1.5"><Phone size={12}/> {selectedEvent.no_hp}</span>}
                    </div>
                  </div>
                </div>

                {selectedEvent.catatan && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1"><Info size={14}/> Catatan Peminjam</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedEvent.catatan}</p>
                  </div>
                )}

                {selectedEvent.status === 'ditolak' && selectedEvent.catatan_admin && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5 mb-1"><AlertCircle size={14}/> Alasan Penolakan</p>
                    <p className="text-sm text-red-700 leading-relaxed font-medium">{selectedEvent.catatan_admin}</p>
                  </div>
                )}

                {selectedEvent.link_materi && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-2"><LinkIcon size={14}/> Materi Kuliah (Dosen)</p>
                    <a href={selectedEvent.link_materi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:text-indigo-700 transition-all border border-indigo-100 w-full justify-center">🔗 Buka Tautan Materi</a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">Peminjaman Ruangan</h1>
          <p className="text-slate-500 font-medium mt-1">Sistem Informasi Laboratorium ITERA (SILABOR)</p>
        </div>
        <div className="flex items-center gap-3">
          {role === 'dosen' ? (
            <button onClick={handleLogout} title="Logout Dosen" className="flex items-center justify-center w-11 h-11 rounded-full text-white bg-red-500 shadow-md shadow-red-500/30 hover:bg-red-600 hover:scale-105 transition-all"><Power size={18} strokeWidth={2.5} /></button>
          ) : (
            <Link href="/login" title="Login Staf / Dosen" className="flex items-center justify-center w-11 h-11 rounded-full text-white bg-orange-500 shadow-md shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 transition-all"><ArrowRight size={20} strokeWidth={2.5} /></Link>
          )}
          <Link href="https://ro.itera.ac.id/" className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">Beranda</Link>
        </div> {/* <--- INI DIV PENUTUP YANG DITAMBAHKAN */}
      </motion.div>

      {role === 'dosen' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-7xl mx-auto mb-6">
          <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-md shadow-indigo-200">
            <span className="bg-white/20 p-2 rounded-xl"><User size={20} /></span>
            <div><p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Mode Aktif</p><p className="font-bold text-sm">Form khusus Dosen (Fitur lampiran materi terbuka)</p></div>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM LENGKAP */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-4">
          <div className="bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              
              <div>
                <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><MapPin size={16}/> Ruangan <span className="text-red-500">*</span></label>
                <select name="ruangan" defaultValue="" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                  <option value="" disabled>- Pilih Ruangan -</option>
                  <option value="Lab Fisiologi Olahraga">Lab Fisiologi Olahraga</option>
                  <option value="Lab Analisis Gerak">Lab Analisis Gerak</option>
                  <option value="Lab Teknologi Olahraga">Lab Teknologi Olahraga</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><User size={16}/> Nama Peminjam <span className="text-red-500">*</span></label>
                <input type="text" name="nama_peminjam" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Building size={16}/> Instansi / Unit</label>
                  <input type="text" name="instansi" placeholder="Opsional" className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Users size={16}/> Jml Peserta</label>
                  <input type="number" name="jumlah_peserta" placeholder="Opsional" className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Mail size={16}/> Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" required placeholder="nama@email.com" className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Phone size={16}/> No HP / WA <span className="text-red-500">*</span></label>
                  <input type="tel" name="no_hp" required placeholder="08..." className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><FileText size={16}/> Keperluan <span className="text-red-500">*</span></label>
                <input type="text" name="keperluan" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Info size={16}/> Catatan</label>
                <textarea name="catatan" rows="2" placeholder="Instruksi tambahan untuk laboran..." className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="col-span-2">
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><CalendarDays size={16}/> Tanggal <span className="text-red-500">*</span></label>
                  <input type="date" name="tanggal" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Clock size={16}/> Jam Mulai <span className="text-red-500">*</span></label>
                  <input type="time" name="jam_mulai" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2 font-semibold text-slate-700"><Clock size={16}/> Jam Selesai <span className="text-red-500">*</span></label>
                  <input type="time" name="jam_selesai" required className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                </div>
              </div>

              {role === "dosen" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-3">
                  <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><LinkIcon size={16} /> Tautan Materi Kuliah</h3>
                  <div>
                    <label className="block mb-2 text-xs font-semibold text-indigo-700">Link Google Drive</label>
                    <input type="url" name="link_materi" placeholder="https://..." className="w-full border border-indigo-200 p-3 rounded-xl outline-none text-sm bg-white focus:ring-2 focus:ring-indigo-500/30" />
                  </div>
                </motion.div>
              )}

              <button type="submit" disabled={isLoading} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all mt-4 ${isLoading ? 'bg-slate-400 cursor-not-allowed shadow-none' : (isSuccess ? 'bg-green-500' : (role === 'dosen' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700'))}`}>
                {isLoading ? "Memproses..." : isSuccess ? <><CheckCircle2 size={20}/> Terkirim</> : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        </motion.div>

        {/* KOLOM KANAN: JADWAL KALENDER & FILTER */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-8">
          <div className="bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full flex flex-col">
            
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
              <div>
                <p className="text-sm text-orange-600 font-bold mb-1 flex items-center gap-1.5"><CalendarDays size={16}/> Jadwal Ruangan</p>
                <h2 className="text-xl font-extrabold text-slate-800">Cek Ketersediaan</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <select 
                  value={filterRuangan} 
                  onChange={(e) => setFilterRuangan(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm bg-white border border-slate-200 outline-none font-medium text-slate-700 cursor-pointer hover:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="Lab Fisiologi Olahraga">Lab Fisiologi Olahraga</option>
                  <option value="Lab Analisis Gerak">Lab Analisis Gerak</option>
                  <option value="Lab Teknologi Olahraga">Lab Teknologi Olahraga</option>
                </select>
                <input 
                  type="date" 
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  title="Pilih Tanggal Peminjaman" 
                  className="px-3 py-2 rounded-xl text-sm bg-white border border-slate-200 outline-none font-medium text-slate-700 cursor-pointer hover:border-orange-300 focus:ring-2 focus:ring-orange-500/20" 
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1 border border-slate-200 rounded-2xl shadow-sm">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 sticky top-0 z-10 shadow-sm">
                  <div className="p-4 border-r border-slate-200 flex items-center justify-center">Waktu</div>
                  {days.map((day, idx) => {
                    const tgl = weekDates[idx].split('-')[2];
                    return (
                      <div key={idx} className="p-3 border-r border-slate-200 last:border-0 flex flex-col items-center justify-center">
                        <span className="text-slate-800 text-sm">{day}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{tgl}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="h-[550px] overflow-y-auto scrollbar-hide bg-white relative">
                  {hours.map((hour, idx) => (
                    <div key={`row-${idx}`} className="grid grid-cols-8 border-b border-slate-100 h-16 group">
                      <div className="p-3 border-r border-slate-200 bg-slate-50/50 font-semibold text-slate-500 text-xs text-center flex items-center justify-center group-hover:bg-orange-50/50 transition-colors">{hour}</div>
                      {days.map((_, dayIdx) => (
                        <div key={`cell-${idx}-${dayIdx}`} className="border-r border-slate-100 border-dashed relative hover:bg-orange-50/30 cursor-crosshair transition-colors">
                          
                          {events.map((evt) => {
                            if (evt.startHourIdx === idx && evt.tanggal === weekDates[dayIdx]) {
                              return (
                                <motion.div 
                                  key={evt.id}
                                  onClick={() => setSelectedEvent(evt)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  style={{ height: `calc(${evt.duration} * 4rem + ${evt.duration - 1}px)` }}
                                  className={`absolute top-0 inset-x-1 z-10 rounded-lg text-white font-bold flex flex-col items-start p-2 shadow-md cursor-pointer text-left border overflow-hidden
                                    ${evt.status === 'disetujui' ? 'bg-green-500 border-green-400 shadow-green-500/20' : 
                                      evt.status === 'ditolak' ? 'bg-red-500 border-red-400 shadow-red-500/20' : 
                                      'bg-orange-400 border-orange-300 shadow-orange-500/20'}`}
                                >
                                  <span className={`text-[10px] px-1.5 rounded mb-1 backdrop-blur-sm ${evt.status === 'disetujui' ? 'bg-green-700/50' : evt.status === 'ditolak' ? 'bg-red-700/50' : 'bg-orange-600/50'}`}>
                                    {evt.status === 'disetujui' ? 'Disetujui' : evt.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                                  </span>
                                  <span className="text-[11px] leading-tight line-clamp-2">{evt.keperluan}</span>
                                  <span className="text-[10px] font-normal mt-auto flex items-center gap-1 opacity-90 truncate w-full">
                                    <User size={10}/> {evt.nama_peminjam.split(' ')[0]}
                                  </span>
                                </motion.div>
                              );
                            }
                            return null;
                          })}

                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-600 px-2">
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-orange-400 shadow-sm"></span> Menunggu</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm"></span> Disetujui</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm"></span> Ditolak</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}