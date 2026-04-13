"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Search } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Home", href: "https://ro.itera.ac.id/" },
    {
      label: "Profil",
      children: [
        { href: "https://ro.itera.ac.id/profil/sejarah", label: "Sejarah" },
        { href: "https://ro.itera.ac.id/profil/visi-misi", label: "Visi & Misi" },
        { href: "https://ro.itera.ac.id/profil/staff-dosen", label: "Staff Dosen" },
        { href: "https://ro.itera.ac.id/profil/prestasi-mahasiswa", label: "Prestasi Mahasiswa" },
      ],
    },
    {
      label: "Akademik",
      children: [
        { href: "https://ro.itera.ac.id/akademik/kurikulum", label: "Kurikulum" },
        { href: "https://ro.itera.ac.id/akademik/jadwal", label: "Jadwal Kuliah" },
        { href: "https://ro.itera.ac.id/akademik/dokumen-akademik", label: "Dokumen Akademik" },
        { href: "https://ro.itera.ac.id/akademik/kebutuhan-mahasiswa", label: "Kebutuhan Mahasiswa" },
        { href: "https://ro.itera.ac.id/akademik/kalender", label: "Kalender Akademik" },
        { href: "https://ro.itera.ac.id/akademik/kerja-praktik", label: "Kerja Praktik" },
        { href: "https://ro.itera.ac.id/akademik/kuliah-kerja-nyata", label: "Kuliah Kerja Nyata" },
        { href: "https://ro.itera.ac.id/akademik/ujian-akhir", label: "Ujian Akhir" },
      ],
    },
    {
      label: "Layanan",
      children: [
        { href: "https://ro.itera.ac.id/layanan/fakultas", label: "Layanan Fakultas" },
        { href: "https://ro.itera.ac.id/layanan/keuangan", label: "Layanan Keuangan" },
        { href: "https://ro.itera.ac.id/layanan/pmb", label: "Penerimaan Mahasiswa Baru" },
        { href: "https://ro.itera.ac.id/layanan/lapor-pengaduan", label: "Lapor Pengaduan" },
        { href: "/layanan/peminjaman-ruangan", label: "Peminjaman Lab" }, 
      ],
    },
    {
      label: "Fasilitas",
      children: [
        { href: "https://ro.itera.ac.id/fasilitas/upt-tik-itera", label: "UPT TIK ITERA" },
        { href: "https://ro.itera.ac.id/fasilitas/laboratorium", label: "Laboratorium" },
        { href: "https://ro.itera.ac.id/fasilitas/perpustakaan", label: "Perpustakaan" },
      ],
    },
    { label: "Berita", href: "https://ro.itera.ac.id/berita" },
    { label: "Event", href: "https://ro.itera.ac.id/event" },
  ];

  const isParentActive = (item) => {
    if (item.href) return pathname === item.href;
    if (item.children) return item.children.some((child) => pathname.startsWith(child.href));
    return false;
  };

  return (
    <header className="fixed top-0 w-full z-50 font-sans">
      <div className={`border-b border-gray-200 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white"}`}>
        <div className="max-w-[85rem] mx-auto px-4 md:px-8 h-[80px] flex items-center justify-between">

          {/* 1. LOGO */}
          <Link href="https://ro.itera.ac.id/" className="flex items-center h-full">
            <img
              src="/RekayasaKeolahragaan.png"
              alt="Logo Rekayasa Keolahragaan"
              style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
              className="py-1"
            />
          </Link>

          {/* 2. DESKTOP NAVIGATION */}
          <div className="hidden lg:flex items-center h-full">
            <nav className="flex items-center h-full text-[13px] xl:text-[14px] font-medium text-slate-700">
              {navLinks.map((item) => {
                const active = isParentActive(item);
                const hasChild = !!item.children;

                return (
                  <div
                    key={item.label}
                    className="relative h-full flex items-center px-3 xl:px-4 cursor-pointer group"
                    onMouseEnter={() => hasChild && setDropdown(item.label)}
                    onMouseLeave={() => setDropdown(null)}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`flex items-center h-full transition-colors ${
                          active ? "text-orange-600" : "hover:text-orange-600"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={`flex items-center h-full gap-1.5 transition-colors ${
                          active || dropdown === item.label ? "text-orange-600" : "hover:text-orange-600"
                        }`}
                      >
                        {item.label}
                        {hasChild && (
                          <ChevronDown 
                            size={14} 
                            className={`transition-transform duration-200 ${dropdown === item.label ? "rotate-180" : ""}`} 
                          />
                        )}
                      </span>
                    )}

                    {/* Kotak Dropdown */}
                    <AnimatePresence>
                      {hasChild && dropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-[80px] left-0 bg-white border border-gray-200 shadow-xl flex flex-col min-w-[240px] z-50"
                        >
                          {/* Pita oranye */}
                          <div className="h-1 w-full bg-orange-600"></div>
                          
                          {item.children.map((child, idx) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`px-5 py-3.5 text-[13px] transition-colors hover:text-orange-600 hover:bg-slate-50 ${
                                pathname === child.href ? "text-orange-600 font-bold bg-orange-50/30" : "text-slate-700"
                              } ${idx !== item.children.length - 1 ? "border-b border-gray-200" : ""}`} 
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Ikon Search */}
            <button className="ml-5 xl:ml-8 text-slate-700 hover:text-orange-600 transition-colors">
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* 3. MOBILE BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 4. MOBILE MENU DROPDOWN */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
            >
              <div className="flex flex-col px-6 py-2">
                {navLinks.map((item) => {
                  const hasChild = !!item.children;
                  return (
                    <div key={item.label} className="border-b border-gray-100 last:border-none">
                      <button
                        onClick={() =>
                          hasChild
                            ? setMobileDropdown(mobileDropdown === item.label ? null : item.label)
                            : setMenuOpen(false)
                        }
                        className="w-full flex justify-between items-center py-4 text-left text-[14px] font-medium text-slate-800"
                      >
                        {item.href ? (
                          <Link href={item.href} className="w-full hover:text-orange-600 transition-colors">
                            {item.label}
                          </Link>
                        ) : (
                          <span className={`${mobileDropdown === item.label ? "text-orange-600" : ""} transition-colors`}>{item.label}</span>
                        )}

                        {hasChild && (
                          <ChevronDown
                            className={`transition-transform ${mobileDropdown === item.label ? "rotate-180 text-orange-600" : "text-slate-400"}`}
                            size={16}
                          />
                        )}
                      </button>

                      {/* Mobile Sub-menu */}
                      <AnimatePresence>
                        {hasChild && mobileDropdown === item.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-col pl-4 pb-4 overflow-hidden"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMenuOpen(false)}
                                className={`py-3 text-[13px] border-l-2 pl-4 transition-colors ${
                                  pathname === child.href ? "border-orange-600 text-orange-600 font-semibold" : "border-gray-200 text-slate-600 hover:text-orange-600"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}