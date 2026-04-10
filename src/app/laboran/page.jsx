"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
// Import fungsi Firebase untuk membaca dan mengupdate data
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore"; 
import { db } from "../../firebase"; // Sesuaikan path ini dengan lokasi file firebase.js kamu

export default function DashboardLaboran() {
  const [dataPengajuan, setDataPengajuan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil data dari Firebase saat halaman dimuat
  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      // Mengambil data dari koleksi "pengajuan_lab" (bisa diurutkan berdasarkan waktu jika ada)
      const querySnapshot = await getDocs(collection(db, "pengajuan_lab"));
      
      const data = [];
      querySnapshot.forEach((doc) => {
        // Memasukkan ID unik dari Firebase beserta isi datanya ke dalam array
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setDataPengajuan(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
      alert("Gagal mengambil data dari database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  // Fungsi untuk mengubah status (Disetujui / Ditolak)
  const handleUpdateStatus = async (id, statusBaru) => {
    let dataUpdate = { status: statusBaru };

    // JIKA DITOLAK: Munculkan form pengisian alasan
    if (statusBaru === 'ditolak') {
      const alasan = window.prompt("⚠️ Berikan alasan mengapa pengajuan ini ditolak:");
      
      // Jika admin menekan tombol "Batal" di pop-up, hentikan proses
      if (alasan === null) return; 
      
      // Simpan alasan ke objek yang akan dikirim ke Firebase
      dataUpdate.catatan_admin = alasan || "Tidak ada alasan spesifik yang diberikan.";
    } else {
      // JIKA DISETUJUI: Konfirmasi biasa
      const confirmAction = window.confirm("✅ Apakah Anda yakin ingin MENYETUJUI pengajuan ini?");
      if (!confirmAction) return;
    }

    try {
      const refDokumen = doc(db, "pengajuan_lab", id);
      
      // Update data di Firebase
      await updateDoc(refDokumen, dataUpdate);

      // Update tampilan tabel secara lokal
      setDataPengajuan(prevData => 
        prevData.map(item => item.id === id ? { ...item, ...dataUpdate } : item)
      );

      alert(`Pengajuan berhasil di-${statusBaru}!`);
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Gagal mengubah status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Laboran
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola persetujuan peminjaman ruangan dan laboratorium</p>
        </div>
        <Link href="/" className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
          Kembali ke Beranda
        </Link>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Wrapper for Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Peminjam</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Ruangan</th>
                <th className="px-6 py-4">Jadwal</th>
                <th className="px-6 py-4">Materi (Dosen)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500">Memuat data pengajuan...</td>
                </tr>
              ) : dataPengajuan.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500">Belum ada pengajuan masuk.</td>
                </tr>
              ) : (
                dataPengajuan.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.nama_peminjam}</div>
                      <div className="text-xs text-slate-500">{item.instansi || "Tidak ada instansi"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.role === 'dosen' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.role === 'dosen' ? '👨‍🏫 Dosen' : '👤 Mahasiswa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.ruangan}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{item.tanggal}</div>
                      <div className="text-xs text-slate-500">{item.jam_mulai} - {item.jam_selesai}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.link_materi ? (
                        <a href={item.link_materi} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          🔗 Buka Link
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {/* Cek Status: Defaultnya pending jika baru masuk */}
                      {(!item.status || item.status === 'pending') && <span className="text-orange-500 font-semibold flex items-center gap-1">⏳ Menunggu</span>}
                      {item.status === 'disetujui' && <span className="text-green-600 font-semibold flex items-center gap-1">✅ Disetujui</span>}
                      {item.status === 'ditolak' && <span className="text-red-500 font-semibold flex items-center gap-1">❌ Ditolak</span>}
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center">
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'disetujui')}
                        disabled={item.status === 'disetujui'}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Setujui
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'ditolak')}
                        disabled={item.status === 'ditolak'}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tolak
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}