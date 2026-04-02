import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  maintenanceMode: boolean;
  settings: {
    clubName: string;
    clubLogo: string;
    email: string;
    phone: string;
    address: string;
    aboutText: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    branchesCount?: string;
    athletesCount?: string;
    coachesCount?: string;
    newsCount?: string;
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
  settings: {
    clubName: 'Çangücü SK',
    clubLogo: 'https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6',
    email: '',
    phone: '',
    address: '',
    aboutText: '',
  },
  navigation: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [settings, setSettings] = useState({
    clubName: 'Çangücü SK',
    clubLogo: 'https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6',
    email: '',
    phone: '',
    address: '',
    aboutText: '',
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
        setSettings({
          clubName: data.clubName || 'Çangücü SK',
          clubLogo: data.clubLogo || 'https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          aboutText: data.aboutText || '',
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          branchesCount: data.branchesCount,
          athletesCount: data.athletesCount,
          coachesCount: data.coachesCount,
          newsCount: data.newsCount,
          heroBgImage: data.heroBgImage,
          showHeroButtons: data.showHeroButtons,
        });
      } else {
        console.warn("Firestore'da ayar dökümanı bulunamadı. Varsayılanlar kullanılıyor.");
      }
    }, (error) => {
      console.error("Ayarlar dinlenirken hata oluştu:", error);
    });

    // Listen for navigation
    const qNav = query(collection(db, 'navigation'), orderBy('order', 'asc'));
    const unsubscribeNav = onSnapshot(qNav, (snapshot) => {
      const navData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NavItem[];
      setNavigation(navData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeNav();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, maintenanceMode, settings, navigation }}>
      {children}
    </AuthContext.Provider>
  );
};
