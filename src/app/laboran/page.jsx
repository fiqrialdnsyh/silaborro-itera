"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  collection, getDocs, doc, updateDoc, query, orderBy, limit 
} from "firebase/firestore"; 
import { db } from "../../firebase"; 
import { LogOut, Link as LinkIcon, MessageCircle, Download, Filter, Calendar } from "lucide-react"; 

export default function DashboardLaboran() {
  const [dataPengajuan, setDataPengajuan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Filter
  const [filterRuangan, setFilterRuangan] = useState("Semua");
  const [filterBulan, setFilterBulan] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState(""); // Filter Tanggal Spesifik
  const [bulanOptions, setBulanOptions] = useState([]); 

  const generateBulanOptions = (dataDariDB) => {
    const options = new Set();
    const currentDate = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.add(yyyymm);
    }

    dataDariDB.forEach(item => {
      if (item.tanggal) options.add(item.tanggal.substring(0, 7)); 
    });

    setBulanOptions(Array.from(options).sort().reverse());
  };

  const formatBulan = (yyyymm) => {
    const [year, month] = yyyymm.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  };

  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "pengajuan_lab"),
        orderBy("waktuPengajuan", "desc"),
        limit(200) 
      );
      
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setDataPengajuan(data);
      generateBulanOptions(data); 
    } catch (error) {
      console.error("Error fetching data: ", error);
      alert("Gagal mengambil data. Pastikan index Firestore sudah terbuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const handleUpdateStatus = async (id, statusBaru) => {
    let dataUpdate = { status: statusBaru };

    if (statusBaru === 'ditolak') {
      const alasan = window.prompt("Berikan alasan penolakan:");
      if (alasan === null) return; 
      dataUpdate.catatan_admin = alasan || "Tidak ada alasan spesifik.";
    } else {
      const confirmAction = window.confirm("Setujui pengajuan ini?");
      if (!confirmAction) return;
    }

    try {
      const refDokumen = doc(db, "pengajuan_lab", id);
      await updateDoc(refDokumen, dataUpdate);

      setDataPengajuan(prevData => 
        prevData.map(item => item.id === id ? { ...item, ...dataUpdate } : item)
      );
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Gagal mengubah status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    window.location.href = "/login";
  };

  // --- LOGIKA FILTER EKSKLUSIF (Bulan vs Tanggal) ---
  const handleGantiBulan = (e) => {
    setFilterBulan(e.target.value);
    setFilterTanggal(""); // Reset tanggal spesifik jika bulan dipilih
  };

  const handleGantiTanggal = (e) => {
    setFilterTanggal(e.target.value);
    setFilterBulan("Semua"); // Reset bulan jika tanggal spesifik dipilih
  };

  const filteredData = dataPengajuan.filter((item) => {
    const matchRuangan = filterRuangan === "Semua" || item.ruangan === filterRuangan;
    const matchBulan = filterBulan === "Semua" || (item.tanggal && item.tanggal.startsWith(filterBulan));
    const matchTanggal = filterTanggal === "" || item.tanggal === filterTanggal;
    
    return matchRuangan && matchBulan && matchTanggal;
  });

  // --- DOWNLOAD EXCEL (CSV) LENGKAP SEMUA INPUT ---
  const handleDownloadCSV = () => {
    if(filteredData.length === 0) {
      alert("⚠️ Tidak ada data untuk diunduh pada filter ini.");
      return;
    }

    const separator = ";"; 
    
    // Header CSV (Semua data dimasukkan)
    let csvContent = `Nama Peminjam${separator}Role${separator}Instansi${separator}Jml Peserta${separator}Email${separator}No HP/WA${separator}Ruangan${separator}Tanggal${separator}Jam Mulai${separator}Jam Selesai${separator}Keperluan${separator}Catatan${separator}Status\n`;
    
    filteredData.forEach(item => {
      const escape = (text) => {
        if (!text) return "";
        let cleanText = String(text).replace(/\r?\n|\r/g, " "); 
        cleanText = cleanText.replace(/"/g, '""'); 
        if (cleanText.includes(separator) || cleanText.includes('"')) {
          return `"${cleanText}"`;
        }
        return cleanText;
      };
      
      csvContent += `${escape(item.nama_peminjam)}${separator}${escape(item.role)}${separator}${escape(item.instansi || '-')}${separator}${escape(item.jumlah_peserta || '-')}${separator}${escape(item.email || '-')}${separator}${escape(item.no_hp || '-')}${separator}${escape(item.ruangan)}${separator}${escape(item.tanggal)}${separator}${escape(item.jam_mulai)}${separator}${escape(item.jam_selesai)}${separator}${escape(item.keperluan)}${separator}${escape(item.catatan || '-')}${separator}${escape(item.status || 'pending')}\n`;
    });

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Penamaan file dinamis berdasarkan filter
    const namaLabel = filterTanggal ? filterTanggal : (filterBulan === "Semua" ? "Semua_Bulan" : filterBulan);
    const namaFile = `Rekap_SILABOR_${filterRuangan.replace(/\s+/g, '_')}_${namaLabel}.csv`;
    link.setAttribute("download", namaFile);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[90rem] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Laboran
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sistem Informasi Laboratorium ITERA (SILABOR)</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPengajuan} className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
            Refresh
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </motion.div>

      {/* FILTER & DOWNLOAD ACTION BAR */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[90rem] mx-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row items-center gap-4 justify-between">
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter size={16} />
            <span className="text-sm font-semibold">Filter:</span>
          </div>

          <select 
            value={filterRuangan} 
            onChange={(e) => setFilterRuangan(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm bg-white border border-slate-300 outline-none font-medium text-slate-700 cursor-pointer hover:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="Semua">Semua Ruangan</option>
            <option value="Lab Fisiologi Olahraga">Lab Fisiologi Olahraga</option>
            <option value="Lab Analisis Gerak">Lab Analisis Gerak</option>
            <option value="Lab Teknologi Olahraga">Lab Teknologi Olahraga</option>
          </select>

          {/* Pemisah visual halus */}
          <div className="h-6 w-px bg-slate-300 hidden sm:block mx-1"></div>

          <select 
            value={filterBulan} 
            onChange={handleGantiBulan}
            className="px-3 py-2.5 rounded-xl text-sm bg-white border border-slate-300 outline-none font-medium text-slate-700 cursor-pointer hover:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
            title="Filter berdasarkan Bulan"
          >
            <option value="Semua">Semua Bulan</option>
            {bulanOptions.map(bulan => (
              <option key={bulan} value={bulan}>{formatBulan(bulan)}</option>
            ))}
          </select>

          <div className="flex items-center text-sm font-medium text-slate-400 italic px-1">atau</div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Calendar size={14} className="text-slate-400" />
            </div>
            <input 
              type="date" 
              value={filterTanggal}
              onChange={handleGantiTanggal}
              title="Filter Tanggal Spesifik"
              className="pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white border border-slate-300 outline-none font-medium text-slate-700 cursor-pointer hover:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        <button 
          onClick={handleDownloadCSV}
          className="w-full lg:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-green-600/20 transition-all whitespace-nowrap"
        >
          <Download size={16} /> Export Excel Lengkap
        </button>

      </motion.div>

      {/* TABEL DATA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-[90rem] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            
            <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Peminjam</th>
                <th className="px-6 py-4 font-semibold">Jadwal & Ruangan</th>
                <th className="px-6 py-4 font-semibold">Keperluan</th>
                <th className="px-6 py-4 font-semibold">Lampiran</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 font-medium">
                    <span className="animate-pulse text-slate-400">Memuat data terbaru...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">
                    Tidak ada data peminjaman untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* KOLOM 1: PEMINJAM */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-base">{item.nama_peminjam}</div>
                      <div className="text-xs text-slate-500 capitalize mt-0.5">
                        {item.role} {item.instansi ? `• ${item.instansi}` : ''}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                        <span className="text-slate-400">{item.email}</span>
                        {item.no_hp && (
                          <a href={`https://wa.me/${item.no_hp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                            <MessageCircle size={12} /> Hubungi
                          </a>
                        )}
                      </div>
                    </td>

                    {/* KOLOM 2: JADWAL */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.ruangan}</div>
                      <div className="text-sm font-medium text-slate-600 mt-1">{item.tanggal}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.jam_mulai} - {item.jam_selesai} WIB</div>
                    </td>

                    {/* KOLOM 3: KEPERLUAN */}
                    <td className="px-6 py-4 whitespace-normal min-w-[250px]">
                      <div className="font-semibold text-slate-800">{item.keperluan}</div>
                      {item.jumlah_peserta && (
                        <div className="text-xs text-slate-500 mt-0.5">{item.jumlah_peserta} Peserta</div>
                      )}
                      {item.catatan && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-100 p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700">Catatan:</span> {item.catatan}
                        </div>
                      )}
                    </td>

                    {/* KOLOM 4: LAMPIRAN */}
                    <td className="px-6 py-4">
                      {item.link_materi ? (
                        <a href={item.link_materi} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 text-sm font-semibold">
                          <LinkIcon size={14}/> Buka Tautan
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>

                    {/* KOLOM 5: STATUS */}
                    <td className="px-6 py-4">
                      {(!item.status || item.status === 'pending') && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Menunggu</span>
                      )}
                      {item.status === 'disetujui' && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Disetujui</span>
                      )}
                      {item.status === 'ditolak' && (
                        <div>
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Ditolak</span>
                          {item.catatan_admin && (
                            <div className="text-[10px] text-red-600 mt-1.5 whitespace-normal w-32 leading-tight">
                              Alasan: {item.catatan_admin}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* KOLOM 6: AKSI */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col gap-2 justify-end w-24 ml-auto">
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'disetujui')}
                          disabled={item.status === 'disetujui'}
                          className="bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm"
                        >
                          Setujui
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'ditolak')}
                          disabled={item.status === 'ditolak'}
                          className="bg-white border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                          Tolak
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}