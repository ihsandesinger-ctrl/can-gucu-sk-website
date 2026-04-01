
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import GalleryPage from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import DynamicPage from './pages/DynamicPage';
import ScrollToTop from './components/ScrollToTop';
import type { CMSData } from './types';
import { subscribeToCMSData, getCMSData, migrateDataToFirestore } from './firebaseService';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      const timeout = setTimeout(() => {
        if (loading && !error) {
          setError('Veritabanı bağlantısı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.');
          setLoading(false);
        }
      }, 15000);

      try {
        if (!db) {
          console.warn('Firebase not initialized. Cannot load live site.');
          setError('Veritabanı bağlantısı kurulamadı. Lütfen internetinizi kontrol edin.');
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        // Use one-time fetch for public site to save quota
        const data = await getCMSData();
        clearTimeout(timeout);
        
        if (data.isFallback && !data.siteSettings) {
          setError('Site henüz kurulmamış veya veritabanı boş. Lütfen yönetici panelinden kurulum yapın.');
        } else {
          setCmsData(data);
          setError(null);
        }
        setLoading(false);

      } catch (err: any) {
        console.error('App initialization error:', err);
        clearTimeout(timeout);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Update favicon and global styles dynamically
  useEffect(() => {
    if (cmsData) {
      // Favicon
      if (cmsData.siteSettings.logo) {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        
        if (favicon) {
          favicon.href = cmsData.siteSettings.logo;
          // Set type based on logo format (base64 or URL)
          if (cmsData.siteSettings.logo.startsWith('data:image/svg+xml')) {
            favicon.type = 'image/svg+xml';
          } else if (cmsData.siteSettings.logo.startsWith('data:image/png')) {
            favicon.type = 'image/png';
          } else if (cmsData.siteSettings.logo.endsWith('.svg')) {
            favicon.type = 'image/svg+xml';
          } else {
            favicon.type = 'image/png';
          }
        }

        if (appleIcon) {
          appleIcon.href = cmsData.siteSettings.logo;
        }
      }

      // Document Title
      if (cmsData.siteSettings.siteTitle) {
        document.title = cmsData.siteSettings.siteTitle;
      }

      // Global Styles
      const { globalStyles } = cmsData.siteSettings;
      document.body.style.fontFamily = globalStyles.fontFamily;
      document.body.style.fontSize = globalStyles.baseFontSize;
      document.documentElement.style.setProperty('--primary-color', globalStyles.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', globalStyles.secondaryColor);
    }
  }, [cmsData]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-white font-bold text-xl tracking-widest animate-pulse">ÇANGÜCÜ SK</p>
        <p className="text-gray-400 text-sm mt-2">Yükleniyor...</p>
      </div>
    );
  }

  if (error || !cmsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Bağlantı Hatası</h1>
          <p className="text-gray-600 mb-8">{error || 'İçerik yüklenemedi.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--primary-color)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (cmsData.siteSettings.maintenanceMode) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/cangucu-panel" element={<AdminPage />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
              <img src={cmsData.siteSettings.logo} alt="Logo" className="h-24 mb-8" />
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Site Bakımdadır</h1>
              <p className="text-xl text-gray-600">Size daha iyi hizmet verebilmek için çalışıyoruz. Lütfen daha sonra tekrar deneyiniz.</p>
            </div>
          } />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/cangucu-panel" element={<AdminPage />} />
        <Route path="*" element={<Main data={cmsData} />} />
      </Routes>
    </HashRouter>
  );
};

interface MainProps {
  data: CMSData;
}

const Main: React.FC<MainProps> = ({ data }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        logo={data.siteSettings.logo} 
        teams={data.teamData} 
        pages={data.pagesData}
        settings={data.siteSettings} 
      />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage 
              heroContent={data.homePageHero}
              fixtures={data.fixtures} 
              teams={data.teamData}
              news={data.newsData} 
              gallery={data.galleryData} 
              siteLogo={data.siteSettings.logo}
              siteTitle={data.siteSettings.siteTitle || ''}
            />} 
          />
          
          <Route 
            path="/takim/:teamSlug" 
            element={<TeamPage teams={data.teamData} fixtures={data.fixtures} />} 
          />

          <Route path="/haberler" element={<NewsPage news={data.newsData} />} />
          <Route path="/haber/:id" element={<NewsDetailPage news={data.newsData} />} />
          <Route path="/galeri" element={<GalleryPage images={data.galleryData} />} />
          <Route path="/hakkimizda" element={<AboutPage staff={data.staffData} content={data.missionVision} />} />
          <Route path="/iletisim" element={<ContactPage siteSettings={data.siteSettings}/>} />
          <Route path="/sayfa/:slug" element={<DynamicPage pages={data.pagesData} />} />
        </Routes>
      </main>
      <Footer siteSettings={data.siteSettings} teams={data.teamData} />
    </div>
  );
}

export default App;
