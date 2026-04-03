/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import News from './pages/News';
import Squads from './pages/Squads';
import Maintenance from './pages/Maintenance';
import { useAuth } from './AuthContext';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNews from './pages/admin/AdminNews';
import AdminBranches from './pages/admin/AdminBranches';
import AdminTeams from './pages/admin/AdminTeams';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminStaff from './pages/admin/AdminStaff';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMatches from './pages/admin/AdminMatches';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNavigation from './pages/admin/AdminNavigation';
import BranchDetail from './pages/BranchDetail';
import Hakkimizda from './pages/Hakkimizda';
import Iletisim from './pages/Iletisim';
import Fixture from './pages/Fixture';
import LoginPage from './pages/LoginPage';

function App() {
  const { loading, maintenanceMode, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a5f6b] flex flex-col items-center justify-center gap-8">
        <motion.img 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" 
          alt="Çangücü SK" 
          className="h-32 w-auto drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]"
        />
        <div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If maintenance mode is ON and user is NOT an admin, show maintenance page
  if (maintenanceMode && !isAdmin) {
    return <Maintenance />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {maintenanceMode && isAdmin && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center sticky top-0 z-[60] shadow-lg">
          BAKIM MODU ŞU ANDA AKTİF - SADECE SİZ GÖREBİLİRSİNİZ
        </div>
      )}
      
      <ScrollToTop />
      <Routes>
        {/* Admin Routes - No Navbar/Footer */}
        <Route path="/cangucu-panel" element={isAdmin ? <AdminLayout /> : <Navigate to="/" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="haberler" element={<AdminNews />} />
          <Route path="branslar" element={<AdminBranches />} />
          <Route path="takimlar" element={<AdminTeams />} />
          <Route path="oyuncular" element={<AdminPlayers />} />
          <Route path="personel" element={<AdminStaff />} />
          <Route path="galeri" element={<AdminGallery />} />
          <Route path="maclar" element={<AdminMatches />} />
          <Route path="menu" element={<AdminNavigation />} />
          <Route path="ayarlar" element={<AdminSettings />} />
        </Route>

        {/* Public Routes - With Navbar/Footer */}
        <Route path="*" element={
          <>
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/haberler" element={<News />} />
                <Route path="/takim/:teamId" element={<Squads />} />
                <Route path="/brans/:branchId" element={<BranchDetail />} />
                <Route path="/fikstur/:teamId" element={<Fixture />} />
                <Route path="/galeri" element={<div className="min-h-screen bg-[#1a5f6b] flex items-center justify-center text-white text-2xl uppercase tracking-widest">Galeri Sayfası Yakında!</div>} />
                <Route path="/hakkimizda" element={<Hakkimizda />} />
                <Route path="/iletisim" element={<Iletisim />} />
                <Route path="/cangucu-login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
