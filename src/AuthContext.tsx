import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  maintenanceMode: boolean;
  dbStatus: 'checking' | 'connected' | 'error' | 'quota' | 'offline';
  settings: {
    clubName: string;
    clubLogo: string;
    email: string;
    phone: string;
    address: string;
    aboutText: string;
    missionText?: string;
    visionText?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    showInstagram?: boolean;
    showFacebook?: boolean;
    showTwitter?: boolean;
    branchesCount?: string;
    athletesCount?: string;
    coachesCount?: string;
    newsCount?: string;
    showBranchesCount?: boolean;
    showAthletesCount?: boolean;
    showCoachesCount?: boolean;
    showNewsCount?: boolean;
    heroBgImage?: string;
    showHeroButtons?: boolean;
  };
  navigation: NavItem[];
}

interface NavItem {
  id: string;
  title: string;
  path: string;
  order: number;
  isHidden: boolean;
  isDropdown: boolean;
  dropdownType?: 'static' | 'branches' | 'teams' | 'fixtures';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  maintenanceMode: false,
  dbStatus: 'checking',
  settings: {
    clubName: 'Çangücü SK',
    clubLogo: '/logo.png',
    email: '',
    phone: '',
    address: '',
    aboutText: '',
    missionText: 'Sporun her dalında etik değerlere bağlı, disiplinli ve başarılı bireyler yetiştirerek Türk sporuna katkı sağlamak.',
    visionText: 'Çan\'ın ve bölgenin en prestijli, altyapısı en güçlü ve başarılarıyla örnek gösterilen spor kulübü olmak.',
  },
  navigation: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dbStatus, setDbStatus] = useState<AuthContextType['dbStatus']>('checking');
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [settings, setSettings] = useState<AuthContextType['settings']>({
    clubName: 'Çangücü SK',
    clubLogo: '/logo.png',
    email: '',
    phone: '',
    address: '',
    aboutText: '',
    missionText: 'Sporun her dalında etik değerlere bağlı, disiplinli ve başarılı bireyler yetiştirerek Türk sporuna katkı sağlamak.',
    visionText: 'Çan\'ın ve bölgenin en prestijli, altyapısı en güçlü ve başarılarıyla örnek gösterilen spor kulübü olmak.',
  });

  useEffect(() => {
    // Listen for auth changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is admin (based on email)
        const adminEmail = "ihsandurgut1@gmail.com";
        // Allow admin if email matches, even if not verified (for legacy accounts)
        setIsAdmin(currentUser.email === adminEmail);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Listen for global settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setDbStatus('connected');
        setSettings({
          clubName: data.clubName || 'Çangücü SK',
          clubLogo: data.clubLogo || '/logo.png',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          aboutText: data.aboutText || '',
          missionText: data.missionText || 'Sporun her dalında etik değerlere bağlı, disiplinli ve başarılı bireyler yetiştirerek Türk sporuna katkı sağlamak.',
          visionText: data.visionText || 'Çan\'ın ve bölgenin en prestijli, altyapısı en güçlü ve başarılarıyla örnek gösterilen spor kulübü olmak.',
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          showInstagram: data.showInstagram !== false,
          showFacebook: data.showFacebook !== false,
          showTwitter: data.showTwitter !== false,
          branchesCount: data.branchesCount,
          athletesCount: data.athletesCount,
          coachesCount: data.coachesCount,
          newsCount: data.newsCount,
          showBranchesCount: data.showBranchesCount !== false,
          showAthletesCount: data.showAthletesCount !== false,
          showCoachesCount: data.showCoachesCount !== false,
          showNewsCount: data.showNewsCount !== false,
          heroBgImage: data.heroBgImage,
          showHeroButtons: data.showHeroButtons,
        });
      } else {
        setDbStatus('connected'); // Connected but doc missing
        console.warn("Firestore'da ayar dökümanı bulunamadı. Varsayılanlar kullanılıyor.");
      }
    }, (error: any) => {
      console.error("Ayarlar dinlenirken hata oluştu:", error);
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        setDbStatus('quota');
      } else if (error.code === 'unavailable' || !window.navigator.onLine) {
        setDbStatus('offline');
      } else {
        setDbStatus('error');
      }
    });

    // Listen for navigation
    const navRef = doc(db, 'navigation', 'main');
    const unsubscribeNav = onSnapshot(navRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNavigation(data.items || []);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeNav();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, maintenanceMode, dbStatus, settings, navigation }}>
      {children}
    </AuthContext.Provider>
  );
};
