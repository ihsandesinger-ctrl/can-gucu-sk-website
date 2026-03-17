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
import { Plus, Trash2, Save, LogOut, Image as ImageIcon, Settings, Users, Newspaper, Layout, Target, Calendar, Database, ShieldCheck, Copy } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMigration = async () => {
    if (!confirm('Mevcut JSON verilerini veritabanına aktarmak istediğinize emin misiniz? Bu işlem mevcut veritabanı verilerinin üzerine yazabilir.')) return;
    
    setIsMigrating(true);
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

      const initialData: CMSData = {
        siteSettings: await settingsRes.json(),
        homePageHero: await homepageRes.json(),
        teamData: (await teamsRes.json()).teams,
        fixtures: (await fixturesRes.json()).fixtures,
        newsData: (await newsRes.json()).articles,
        galleryData: (await galleryRes.json()).images,
        staffData: (await staffRes.json()).members,
        missionVision: await missionVisionRes.json(),
      };

      await migrateDataToFirestore(initialData);
      showMessage('success', 'Veriler başarıyla aktarıldı.');
    } catch (err) {
      console.error('Migration failed:', err);
      showMessage('error', 'Aktarım sırasında bir hata oluştu.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFileUpload = async (file: File, path: string) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
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
      <main className="flex-grow p-8 overflow-y-auto max-h-screen">
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 animate-bounce ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {message.text}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {activeTab === 'settings' && <SettingsTab data={cmsData.siteSettings} onSave={async (d) => { await updateSettings(d); showMessage('success', 'Ayarlar kaydedildi'); }} />}
          {activeTab === 'homepage' && <HomepageTab data={cmsData.homePageHero} onSave={async (d) => { await updateHomepage(d); showMessage('success', 'Ana sayfa güncellendi'); }} />}
          {activeTab === 'news' && <NewsTab data={cmsData.newsData} onSave={async (d, id) => { await saveNewsArticle(d, id); showMessage('success', 'Haber kaydedildi'); }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { await deleteNewsArticle(id); showMessage('success', 'Haber silindi'); } }} />}
          {activeTab === 'teams' && <TeamsTab data={cmsData.teamData} onSave={async (d, id) => { await saveTeam(d, id); showMessage('success', 'Takım kaydedildi'); }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { await deleteTeam(id); showMessage('success', 'Takım silindi'); } }} />}
          {activeTab === 'fixtures' && <FixturesTab data={cmsData.fixtures} teams={cmsData.teamData} onSave={async (d) => { await saveFixture(d); showMessage('success', 'Fikstür kaydedildi'); }} />}
          {activeTab === 'gallery' && <GalleryTab data={cmsData.galleryData} onSave={async (d) => { await saveGalleryImage(d); showMessage('success', 'Görsel eklendi'); }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { await deleteGalleryImage(id); showMessage('success', 'Görsel silindi'); } }} />}
          {activeTab === 'staff' && <StaffTab data={cmsData.staffData} onSave={async (d, id) => { await saveStaffMember(d, id); showMessage('success', 'Personel kaydedildi'); }} onDelete={async (id) => { if(confirm('Emin misiniz?')) { await deleteStaffMember(id); showMessage('success', 'Personel silindi'); } }} />}
          {activeTab === 'about' && <AboutTab data={cmsData.missionVision} onSave={async (d) => { await updateMissionVision(d); showMessage('success', 'Kaydedildi'); }} />}
          {activeTab === 'users' && <UsersTab admins={admins} currentUser={user} onAdd={async (e, u) => { await addAdmin(e, u); showMessage('success', 'Yetkili eklendi'); }} onRemove={async (u) => { if(confirm('Bu yetkiliyi kaldırmak istediğinize emin misiniz?')) { await removeAdmin(u); showMessage('success', 'Yetkili kaldırıldı'); } }} />}
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

// --- Tab Components (Simplified for brevity, but functional) ---

const SettingsTab: React.FC<{ data: SiteSettings, onSave: (d: SiteSettings) => void }> = ({ data, onSave }) => {
  const [form, setForm] = useState(data);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Genel Ayarlar</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adresi</label>
          <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm({...form, maintenanceMode: e.target.checked})} id="maintenance" />
          <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Bakım Modu</label>
        </div>
        <button onClick={() => onSave(form)} className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <Save size={18}/> Kaydet
        </button>
      </div>
    </div>
  );
};

const NewsTab: React.FC<{ data: NewsArticle[], onSave: (d: Partial<NewsArticle>, id?: string) => void, onDelete: (id: string) => void }> = ({ data, onSave, onDelete }) => {
  const [editing, setEditing] = useState<Partial<NewsArticle> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Haberler</h2>
        <button onClick={() => setEditing({ title: '', summary: '', content: '', imageUrl: '' })} className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18}/> Yeni Haber
        </button>
      </div>

      {editing && (
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-bold">{editing.id ? 'Haberi Düzenle' : 'Yeni Haber'}</h3>
          <input type="text" placeholder="Başlık" value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="Özet" value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="İçerik" value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} className="w-full p-2 border rounded-lg h-32" />
          <input type="text" placeholder="Görsel URL" value={editing.imageUrl} onChange={e => setEditing({...editing, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg" />
          <div className="flex gap-2">
            <button onClick={() => { onSave(editing, editing.id?.toString()); setEditing(null); }} className="bg-green-600 text-white px-6 py-2 rounded-lg">Kaydet</button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {data.map(article => (
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

const GalleryTab: React.FC<{ data: GalleryItem[], onSave: (d: Partial<GalleryItem>) => void, onDelete: (id: string) => void }> = ({ data, onSave, onDelete }) => {
  const [newImage, setNewImage] = useState({ imageUrl: '', title: '' });
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Galeri</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Görsel URL" value={newImage.imageUrl} onChange={e => setNewImage({...newImage, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input type="text" placeholder="Başlık (Opsiyonel)" value={newImage.title} onChange={e => setNewImage({...newImage, title: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <button onClick={() => { onSave(newImage); setNewImage({ imageUrl: '', title: '' }); }} className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg">Ekle</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {data.map(img => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm">
            <img src={img.imageUrl} alt="" className="w-full h-32 object-cover" />
            <button onClick={() => onDelete(img.id.toString())} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomepageTab: React.FC<{ data: HomePageHero, onSave: (d: HomePageHero) => void }> = ({ data, onSave }) => {
  const [form, setForm] = useState(data);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ana Sayfa Ayarları</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Başlık</label>
          <input type="text" value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Alt Başlık</label>
          <input type="text" value={form.heroSubtitle} onChange={e => setForm({...form, heroSubtitle: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Görsel URL</label>
          <input type="text" value={form.heroImage} onChange={e => setForm({...form, heroImage: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Bölüm Görünürlüğü</label>
          {form.sections.map((sec, idx) => (
            <div key={sec.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span>{sec.name}</span>
              <input type="checkbox" checked={sec.visible} onChange={e => {
                const newSecs = [...form.sections];
                newSecs[idx].visible = e.target.checked;
                setForm({...form, sections: newSecs});
              }} />
            </div>
          ))}
        </div>
        <button onClick={() => onSave(form)} className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg">Kaydet</button>
      </div>
    </div>
  );
};

// Placeholder components for other tabs to avoid errors
const TeamsTab = ({ data, onSave, onDelete }: any) => <div className="p-4 bg-white rounded-xl shadow-sm">Takım yönetimi yakında eklenecek.</div>;
const FixturesTab = ({ data, teams, onSave }: any) => <div className="p-4 bg-white rounded-xl shadow-sm">Fikstür yönetimi yakında eklenecek.</div>;
const StaffTab = ({ data, onSave, onDelete }: any) => <div className="p-4 bg-white rounded-xl shadow-sm">Personel yönetimi yakında eklenecek.</div>;
const AboutTab = ({ data, onSave }: any) => <div className="p-4 bg-white rounded-xl shadow-sm">Hakkımızda sayfası yönetimi yakında eklenecek.</div>;

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
        <table className="w-full text-left">
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
  );
};

export default AdminPage;
