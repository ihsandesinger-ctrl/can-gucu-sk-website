import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  saveNewsArticle, 
  deleteNewsArticle, 
  saveTeam, 
  deleteTeam, 
  saveGalleryImage, 
  deleteGalleryImage, 
  updateSettings, 
  updateHomepage, 
  updateMissionVision, 
  saveStaffMember, 
  deleteStaffMember, 
  saveFixture,
  migrateDataToFirestore,
  subscribeToAdmins,
  addAdmin,
  removeAdmin
} from '../firebaseService';
import type { CMSData, NewsArticle, Team, GalleryItem, StaffMember, SiteSettings, HomePageHero, MissionVision, Fixture } from '../types';
import { subscribeToCMSData } from '../firebaseService';
import { Plus, Trash2, Save, LogOut, Image as ImageIcon, Settings, Users, Newspaper, Layout, Target, Calendar, Database, ShieldCheck, Copy, ChevronUp, ChevronDown } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    let unsubscribeAdmins: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        subscribeToCMSData((data) => {
          setCmsData(data);
          setLoading(false);
        });
        
        unsubscribeAdmins = subscribeToAdmins((adminList) => {
          setAdmins(adminList);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAdmins) unsubscribeAdmins();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error('Login failed:', err);
      let errorMsg = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'E-posta veya şifre hatalı.';
      }
      alert(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMigration = async () => {
    if (!confirm('Mevcut JSON verilerini veritabanına aktarmak istediğinize emin misiniz? Bu işlem mevcut veritabanı verilerinin üzerine yazabilir.')) return;
    
    setIsMigrating(true);
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} yüklenemedi`);
        return await res.json();
      };

      const [
        settings,
        homepage,
        teams,
        fixtures,
        news,
        gallery,
        staff,
        missionVision,
      ] = await Promise.all([
        fetchJson('/content/settings.json'),
        fetchJson('/content/homepage.json'),
        fetchJson('/content/teams.json'),
        fetchJson('/content/fixtures.json'),
        fetchJson('/content/newsData.json'),
        fetchJson('/content/galleryData.json'),
        fetchJson('/content/staffData.json'),
        fetchJson('/content/missionVision.json'),
      ]);

      // Ensure homepage sections have correct IDs for rendering
      if (homepage.sections) {
        homepage.sections = homepage.sections.map((s: any) => {
          if (s.name.toLowerCase().includes('fikstür') || s.name.toLowerCase().includes('maç')) return { ...s, id: 'matches' };
          if (s.name.toLowerCase().includes('haber')) return { ...s, id: 'news' };
          if (s.name.toLowerCase().includes('galeri')) return { ...s, id: 'gallery' };
          return s;
        });
      }

      const initialData: CMSData = {
        siteSettings: settings,
        homePageHero: homepage,
        teamData: teams.teams || [],
        fixtures: fixtures.fixtures || [],
        newsData: news.articles || [],
        galleryData: gallery.images || [],
        staffData: staff.members || [],
        missionVision: missionVision,
      };

      await migrateDataToFirestore(initialData);
      showMessage('success', 'Veriler başarıyla aktarıldı. Sayfayı yenileyebilirsiniz.');
    } catch (err) {
      console.error('Migration failed:', err);
      showMessage('error', `Aktarım hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFileUpload = async (file: File, path: string) => {
    // Helper to convert file to base64
    const convertToBase64 = (f: File | Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    if (!storage) {
      console.error('[STORAGE] Storage instance is not initialized');
      return await convertToBase64(file);
    }

    // Helper to compress image
    const compressImage = (f: File): Promise<Blob | File> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], f.name, { type: 'image/jpeg' }));
              } else {
                resolve(f);
              }
            }, 'image/jpeg', 0.7);
          };
        };
      });
    };

    try {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Lütfen geçerli bir görsel dosyası seçin.');
        return '';
      }

      // Compress before upload
      console.log(`[STORAGE] Original size: ${file.size} bytes`);
      showMessage('info', 'Görsel optimize ediliyor...');
      const processedFile = await compressImage(file);
      const finalFile = processedFile instanceof File ? processedFile : new File([processedFile], file.name, { type: 'image/jpeg' });
      console.log(`[STORAGE] Compressed size: ${finalFile.size} bytes`);

      if (finalFile.size > 5 * 1024 * 1024) { // 5MB limit after compression
        showMessage('error', 'Görsel çok büyük. Lütfen daha küçük bir dosya seçin.');
        return '';
      }

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      console.log(`[STORAGE] Attempting upload: ${file.name} to ${path}`);

      // Use a Promise with timeout for the upload
      const uploadPromise = uploadBytes(storageRef, finalFile);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 10000) // Increased to 10s
      );

      try {
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        console.log('[STORAGE] Upload successful:', uploadResult.metadata.fullPath);
        const url = await getDownloadURL(storageRef);
        return url;
      } catch (uploadErr: any) {
        console.warn('[STORAGE] Storage upload failed or timed out, trying Base64 fallback:', uploadErr.message);
        
        // Fallback to Base64 if file is small enough (< 600KB)
        // Firestore limit is 1MB, Base64 is ~1.37x larger, so 600KB -> ~822KB
        if (finalFile.size < 600 * 1024) {
          console.log('[STORAGE] File is small enough for Base64 fallback');
          return await convertToBase64(finalFile);
        } else {
          throw uploadErr; // Re-throw if too large for fallback
        }
      }
    } catch (err) {
      console.error('[STORAGE] All upload methods failed:', err);
      let errorMessage = 'Görsel yüklenemedi.';
      if (err instanceof Error) {
        if (err.message === 'timeout') {
          errorMessage = 'Yükleme zaman aşımına uğradı. Alternatif yöntem deneniyor...';
          if (file.size < 800 * 1024) {
             return await convertToBase64(file);
          }
        } else if (err.message.includes('storage/unauthorized')) {
          errorMessage = 'Yükleme yetkiniz yok. Lütfen oturumunuzu kontrol edin.';
        }
      }
      showMessage('error', errorMessage);
      return '';
    }
  };

  const ImageUpload: React.FC<{ onUpload: (url: string) => void, currentUrl?: string, path: string, label?: string }> = ({ onUpload, currentUrl, path, label }) => {
    const [uploading, setUploading] = useState(false);
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="flex items-center gap-4">
          {currentUrl && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
              <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-[10px] text-gray-500">Yükleniyor...</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500">Görsel Seç</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploading(true);
                  try {
                    const url = await handleFileUpload(file, path);
                    if (url) {
                      onUpload(url);
                    }
                  } catch (err) {
                    console.error("Upload error in component:", err);
                  } finally {
                    setUploading(false);
                  }
                }
              }} 
            />
          </label>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">Yönetim Paneli</h1>
          <p className="text-gray-600 mb-8 text-center">Sitenizi yönetmek için lütfen e-posta ve şifrenizle giriş yapın.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[var(--primary-color)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user.email?.toLowerCase() === 'ihsandurgut1@gmail.com' || admins.some(a => a.uid === user.uid);
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Yetkisiz Erişim</h1>
          <p className="text-gray-600 mb-8">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <button onClick={handleLogout} className="text-blue-600 hover:underline">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  if (!cmsData) return <div>Veriler yüklenemedi.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <div className="p-6 border-bottom">
          <h2 className="text-xl font-bold text-[var(--primary-color)]">ÇANGÜCÜ SK</h2>
          <p className="text-xs text-gray-500">Yönetim Paneli</p>
        </div>
        <nav className="p-4 space-y-2">
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20}/>} label="Genel Ayarlar" />
          <TabButton active={activeTab === 'homepage'} onClick={() => setActiveTab('homepage')} icon={<Layout size={20}/>} label="Ana Sayfa" />
          <TabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20}/>} label="Haberler" />
          <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={20}/>} label="Takımlar" />
          <TabButton active={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} icon={<Calendar size={20}/>} label="Fikstürler" />
          <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={20}/>} label="Galeri" />
          <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Users size={20}/>} label="Personel" />
          <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Target size={20}/>} label="Misyon & Vizyon" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheck size={20}/>} label="Yetkili Yönetimi" />
          
          <div className="pt-4 mt-4 border-t">
            <button 
              onClick={handleMigration}
              disabled={isMigrating}
              className="flex items-center gap-3 w-full p-3 rounded-xl transition-all text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              <Database size={20}/>
              <span className="font-medium">{isMigrating ? 'Aktarılıyor...' : 'Verileri İçe Aktar'}</span>
            </button>
            <p className="text-[10px] text-gray-400 px-3 mt-1">JSON dosyalarındaki verileri veritabanına taşır.</p>
          </div>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full p-2 rounded-lg transition-all">
            <LogOut size={20}/> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden sticky top-0 bg-white shadow-sm z-50 overflow-x-auto whitespace-nowrap p-3 border-b scrollbar-hide">
          <div className="flex gap-2">
            <MobileTabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18}/>} label="Genel" />
            <MobileTabButton active={activeTab === 'homepage'} onClick={() => setActiveTab('homepage')} icon={<Layout size={18}/>} label="Ana Sayfa" />
            <MobileTabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={18}/>} label="Haberler" />
            <MobileTabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={18}/>} label="Takımlar" />
            <MobileTabButton active={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} icon={<Calendar size={18}/>} label="Fikstürler" />
            <MobileTabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={18}/>} label="Galeri" />
            <MobileTabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Users size={18}/>} label="Personel" />
            <MobileTabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Target size={18}/>} label="Misyon" />
            <MobileTabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheck size={18}/>} label="Yetkililer" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium">
              <LogOut size={18}/> Çıkış
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {message && (
            <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 animate-bounce ${
              message.type === 'success' ? 'bg-green-500' : 
              message.type === 'info' ? 'bg-blue-500' : 'bg-red-500'
            } text-white`}>
              {message.text}
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            {activeTab === 'settings' && <SettingsTab data={cmsData.siteSettings} onSave={async (d) => { try { await updateSettings(d); showMessage('success', 'Ayarlar kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'homepage' && <HomepageTab data={cmsData.homePageHero} onSave={async (d) => { try { await updateHomepage(d); showMessage('success', 'Ana sayfa güncellendi'); } catch(e) { showMessage('error', 'Güncellenemedi'); } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'news' && <NewsTab data={cmsData.newsData} onSave={async (d, id) => { try { await saveNewsArticle(d, id); showMessage('success', 'Haber kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { try { await deleteNewsArticle(id); showMessage('success', 'Haber silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'teams' && <TeamsTab data={cmsData.teamData} onSave={async (d, id) => { try { await saveTeam(d, id); showMessage('success', 'Takım kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { try { await deleteTeam(id); showMessage('success', 'Takım silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'fixtures' && <FixturesTab data={cmsData.fixtures} teams={cmsData.teamData} onSave={async (d) => { try { await saveFixture(d); showMessage('success', 'Fikstür kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} />}
            {activeTab === 'gallery' && <GalleryTab data={cmsData.galleryData} onSave={async (d) => { try { await saveGalleryImage(d); showMessage('success', 'Görsel eklendi'); } catch(e) { showMessage('error', 'Eklenemedi'); } }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { try { await deleteGalleryImage(id); showMessage('success', 'Görsel silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'staff' && <StaffTab data={cmsData.staffData} onSave={async (d, id) => { try { await saveStaffMember(d, id); showMessage('success', 'Personel kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { try { await deleteStaffMember(id); showMessage('success', 'Personel silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } } }} onUpload={handleFileUpload} ImageUpload={ImageUpload} />}
            {activeTab === 'about' && <AboutTab data={cmsData.missionVision} onSave={async (d) => { try { await updateMissionVision(d); showMessage('success', 'Kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); } }} />}
            {activeTab === 'users' && <UsersTab admins={admins} currentUser={user} onAdd={async (e, u) => { try { await addAdmin(e, u); showMessage('success', 'Yetkili eklendi'); } catch(e) { showMessage('error', 'Eklenemedi'); } }} onRemove={async (u) => { if(confirm('Bu yetkiliyi kaldırmak istediğinize emin misiniz?')) { try { await removeAdmin(u); showMessage('success', 'Yetkili kaldırıldı'); } catch(e) { showMessage('error', 'Kaldırılamadı'); } } }} />}
          </div>
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${active ? 'bg-[var(--primary-color)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const MobileTabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap text-sm font-medium ${active ? 'bg-[var(--primary-color)] text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- Tab Components (Simplified for brevity, but functional) ---

const SettingsTab: React.FC<{ data: SiteSettings, onSave: (d: SiteSettings) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onUpload, ImageUpload }) => {
  const [form, setForm] = useState(data || {
    address: '',
    email: '',
    phone: '',
    logo: '',
    socialMedia: { facebook: '', instagram: '', twitter: '', youtube: '' },
    maintenanceMode: false,
    navigation: [],
    globalStyles: { primaryColor: '#f27d26', secondaryColor: '#1a1a1a', fontFamily: 'Inter', baseFontSize: '16px' }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  
  if (!data && !form) return <div>Yükleniyor...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Genel Ayarlar</h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto rounded-xl text-white font-bold transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--primary-color)] hover:scale-105 shadow-lg'}`}
        >
          <Save size={20} />
          {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b">
          <ImageUpload 
            label="Kulüp Logosu"
            currentUrl={form.logo}
            path="settings"
            onUpload={(url: string) => {
              const updated = { ...form, logo: url };
              setForm(updated);
              onSave(updated); // Immediate save for logo
            }}
          />
          <p className="text-xs text-gray-400 mt-1">Önerilen: 200x200px, PNG veya SVG</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adresi</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-bold">Sosyal Medya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(form.socialMedia || {}).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
                <input 
                  type="text" 
                  value={value} 
                  onChange={e => setForm({...form, socialMedia: {...form.socialMedia, [key]: e.target.value}})} 
                  className="w-full p-2 border rounded-lg" 
                  placeholder="URL"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
          <input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm({...form, maintenanceMode: e.target.checked})} id="maintenance" className="w-4 h-4 text-orange-600 rounded" />
          <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Bakım Modu (Siteyi ziyaretçilere kapatır)</label>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Navigasyon Menüsü</h3>
            <button 
              onClick={() => setForm({...form, navigation: [...(form.navigation || []), { name: 'Yeni Menü', path: '/', items: [] }]})}
              className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-100"
            >
              + Menü Ekle
            </button>
          </div>
          <div className="space-y-3">
            {(form.navigation || []).map((nav, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-grow">
                    <input 
                      type="text" 
                      value={nav.name} 
                      onChange={e => {
                        const newNav = [...form.navigation];
                        newNav[idx].name = e.target.value;
                        setForm({...form, navigation: newNav});
                      }}
                      className="bg-white p-1 border rounded-lg text-sm font-medium w-1/3"
                      placeholder="Menü Adı"
                    />
                    <input 
                      type="text" 
                      value={nav.path} 
                      onChange={e => {
                        const newNav = [...form.navigation];
                        newNav[idx].path = e.target.value;
                        setForm({...form, navigation: newNav});
                      }}
                      className="bg-white p-1 border rounded-lg text-sm w-1/3"
                      placeholder="Yol (Örn: /haberler)"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const newNav = [...form.navigation];
                        newNav[idx].items = [...(newNav[idx].items || []), { name: 'Alt Menü', path: '/' }];
                        setForm({...form, navigation: newNav});
                      }}
                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      + Alt Menü
                    </button>
                    <button 
                      onClick={() => {
                        const newNav = form.navigation.filter((_, i) => i !== idx);
                        setForm({...form, navigation: newNav});
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Sub-items */}
                <div className="pl-8 space-y-2">
                  {(nav.items || []).map((sub, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={sub.name} 
                        onChange={e => {
                          const newNav = [...form.navigation];
                          newNav[idx].items![sIdx].name = e.target.value;
                          setForm({...form, navigation: newNav});
                        }}
                        className="bg-white p-1 border rounded-lg text-xs font-medium w-1/3"
                        placeholder="Alt Menü Adı"
                      />
                      <input 
                        type="text" 
                        value={sub.path} 
                        onChange={e => {
                          const newNav = [...form.navigation];
                          newNav[idx].items![sIdx].path = e.target.value;
                          setForm({...form, navigation: newNav});
                        }}
                        className="bg-white p-1 border rounded-lg text-xs w-1/3"
                        placeholder="Yol"
                      />
                      <button 
                        onClick={() => {
                          const newNav = [...form.navigation];
                          newNav[idx].items = newNav[idx].items!.filter((_, i) => i !== sIdx);
                          setForm({...form, navigation: newNav});
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(form)} className="bg-[var(--primary-color)] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:opacity-90 transition-all">
          <Save size={20}/> Ayarları Kaydet
        </button>
      </div>
    </div>
  );
};

const NewsTab: React.FC<{ data: NewsArticle[], onSave: (d: Partial<NewsArticle>, id?: string) => void, onDelete: (id: string) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onDelete, onUpload, ImageUpload }) => {
  const [editing, setEditing] = useState<Partial<NewsArticle> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const newsList = data || [];

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await onSave(editing, editing.id?.toString());
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Haberler</h2>
        <button onClick={() => setEditing({ title: '', summary: '', content: '', imageUrl: '', date: new Date().toISOString() })} className="bg-[var(--primary-color)] text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 shadow-md">
          <Plus size={18}/> Yeni Haber
        </button>
      </div>

      {editing && (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-bold">{editing.id ? 'Haberi Düzenle' : 'Yeni Haber'}</h3>
          <input type="text" placeholder="Başlık" value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="Özet" value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="İçerik" value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} className="w-full p-2 border rounded-lg h-32" />
          
          <ImageUpload 
            label="Haber Görseli"
            currentUrl={editing.imageUrl}
            path="news"
            onUpload={(url: string) => setEditing({ ...editing, imageUrl: url })}
          />

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {newsList.map(article => (
          <div key={article.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <h4 className="font-bold">{article.title}</h4>
              <p className="text-sm text-gray-500">{new Date(article.date).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(article)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg">Düzenle</button>
              <button onClick={() => onDelete(article.id.toString())} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Other tabs follow similar pattern... I'll implement a few more key ones ---

const GalleryTab: React.FC<{ data: GalleryItem[], onSave: (d: Partial<GalleryItem>) => void, onDelete: (id: string) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onDelete, onUpload, ImageUpload }) => {
  const [newImage, setNewImage] = useState({ imageUrl: '', title: '' });
  const [isSaving, setIsSaving] = useState(false);
  const galleryList = data || [];

  const handleSave = async () => {
    if (!newImage.imageUrl) return;
    setIsSaving(true);
    try {
      await onSave(newImage);
      setNewImage({ imageUrl: '', title: '' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Galeri</h2>
        <button 
          onClick={handleSave} 
          disabled={!newImage.imageUrl || isSaving}
          className="bg-[var(--primary-color)] text-white px-8 py-3 w-full sm:w-auto rounded-xl font-bold disabled:opacity-50 shadow-lg transition-all hover:scale-105"
        >
          {isSaving ? 'Ekleniyor...' : 'Galeriye Ekle'}
        </button>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUpload 
            label="Görsel Yükle"
            currentUrl={newImage.imageUrl}
            path="gallery"
            onUpload={(url: string) => setNewImage({ ...newImage, imageUrl: url })}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Başlık (Opsiyonel)</label>
            <input type="text" placeholder="Görsel Başlığı" value={newImage.title} onChange={e => setNewImage({...newImage, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryList.map(img => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100">
            <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
              <button onClick={() => onDelete(img.id.toString())} className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition-transform">
                <Trash2 size={18}/>
              </button>
            </div>
            {img.title && <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10px] truncate">{img.title}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const HomepageTab: React.FC<{ data: HomePageHero, onSave: (d: HomePageHero) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onUpload, ImageUpload }) => {
  const [form, setForm] = useState(data || {
    heroImage: '',
    heroTitle: '',
    heroSubtitle: '',
    sections: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  
  if (!data && !form) return <div>Yükleniyor...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newSections = [...form.sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    
    // Swap sections
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
    
    // Update order property
    const updatedSections = newSections.map((s, i) => ({ ...s, order: i }));
    
    setForm({ ...form, sections: updatedSections });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Ana Sayfa Ayarları</h2>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[var(--primary-color)] text-white px-8 py-3 w-full sm:w-auto rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Güncelleniyor...' : 'Ana Sayfayı Güncelle'}
        </button>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Hero (Giriş) Bölümü</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Başlık</label>
              <input type="text" value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Alt Başlık</label>
              <input type="text" value={form.heroSubtitle} onChange={e => setForm({...form, heroSubtitle: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <ImageUpload 
            label="Hero Arka Plan Görseli"
            currentUrl={form.heroImage}
            path="homepage"
            onUpload={(url: string) => setForm({ ...form, heroImage: url })}
          />
        </div>

        <div className="space-y-4 pt-6 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Bölüm Yönetimi</h3>
            <button 
              onClick={() => setForm({...form, sections: [...form.sections, { id: Date.now().toString(), name: 'Yeni Bölüm', visible: true, order: form.sections.length }]})}
              className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-100"
            >
              + Bölüm Ekle
            </button>
          </div>
          <div className="space-y-3">
            {(form.sections || []).map((sec, idx) => (
              <div key={sec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveSection(idx, 'up')} 
                      disabled={idx === 0}
                      className={`hover:text-orange-600 transition-colors ${idx === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400'}`}
                    >
                      <ChevronUp size={20} />
                    </button>
                    <button 
                      onClick={() => moveSection(idx, 'down')} 
                      disabled={idx === form.sections.length - 1}
                      className={`hover:text-orange-600 transition-colors ${idx === form.sections.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400'}`}
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={sec.name} 
                    onChange={e => {
                      const newSecs = [...form.sections];
                      newSecs[idx].name = e.target.value;
                      setForm({...form, sections: newSecs});
                    }}
                    className="bg-transparent font-medium border-none focus:ring-0 p-0 text-lg"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-sm text-gray-500 group-hover:text-gray-700">{sec.visible ? 'Görünür' : 'Gizli'}</span>
                    <div 
                      onClick={() => {
                        const newSecs = [...form.sections];
                        newSecs[idx].visible = !sec.visible;
                        setForm({...form, sections: newSecs});
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${sec.visible ? 'bg-orange-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sec.visible ? 'left-7' : 'left-1'}`} />
                    </div>
                  </label>
                  <button 
                    onClick={() => {
                      if (confirm('Bu bölümü silmek istediğinize emin misiniz?')) {
                        const newSecs = form.sections.filter((_, i) => i !== idx);
                        setForm({...form, sections: newSecs});
                      }
                    }}
                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[var(--primary-color)] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Güncelleniyor...' : 'Ana Sayfayı Güncelle'}
        </button>
      </div>
    </div>
  );
};

const TeamsTab: React.FC<{ data: Team[], onSave: (d: Partial<Team>, id?: string) => void, onDelete: (id: string) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onDelete, onUpload, ImageUpload }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const teams = data || [];

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await onSave(editing, editing.id?.toString());
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Takım Yönetimi</h2>
        <button onClick={() => setEditing({ name: '', slug: '', coach: { name: '', role: '' }, players: [], heroImage: '' })} className="bg-[var(--primary-color)] text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 shadow-md">
          <Plus size={18}/> Yeni Takım
        </button>
      </div>

      {editing && (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-bold">{editing.id ? 'Takımı Düzenle' : 'Yeni Takım'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Takım Adı (Örn: U19 Takımı)" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full p-2 border rounded-lg" />
            <input type="text" placeholder="Slug (Örn: u19)" value={editing.slug} onChange={e => setEditing({...editing, slug: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Teknik Sorumlu Adı" value={editing.coach?.name} onChange={e => setEditing({...editing, coach: { ...editing.coach, name: e.target.value }})} className="w-full p-2 border rounded-lg" />
            <input type="text" placeholder="Teknik Sorumlu Görevi" value={editing.coach?.role} onChange={e => setEditing({...editing, coach: { ...editing.coach, role: e.target.value }})} className="w-full p-2 border rounded-lg" />
          </div>
          
          <ImageUpload 
            label="Takım Fotoğrafı"
            currentUrl={editing.heroImage}
            path="teams"
            onUpload={(url: string) => setEditing({ ...editing, heroImage: url })}
          />

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Oyuncular</label>
              <button 
                onClick={() => setEditing({...editing, players: [...(editing.players || []), { id: Date.now(), name: '', position: '', number: 0, imageUrl: '' }]})}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
              >
                + Oyuncu Ekle
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {editing.players?.map((player: any, idx: number) => (
                <div key={player.id || idx} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="Ad Soyad" 
                      value={player.name} 
                      onChange={e => {
                        const newPlayers = [...editing.players];
                        newPlayers[idx].name = e.target.value;
                        setEditing({...editing, players: newPlayers});
                      }} 
                      className="p-2 border rounded-lg text-sm" 
                    />
                    <input 
                      type="text" 
                      placeholder="Mevki" 
                      value={player.position} 
                      onChange={e => {
                        const newPlayers = [...editing.players];
                        newPlayers[idx].position = e.target.value;
                        setEditing({...editing, players: newPlayers});
                      }} 
                      className="p-2 border rounded-lg text-sm" 
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="No" 
                        value={player.number} 
                        onChange={e => {
                          const newPlayers = [...editing.players];
                          newPlayers[idx].number = parseInt(e.target.value) || 0;
                          setEditing({...editing, players: newPlayers});
                        }} 
                        className="p-2 border rounded-lg text-sm w-full" 
                      />
                      <button 
                        onClick={() => {
                          const newPlayers = editing.players.filter((_: any, i: number) => i !== idx);
                          setEditing({...editing, players: newPlayers});
                        }}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <ImageUpload 
                    label="Oyuncu Fotoğrafı"
                    currentUrl={player.imageUrl}
                    path="players"
                    onUpload={(url: string) => {
                      const newPlayers = [...editing.players];
                      newPlayers[idx].imageUrl = url;
                      setEditing({...editing, players: newPlayers});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                <img src={team.heroImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold">{team.name}</h4>
                <p className="text-xs text-gray-500">{team.coach?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(team)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg"><Settings size={18}/></button>
              <button onClick={() => onDelete(team.id.toString())} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FixturesTab: React.FC<{ data: Fixture[], teams: Team[], onSave: (d: Fixture) => void }> = ({ data, teams, onSave }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fixtures = data || [];

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await onSave(editing as Fixture);
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fikstürler</h2>
        <button onClick={() => setEditing({ teamName: '', teamSlug: '', matches: [] })} className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18}/> Yeni Fikstür
        </button>
      </div>

      {editing && (
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <select 
            value={editing.teamSlug} 
            onChange={e => {
              const team = teams.find(t => t.slug === e.target.value);
              setEditing({...editing, teamSlug: e.target.value, teamName: team?.name || ''});
            }}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Takım Seçin</option>
            {teams.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
          </select>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold">Maçlar</h4>
              <button 
                onClick={() => setEditing({...editing, matches: [...(editing.matches || []), { date: '', opponent: '', score: '', location: 'Ev' }]})}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
              >
                + Maç Ekle
              </button>
            </div>
            {editing.matches?.map((match: any, idx: number) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                <input type="date" value={match.date} onChange={e => {
                  const newMatches = [...editing.matches!];
                  newMatches[idx].date = e.target.value;
                  setEditing({...editing, matches: newMatches});
                }} className="text-xs p-1 border rounded" />
                <input type="text" placeholder="Rakip" value={match.opponent} onChange={e => {
                  const newMatches = [...editing.matches!];
                  newMatches[idx].opponent = e.target.value;
                  setEditing({...editing, matches: newMatches});
                }} className="text-xs p-1 border rounded" />
                <input type="text" placeholder="Skor" value={match.score} onChange={e => {
                  const newMatches = [...editing.matches!];
                  newMatches[idx].score = e.target.value;
                  setEditing({...editing, matches: newMatches});
                }} className="text-xs p-1 border rounded" />
                <select value={match.location} onChange={e => {
                  const newMatches = [...editing.matches!];
                  newMatches[idx].location = e.target.value as any;
                  setEditing({...editing, matches: newMatches});
                }} className="text-xs p-1 border rounded">
                  <option value="Ev">Ev</option>
                  <option value="Deplasman">Deplasman</option>
                </select>
                <button onClick={() => {
                  const newMatches = editing.matches!.filter((_: any, i: number) => i !== idx);
                  setEditing({...editing, matches: newMatches});
                }} className="text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {fixtures.map(fix => (
          <div key={fix.teamSlug} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <h4 className="font-bold">{fix.teamName}</h4>
            <div className="flex gap-2">
              <button onClick={() => setEditing(fix)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg">Düzenle</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StaffTab: React.FC<{ data: StaffMember[], onSave: (d: Partial<StaffMember>, id?: string) => void, onDelete: (id: string) => void, onUpload: (f: File, p: string) => Promise<string>, ImageUpload: any }> = ({ data, onSave, onDelete, onUpload, ImageUpload }) => {
  const [editing, setEditing] = useState<Partial<StaffMember> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const staff = data || [];

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await onSave(editing, editing.id?.toString());
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Personel Yönetimi</h2>
        <button onClick={() => setEditing({ name: '', role: '', imageUrl: '' })} className="bg-[var(--primary-color)] text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 shadow-md">
          <Plus size={18}/> Yeni Personel
        </button>
      </div>

      {editing && (
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <input type="text" placeholder="Ad Soyad" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input type="text" placeholder="Görev" value={editing.role} onChange={e => setEditing({...editing, role: e.target.value})} className="w-full p-2 border rounded-lg" />
          
          <ImageUpload 
            label="Fotoğraf"
            currentUrl={editing.imageUrl}
            path="staff"
            onUpload={(url: string) => setEditing({ ...editing, imageUrl: url })}
          />

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staff.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm text-center">
            <img src={member.imageUrl} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border" />
            <h4 className="font-bold">{member.name}</h4>
            <p className="text-xs text-gray-500 mb-3">{member.role}</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setEditing(member)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Settings size={16}/></button>
              <button onClick={() => onDelete(member.id.toString())} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutTab: React.FC<{ data: MissionVision, onSave: (d: MissionVision) => void }> = ({ data, onSave }) => {
  const [form, setForm] = useState(data || { mission: '', vision: '' });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Misyon & Vizyon</h2>
        <button onClick={() => onSave(form)} className="bg-[var(--primary-color)] text-white px-8 py-3 w-full sm:w-auto rounded-xl font-bold shadow-lg transition-all hover:scale-105">Kaydet</button>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Misyonumuz</label>
          <textarea value={form.mission} onChange={e => setForm({...form, mission: e.target.value})} className="w-full p-3 border rounded-lg h-40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vizyonumuz</label>
          <textarea value={form.vision} onChange={e => setForm({...form, vision: e.target.value})} className="w-full p-3 border rounded-lg h-40" />
        </div>
      </div>
    </div>
  );
};

const UsersTab: React.FC<{ admins: any[], currentUser: any, onAdd: (email: string, uid: string) => void, onRemove: (uid: string) => void }> = ({ admins, currentUser, onAdd, onRemove }) => {
  const [newAdmin, setNewAdmin] = useState({ email: '', uid: '' });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopyalandı: ' + text);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Yetkili Yönetimi</h2>
      
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="font-bold text-blue-900">Mevcut Bilgileriniz</h3>
          <p className="text-sm text-blue-700 mb-2">Başka bir yönetici sizi eklemek isterse bu bilgileri kullanabilir:</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-mono bg-white/50 p-1 rounded">
              <span className="text-gray-500">Email:</span> {currentUser.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-white/50 p-1 rounded group">
              <span className="text-gray-500">UID:</span> {currentUser.uid}
              <button onClick={() => copyToClipboard(currentUser.uid)} className="text-blue-600 hover:text-blue-800">
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold">Yeni Yetkili Ekle</h3>
        <p className="text-sm text-gray-500">Yeni yetkilinin önce siteye giriş yapıp size UID bilgisini vermesi gerekir.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="email" 
            placeholder="E-posta Adresi" 
            value={newAdmin.email} 
            onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
            className="w-full p-2 border rounded-lg" 
          />
          <input 
            type="text" 
            placeholder="Kullanıcı UID" 
            value={newAdmin.uid} 
            onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})} 
            className="w-full p-2 border rounded-lg" 
          />
        </div>
        <button 
          onClick={() => { if(newAdmin.email && newAdmin.uid) { onAdd(newAdmin.email, newAdmin.uid); setNewAdmin({ email: '', uid: '' }); } }} 
          className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18}/> Yetkili Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">E-posta</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">UID</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.map(admin => (
                <tr key={admin.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{admin.email}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{admin.uid}</td>
                  <td className="px-6 py-4 text-right">
                    {admin.uid !== currentUser.uid && (
                      <button onClick={() => onRemove(admin.uid)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {/* Show bootstrap admin if not in list */}
              {!admins.find(a => a.email === 'ihsandurgut1@gmail.com') && (
                <tr className="bg-gray-50/50 italic">
                  <td className="px-6 py-4 text-sm text-gray-400">ihsandurgut1@gmail.com (Sistem Yöneticisi)</td>
                  <td className="px-6 py-4 text-xs text-gray-400">-</td>
                  <td className="px-6 py-4 text-right"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
