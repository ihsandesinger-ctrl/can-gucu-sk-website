import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import NewsPage from './pages/NewsPage';
import GalleryPage from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import type { CMSData } from './types';

const App: React.FC = () => {
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [
          settingsRes,
          homepageRes,
          teamsRes,
          fixturesRes,
          newsRes,
          galleryRes,
          staffRes,
          missionVisionRes,
        ] = await Promise.all([
          fetch('/content/settings.json'),
          fetch('/content/homepage.json'),
          fetch('/content/teams.json'),
          fetch('/content/fixtures.json'),
          fetch('/content/newsData.json'),
          fetch('/content/galleryData.json'),
          fetch('/content/staffData.json'),
          fetch('/content/missionVision.json'),
        ]);

        const allResponses = [settingsRes, homepageRes, teamsRes, fixturesRes, newsRes, galleryRes, staffRes, missionVisionRes];
        for (const res of allResponses) {
          if (!res.ok) {
            throw new Error(`Failed to fetch content from ${res.url}`);
          }
        }

        const siteSettings = await settingsRes.json();
        const homePageHero = await homepageRes.json();
        const teamsData = await teamsRes.json();
        const fixturesData = await fixturesRes.json();
        const newsData = await newsRes.json();
        const galleryData = await galleryRes.json();
        const staffData = await staffRes.json();
        const missionVision = await missionVisionRes.json();

        setCmsData({
          siteSettings,
          homePageHero,
          teamData: teamsData.teams,
          fixtures: fixturesData.fixtures,
          newsData: newsData.articles,
          galleryData: galleryData.images,
          staffData: staffData.members,
          missionVision,
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (error || !cmsData) {
    return <div className="flex items-center justify-center min-h-screen">İçerik yüklenemedi: {error}</div>;
  }

  return (
    <HashRouter>
      <Main data={cmsData} />
    </HashRouter>
  );
};

interface MainProps {
  data: CMSData;
}

const Main: React.FC<MainProps> = ({ data }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header logo={data.siteSettings.logo} teams={data.teamData} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage 
              heroContent={data.homePageHero}
              fixtures={data.fixtures} 
              teams={data.teamData}
              news={data.newsData} 
              gallery={data.galleryData} 
              siteLogo={data.siteSettings.logo}
            />} 
          />
          
          <Route 
            path="/takim/:teamSlug" 
            element={<TeamPage teams={data.teamData} fixtures={data.fixtures} />} 
          />

          <Route path="/haberler" element={<NewsPage news={data.newsData} />} />
          <Route path="/galeri" element={<GalleryPage images={data.galleryData} />} />
          <Route path="/hakkimizda" element={<AboutPage staff={data.staffData} content={data.missionVision} />} />
          <Route path="/iletisim" element={<ContactPage siteSettings={data.siteSettings}/>} />
        </Routes>
      </main>
      <Footer siteSettings={data.siteSettings} teams={data.teamData} />
    </div>
  );
}

export default App;