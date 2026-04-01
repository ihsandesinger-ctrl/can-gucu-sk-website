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
  savePage,
  deletePage,
  deletePlayer,
  deletePagePlayer,
  updateOrder,
  saveFixture,
  migrateDataToFirestore,
  subscribeToAdmins,
  addAdmin,
  removeAdmin
} from '../firebaseService';
import type { CMSData, NewsArticle, Team, GalleryItem, StaffMember, SiteSettings, HomePageHero, MissionVision, Fixture, DynamicPage } from '../types';
import { subscribeToCMSData } from '../firebaseService';
import { Plus, Trash2, Save, LogOut, Image as ImageIcon, Settings, Users, Newspaper, Layout, Target, Calendar, Database, ShieldCheck, Copy, ChevronUp, ChevronDown, FileText, User, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';

import ImageCropper from '../components/ImageCropper';

// Helper to convert file to base64
const convertToBase64 = (f: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to compress image
const compressImage = (f: File, isLogo: boolean = false, isHero: boolean = false, isSmall: boolean = false): Promise<Blob | File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      console.warn('[STORAGE] Compression timed out, using original file');
      resolve(f);
    }, 5000); // Reduced from 8s to 5s

    reader.readAsDataURL(f);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        // Logos and small photos (players, staff) don't need to be huge, but should be high quality.
        let MAX_WIDTH = 1600;
        let MAX_HEIGHT = 1200;
        
        if (isLogo) {
          MAX_WIDTH = 400;
          MAX_HEIGHT = 400;
        } else if (isSmall) {
          // 600px is enough for player/staff profiles and keeps Base64 size small
          MAX_WIDTH = 600;
          MAX_HEIGHT = 600;
        }
        
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
        if (!ctx) {
          resolve(f);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use PNG for logos and hero images to preserve transparency if it's a PNG
        // Use JPEG for others to keep file size small
        const mimeType = f.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = isSmall ? 0.75 : 0.85; // Slightly lower quality for small photos to save space

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], f.name, { type: mimeType }));
          } else {
            resolve(f);
          }
        }, mimeType, quality);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(f);
      };
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(f);
    };
  });
};

const ImageUpload: React.FC<{ 
  onUpload: (url: string) => void, 
  currentUrl?: string, 
  path: string, 
  label?: string,
  handleUpload: (file: File, path: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>,
  isLogo?: boolean,
  isHero?: boolean,
  isSmall?: boolean,
  onQuickSave?: (url: string) => void,
  cropAspect?: number,
  circularCrop?: boolean,
  isFallback?: boolean,
  showMessage: (type: 'success' | 'error' | 'info', msg: string) => void
}> = ({ onUpload, currentUrl, path, label, handleUpload, isLogo, isHero, isSmall, onQuickSave, cropAspect, circularCrop, isFallback, showMessage }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Görsel silinemez.');
      return;
    }
    setShowConfirmRemove(true);
  };

  const confirmRemove = () => {
    onUpload('');
    if (onQuickSave) onQuickSave('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowConfirmRemove(false);
    showMessage('success', 'Görsel kaldırıldı');
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Görsel yüklenemez.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Lütfen geçerli bir görsel dosyası seçin.');
        return;
      }
      setOriginalFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropImage(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = async (croppedBlob: Blob) => {
    setCropImage(null);
    if (!originalFile) return;

    setUploading(true);
    setStatus('Hazırlanıyor...');
    try {
      const croppedFile = new File([croppedBlob], originalFile.name, { type: originalFile.type });
      const url = await handleUpload(croppedFile, path, isHero, isSmall, (progress) => {
        if (progress === -1) {
          setStatus('Optimize ediliyor...');
        } else {
          setStatus(`Yükleniyor %${progress}`);
        }
      });
      if (url) {
        onUpload(url);
        if (onQuickSave) {
          setStatus('Kaydediliyor...');
          await onQuickSave(url);
        }
        showMessage('success', 'Görsel başarıyla yüklendi');
      }
    } catch (err: any) {
      console.error("Upload error in component:", err);
      const msg = err.message || 'Görsel yüklenirken bir hata oluştu.';
      showMessage('error', `Yükleme hatası: ${msg}`);
    } finally {
      setUploading(false);
      setStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex flex-wrap items-center gap-4">
        {currentUrl && (
          <div className="flex flex-col items-center gap-2">
            <div className={`relative ${isHero ? 'w-full max-w-md aspect-video bg-gray-50' : 'w-24 h-24 bg-gray-50'} rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm`}>
              <img src={currentUrl} alt="Preview" className="relative w-full h-full object-contain p-1 z-10" />
            </div>
            <button 
              onClick={handleRemove}
              disabled={isFallback}
              className={`flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold border border-red-100 ${isFallback ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 size={14} />
              {isLogo ? 'Logoyu Kaldır' : 'Görseli Kaldır'}
            </button>
          </div>
        )}
        
        <label className={`flex flex-col items-center justify-center ${currentUrl ? (isHero ? 'w-full h-16' : 'w-24 h-24') : 'w-full h-32'} border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[var(--primary-color)] hover:bg-orange-50/30 transition-all group relative ${isFallback ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <div className="flex flex-col items-center justify-center p-2 text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-[10px] text-gray-500 font-medium">{status || 'Yükleniyor...'}</p>
              </div>
            ) : (
              <>
                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-orange-100 transition-colors mb-1">
                  <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[var(--primary-color)]" />
                </div>
                <p className="text-[10px] text-gray-500 font-bold group-hover:text-[var(--primary-color)]">
                  {currentUrl ? (isLogo ? 'Yeni Logo' : 'Yeni Görsel') : (isLogo ? 'Logo Yükle' : 'Görsel Yükle')}
                </p>
                {!currentUrl && <p className="text-[8px] text-gray-400 mt-1">Tıkla veya sürükle</p>}
              </>
            )}
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/*"
            disabled={uploading || isFallback}
            onChange={onSelectFile}
          />
        </label>
      </div>

      {/* Confirmation Modal for Removal */}
      {showConfirmRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Görseli Kaldır</h3>
            <p className="text-gray-600 text-sm mb-6">Bu görseli kaldırmak istediğinize emin misiniz?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmRemove(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      )}

      {cropImage && (
        <ImageCropper
          image={cropImage}
          aspectRatio={cropAspect || (isHero ? 16/9 : 1)}
          circularCrop={circularCrop}
          mimeType={originalFile?.type}
          onCropComplete={onCropComplete}
          onCancel={() => {
            setCropImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      )}
    </div>
  );
};

const AdminPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'primary';
  } | null>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileUpload = async (file: File, path: string, isHero: boolean = false, isSmall: boolean = false, onProgress?: (p: number) => void) => {
    const isLogo = path === 'settings';
    
    // Check if storage is available
    const isStorageAvailable = storage && storage.app.options.storageBucket && storage.app.options.storageBucket !== "undefined";

    if (!isStorageAvailable) {
      console.warn('[STORAGE] Storage not configured or bucket missing.');
      
      // If it's a small logo, we can allow Base64 as a convenience
      if (isLogo && file.size < 50 * 1024) {
        return await convertToBase64(file);
      }

      // Otherwise, we MUST inform the user that Storage is required
      throw new Error('Bulut depolama (Firebase Storage) yapılandırması eksik. Lütfen platform ayarlarından VITE_FIREBASE_STORAGE_BUCKET değişkenini ekleyin.');
    }

    try {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Lütfen geçerli bir görsel dosyası seçin.');
      }

      // Only use Base64 for tiny logos under 20KB to ensure they load instantly
      if (isLogo && file.size < 20 * 1024) {
        console.log('[STORAGE] Tiny logo, using Base64');
        return await convertToBase64(file);
      }

      // Compress before upload
      console.log(`[STORAGE] Original size: ${file.size} bytes`);
      if (onProgress) onProgress(-1); // Signal compression
      const processedFile = await compressImage(file, isLogo, isHero, isSmall);
      const finalFile = processedFile instanceof File ? processedFile : new File([processedFile], file.name, { type: (isLogo || isHero) && file.type === 'image/png' ? 'image/png' : 'image/jpeg' });
      console.log(`[STORAGE] Compressed size: ${finalFile.size} bytes`);

      // If compressed file is tiny, use Base64 for logos only
      if (isLogo && finalFile.size < 30 * 1024) {
        console.log('[STORAGE] Compressed logo is tiny, using Base64');
        return await convertToBase64(finalFile);
      }

      if (finalFile.size > 15 * 1024 * 1024) { // 15MB limit for storage
        throw new Error('Görsel çok büyük. Lütfen 15MB\'dan daha küçük bir dosya seçin.');
      }

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      console.log(`[STORAGE] Attempting upload: ${file.name} to ${path}`);
      console.log(`[STORAGE] File type: ${finalFile.type}, Size: ${finalFile.size}`);

      // Use uploadBytesResumable for progress and better reliability
      const { uploadBytesResumable } = await import('firebase/storage');
      const uploadTask = uploadBytesResumable(storageRef, finalFile);

      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`[STORAGE] Upload timeout for ${file.name}`);
          uploadTask.cancel();
          reject(new Error('timeout'));
        }, 120000); // 2 minutes timeout

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[STORAGE] Upload progress for ${file.name}: ${Math.round(progress)}%`);
            if (onProgress) onProgress(Math.round(progress));
          }, 
          (error: any) => {
            clearTimeout(timeout);
            console.error('[STORAGE] Storage upload failed:', error.code, error.message, error);
            
            if (error.code === 'storage/quota-exceeded') {
              reject(new Error('Ücretsiz depolama kotanız dolmuş (5GB). Lütfen eski fotoğrafları silin veya Firebase planınızı yükseltin.'));
            } else if (error.code === 'storage/unauthorized') {
              reject(new Error('Depolama izniniz yok. Firebase Console -> Storage kısmından "Get Started" butonuna basıp kuralları yayınladığınızdan emin olun. Ayrıca kuralları "Publish" ettiğinizden emin olun.'));
            } else if (error.code === 'storage/canceled') {
              reject(new Error('Yükleme zaman aşımına uğradı veya iptal edildi.'));
            } else if (error.code === 'storage/retry-limit-exceeded') {
              reject(new Error('Yükleme başarısız oldu. İnternet bağlantınızı kontrol edin.'));
            } else {
              reject(new Error(`Yükleme hatası (${error.code}): ${error.message}`));
            }
          }, 
          async () => {
            clearTimeout(timeout);
            try {
              const url = await getDownloadURL(storageRef);
              resolve(url);
            } catch (urlErr) {
              reject(urlErr);
            }
          }
        );
      });
    } catch (err) {
      console.error('[STORAGE] All upload methods failed:', err);
      throw err;
    }
  };
  useEffect(() => {
    if (storage && !storage.app.options.storageBucket) {
      console.warn('[STORAGE] Storage bucket is missing in configuration');
      showMessage('error', 'Bulut depolama (Firebase Storage) yapılandırması eksik (storageBucket). Görsel yükleme çalışmayabilir.');
    }

    let unsubscribeAdmins: (() => void) | undefined;
    let unsubscribeCMS: (() => void) | undefined;

    // Set a timeout for loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('AdminPage loading timed out. Check Firebase connection.');
      }
    }, 10000);

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        unsubscribeCMS = subscribeToCMSData((data) => {
          setCmsData(data);
          setLoading(false);
          clearTimeout(loadingTimeout);
        });
        
        unsubscribeAdmins = subscribeToAdmins((adminList) => {
          setAdmins(adminList);
        });
      } else {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setLoading(false);
      clearTimeout(loadingTimeout);
      showMessage('error', 'Oturum bilgisi alınamadı. Lütfen internet bağlantınızı kontrol edin.');
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAdmins) unsubscribeAdmins();
      if (unsubscribeCMS) unsubscribeCMS();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError('Lütfen e-posta ve şifrenizi girin.');
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
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = 'Bu alan adı (domain) Firebase üzerinde yetkilendirilmemiş. Lütfen Firebase Console > Authentication > Settings > Authorized domains kısmına "cangucu.org" ve "netlify.app" adreslerini ekleyin.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Ağ hatası oluştu. Lütfen internet bağlantınızı ve Firebase yapılandırmanızı kontrol edin.';
      } else {
        errorMsg = `Hata: ${err.message} (${err.code})`;
      }
      
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);
  
  const handleReorder = async (collectionName: string, items: any[], index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const currentItem = newItems[index];
    const targetItem = newItems[targetIndex];
    
    // Swap order values
    // If order is missing, use timestamp as fallback
    const currentOrder = currentItem.order || (Date.now() - index);
    const targetOrder = targetItem.order || (Date.now() - targetIndex);
    
    try {
      // We want the item moving "up" to have a HIGHER order value (since we sort desc)
      // Wait, if we sort DESC, then higher order is at the top.
      // If I click "UP", I want to swap with the item above it.
      // The item above it has a HIGHER order value than me.
      // So I take its order value, and it takes mine.
      
      await Promise.all([
        updateOrder(collectionName, currentItem.id?.toString() || currentItem.teamSlug, targetOrder),
        updateOrder(collectionName, targetItem.id?.toString() || targetItem.teamSlug, currentOrder)
      ]);
      showMessage('success', 'Sıralama güncellendi');
    } catch (err) {
      console.error('Reorder failed:', err);
      showMessage('error', 'Sıralama güncellenemedi');
    }
  };

  const handleMigration = async () => {
    if (!isSuperAdmin) {
      showMessage('error', 'Bu işlemi sadece Süper Admin yapabilir.');
      return;
    }
    
    setConfirmModal({
      title: 'Fabrika Ayarlarına Dön',
      message: 'SİTEYİ FABRİKA AYARLARINA DÖNDÜRMEK İSTEDİĞİNİZE EMİN MİSİNİZ? Bu işlem veritabanındaki TÜM verilerinizi (haberler, logolar, fikstürler vb.) kalıcı olarak silecek ve yerlerine boş varsayılan verileri yükleyecektir.',
      confirmText: 'Sıfırla ve Varsayılanları Yükle',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
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
        pagesData: [],
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
  }
});
};


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Yönetim Paneli Yükleniyor...</p>
      <p className="text-xs text-gray-400 mt-2">Lütfen bekleyin, veritabanına bağlanılıyor.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 text-[var(--primary-color)] hover:underline text-sm font-bold"
      >
        Yeniden Dene
      </button>
    </div>
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">Yönetim Paneli</h1>
          <p className="text-gray-600 mb-8 text-center">Sitenizi yönetmek için lütfen e-posta ve şifrenizle giriş yapın.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                {loginError}
              </div>
            )}
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
  const isSuperAdmin = user.email?.toLowerCase() === 'ihsandurgut1@gmail.com';
  
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
        
        {cmsData.isFallback && (
          <div className="px-4 py-2 mx-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[10px] text-red-600 font-bold uppercase">Bağlantı Uyarısı</p>
            <p className="text-[9px] text-red-500 leading-tight">Veritabanına bağlanılamadı. Şu an gördüğünüz veriler varsayılan verilerdir. Lütfen internetinizi kontrol edip sayfayı yenileyin.</p>
          </div>
        )}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20}/>} label="Genel Ayarlar" />
          <TabButton active={activeTab === 'homepage'} onClick={() => setActiveTab('homepage')} icon={<Layout size={20}/>} label="Ana Sayfa" />
          <TabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20}/>} label="Haberler" />
          <TabButton active={activeTab === 'pages'} onClick={() => setActiveTab('pages')} icon={<FileText size={20}/>} label="Sayfalar" />
          <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={20}/>} label="Takımlar" />
          <TabButton active={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} icon={<Calendar size={20}/>} label="Fikstürler" />
          <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={20}/>} label="Galeri" />
          <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Users size={20}/>} label="Personel" />
          <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Target size={20}/>} label="Misyon & Vizyon" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheck size={20}/>} label="Yetkili Yönetimi" />
          <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Database size={20}/>} label="Webflow Aktarımı" />
          
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t">
              <div className="px-3 py-2 mb-2 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-[10px] text-orange-800 font-bold uppercase mb-1">Süper Admin / Tehlikeli Bölge</p>
                <button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="flex items-center gap-3 w-full p-2 rounded-lg transition-all text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                >
                  <Database size={18}/>
                  <span className="font-bold text-xs">{isMigrating ? 'Aktarılıyor...' : 'Fabrika Ayarlarına Dön'}</span>
                </button>
                <p className="text-[9px] text-orange-600 mt-1 leading-tight">DİKKAT: Veritabanındaki tüm verileri siler ve JSON dosyalarındaki varsayılan verileri yükler. Bu butona basılmadığı sürece site asla sıfırlanmaz.</p>
              </div>
            </div>
          )}
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
            <MobileTabButton active={activeTab === 'pages'} onClick={() => setActiveTab('pages')} icon={<FileText size={18}/>} label="Sayfalar" />
            <MobileTabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={18}/>} label="Takımlar" />
            <MobileTabButton active={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} icon={<Calendar size={18}/>} label="Fikstürler" />
            <MobileTabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon size={18}/>} label="Galeri" />
            <MobileTabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Users size={18}/>} label="Personel" />
            <MobileTabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Target size={18}/>} label="Misyon" />
            <MobileTabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheck size={18}/>} label="Yetkililer" />
            <MobileTabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Database size={18}/>} label="Webflow" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium">
              <LogOut size={18}/> Çıkış
            </button>
          </div>
        </div>

          {cmsData.isFallback && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Veritabanı Bağlantısı Yok</h3>
                <p className="text-sm">Şu an veritabanına bağlanılamıyor. Gördüğünüz veriler yerel yedek verilerdir. Kayıt işlemi devre dışı bırakılmıştır.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
              >
                Yeniden Bağlan
              </button>
            </div>
          )}

          {storage && !storage.app.options.storageBucket && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-4 text-orange-700">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <Database className="text-orange-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Bulut Depolama Yapılandırması Eksik</h3>
                <p className="text-sm">Firebase Storage (Bulut Depolama) için 'storageBucket' ayarı yapılmamış. Fotoğraflar buluta yüklenemez. Lütfen platform ayarlarından VITE_FIREBASE_STORAGE_BUCKET değişkenini ekleyin.</p>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            {activeTab === 'settings' && <SettingsTab data={cmsData.siteSettings} onSave={async (d) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await updateSettings(d); showMessage('success', 'Ayarlar kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); throw e; } }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'homepage' && <HomepageTab data={cmsData.homePageHero} onSave={async (d) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await updateHomepage(d); showMessage('success', 'Ana sayfa güncellendi'); } catch(e) { showMessage('error', 'Güncellenemedi'); throw e; } }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} setConfirmModal={setConfirmModal} />}
            {activeTab === 'news' && <NewsTab data={cmsData.newsData} onSave={async (d, id) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await saveNewsArticle(d, id); showMessage('success', 'Haber kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); throw e; } }} onDelete={async (id) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Silme işlemi yapılamaz.'); return; } try { await deleteNewsArticle(id); showMessage('success', 'Haber silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } }} onReorder={(idx, dir) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Sıralama değiştirilemez.'); return; } handleReorder('news', cmsData.newsData, idx, dir); }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'pages' && <PagesTab 
              data={cmsData.pagesData} 
              onSave={async (d, id) => { 
                if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } 
                try { await savePage(d, id); showMessage('success', 'Sayfa kaydedildi'); } 
                catch(e: any) { 
                  let msg = 'Sayfa kaydedilirken bir hata oluştu.';
                  try {
                    const errObj = JSON.parse(e.message);
                    if (errObj.error.includes('insufficient permissions')) {
                      msg = 'Yetki hatası: Firebase Console üzerinden Firestore kurallarını (rules) güncellemeniz gerekiyor.';
                    } else {
                      msg = `Hata: ${errObj.error}`;
                    }
                  } catch(parseErr) {}
                  showMessage('error', msg); 
                  throw e; 
                } 
              }} 
              onDelete={async (id) => { 
                if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Silme işlemi yapılamaz.'); return; } 
                try { await deletePage(id); showMessage('success', 'Sayfa silindi'); } 
                catch(e) { showMessage('error', 'Silinemedi'); } 
              }} 
              onDeletePlayer={deletePagePlayer}
              handleUpload={handleFileUpload} 
              ImageUpload={ImageUpload} 
              showMessage={showMessage} 
              isFallback={cmsData.isFallback} 
            />}
            {activeTab === 'teams' && <TeamsTab 
              data={cmsData.teamData} 
              onSave={async (d, id) => { 
                if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } 
                try { await saveTeam(d, id); showMessage('success', 'Takım kaydedildi'); } 
                catch(e: any) { 
                  let msg = 'Takım kaydedilirken bir hata oluştu.';
                  try {
                    const errObj = JSON.parse(e.message);
                    if (errObj.error.includes('insufficient permissions')) {
                      msg = 'Yetki hatası: Firebase Console üzerinden Firestore kurallarını (rules) güncellemeniz gerekiyor.';
                    } else {
                      msg = `Hata: ${errObj.error}`;
                    }
                  } catch(parseErr) {}
                  showMessage('error', msg); 
                  throw e; 
                } 
              }} 
              onDelete={async (id) => { 
                if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Silme işlemi yapılamaz.'); return; } 
                try { await deleteTeam(id); showMessage('success', 'Takım silindi'); } 
                catch(e) { showMessage('error', 'Silinemedi'); } 
              }} 
              onDeletePlayer={deletePlayer}
              handleUpload={handleFileUpload} 
              ImageUpload={ImageUpload} 
              isFallback={cmsData.isFallback} 
              showMessage={showMessage} 
            />}
            {activeTab === 'fixtures' && <FixturesTab data={cmsData.fixtures} teams={cmsData.teamData} onSave={async (d) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await saveFixture(d); showMessage('success', 'Fikstür kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); throw e; } }} onReorder={(idx, dir) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Sıralama değiştirilemez.'); return; } handleReorder('fixtures', cmsData.fixtures, idx, dir); }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'gallery' && <GalleryTab data={cmsData.galleryData} onSave={async (d) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await saveGalleryImage(d); showMessage('success', 'Görsel eklendi'); } catch(e) { showMessage('error', 'Eklenemedi'); throw e; } }} onDelete={async (id) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Silme işlemi yapılamaz.'); return; } try { await deleteGalleryImage(id); showMessage('success', 'Görsel silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } }} onReorder={(idx, dir) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Sıralama değiştirilemez.'); return; } handleReorder('gallery', cmsData.galleryData, idx, dir); }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'staff' && <StaffTab data={cmsData.staffData} onSave={async (d, id) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await saveStaffMember(d, id); showMessage('success', 'Personel kaydedildi'); } catch(e) { showMessage('error', 'Kaydedilemedi'); throw e; } }} onDelete={async (id) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Silme işlemi yapılamaz.'); return; } try { await deleteStaffMember(id); showMessage('success', 'Personel silindi'); } catch(e) { showMessage('error', 'Silinemedi'); } }} onReorder={(idx, dir) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Sıralama değiştirilemez.'); return; } handleReorder('staff', cmsData.staffData, idx, dir); }} handleUpload={handleFileUpload} ImageUpload={ImageUpload} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'about' && <AboutTab data={cmsData.missionVision} onSave={async (d) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.'); return; } try { await updateMissionVision(d); showMessage('success', 'Kaydedildi'); } catch(err) { showMessage('error', 'Kaydedilemedi'); throw err; } }} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'users' && <UsersTab admins={admins} currentUser={user} onAdd={async (e, u) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Yetkili eklenemez.'); return; } try { await addAdmin(e, u); showMessage('success', 'Yetkili eklendi'); } catch(err) { showMessage('error', 'Eklenemedi'); } }} onRemove={async (u) => { if (cmsData.isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Yetkili kaldırılamaz.'); return; } try { await removeAdmin(u); showMessage('success', 'Yetkili kaldırıldı'); } catch(err) { showMessage('error', 'Kaldırılamadı'); } }} isFallback={cmsData.isFallback} showMessage={showMessage} />}
            {activeTab === 'export' && <WebflowExportTab cmsData={cmsData} showMessage={showMessage} />}
          </div>
        </main>

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold mb-2">{confirmModal.title}</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  {confirmModal.cancelText || 'Vazgeç'}
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  {confirmModal.confirmText || 'Onayla'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Message Toast */}
        {message && (
          <div className={`fixed bottom-8 right-8 z-[300] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
            message.type === 'success' ? 'bg-emerald-600 text-white' : 
            message.type === 'error' ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : 
             message.type === 'error' ? <AlertCircle size={20} /> : 
             <Info size={20} />}
            <span className="font-bold">{message.text}</span>
          </div>
        )}
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

const SettingsTab: React.FC<{ data: SiteSettings, onSave: (d: SiteSettings) => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback?: boolean, showMessage: any }> = ({ data, onSave, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [form, setForm] = useState(data || {
    siteTitle: 'Çangücü SK',
    logo: '',
    address: '',
    email: '',
    phone: '',
    socialMedia: { facebook: '', instagram: '', twitter: '', youtube: '' },
    maintenanceMode: false,
    navigation: [],
    globalStyles: { primaryColor: '#f27d26', secondaryColor: '#1a1a1a', fontFamily: 'Inter', baseFontSize: '16px' }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastDataJson, setLastDataJson] = useState(JSON.stringify(data));

  useEffect(() => {
    const currentDataJson = JSON.stringify(data);
    if (data && currentDataJson !== lastDataJson) {
      setForm(data);
      setLastDataJson(currentDataJson);
      setIsDirty(false);
    }
  }, [data, lastDataJson]);

  const updateForm = (updates: Partial<SiteSettings>) => {
    setForm(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };
  
  if (!data && !form) return <div>Yükleniyor...</div>;

  const handleSave = async () => {
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Değişiklikler kaydedilemez.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(form);
      setLastDataJson(JSON.stringify(form));
      setIsDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-2 -mx-2 px-2 rounded-xl">
        <h2 className="text-2xl font-bold">Genel Ayarlar</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isDirty && (
            <span className="text-xs font-medium text-orange-600 animate-pulse hidden sm:inline">
              Kaydedilmemiş değişiklikler var
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving || (!isDirty && !!data)}
            className={`flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto rounded-xl text-white font-bold transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : isDirty ? 'bg-orange-600 hover:scale-105 shadow-lg' : 'bg-gray-400 cursor-not-allowed opacity-50'}`}
          >
            <Save size={20} />
            {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b">
          <ImageUpload 
            label="Kulüp Logosu"
            currentUrl={form.logo}
            path="settings"
            handleUpload={handleUpload}
            isLogo={true}
            cropAspect={1}
            circularCrop={true}
            isFallback={isFallback}
            showMessage={showMessage}
            onUpload={(url: string) => {
              updateForm({ logo: url });
            }}
            onQuickSave={async (url: string) => {
              try {
                await onSave({ ...form, logo: url });
                setLastDataJson(JSON.stringify({ ...form, logo: url }));
                setIsDirty(false);
              } catch (err) {
                console.error("Quick save failed:", err);
              }
            }}
          />
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-700">Logo Yönetimi</p>
            <p className="text-xs text-gray-400 mt-1">Önerilen: 200x200px, PNG veya SVG. Arkaplanı şeffaf olan görseller daha iyi görünür.</p>
            {isDirty && form.logo !== data.logo && (
              <p className="text-[10px] text-orange-500 mt-2 font-bold italic">
                * Logo değişikliğini kalıcı hale getirmek için "Ayarları Kaydet" butonuna basmayı unutmayın.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adresi</label>
            <input type="text" value={form.address} onChange={e => updateForm({ address: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={form.email} onChange={e => updateForm({ email: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="text" value={form.phone} onChange={e => updateForm({ phone: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
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
                  onChange={e => updateForm({ socialMedia: {...form.socialMedia, [key]: e.target.value} })} 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="URL"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
          <input type="checkbox" checked={form.maintenanceMode} onChange={e => updateForm({ maintenanceMode: e.target.checked })} id="maintenance" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
          <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Bakım Modu (Siteyi ziyaretçilere kapatır)</label>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Navigasyon Menüsü</h3>
            <button 
              onClick={() => setForm({...form, navigation: [...(form.navigation || []), { name: 'Yeni Menü', path: '#', items: [] }]})}
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
                    <div className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={nav.isDropdown} 
                        onChange={e => {
                          const newNav = [...form.navigation];
                          newNav[idx].isDropdown = e.target.checked;
                          setForm({...form, navigation: newNav});
                        }}
                        id={`dropdown-${idx}`}
                        className="w-3 h-3 text-orange-600 rounded"
                      />
                      <label htmlFor={`dropdown-${idx}`} className="text-[10px] text-gray-500 whitespace-nowrap">Açılır</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button 
                        onClick={() => {
                          if (idx > 0) {
                            const newNav = [...form.navigation];
                            const temp = newNav[idx];
                            newNav[idx] = newNav[idx - 1];
                            newNav[idx - 1] = temp;
                            setForm({...form, navigation: newNav});
                          }
                        }}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (idx < form.navigation.length - 1) {
                            const newNav = [...form.navigation];
                            const temp = newNav[idx];
                            newNav[idx] = newNav[idx + 1];
                            newNav[idx + 1] = temp;
                            setForm({...form, navigation: newNav});
                          }
                        }}
                        disabled={idx === form.navigation.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        const newNav = [...form.navigation];
                        newNav[idx].items = [...(newNav[idx].items || []), { name: 'Alt Menü', path: '#' }];
                        newNav[idx].isDropdown = true;
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

        <button 
          onClick={handleSave} 
          disabled={isFallback}
          className="bg-[var(--primary-color)] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save size={20}/> Ayarları Kaydet
        </button>
      </div>
    </div>
  );
};

const NewsTab: React.FC<{ data: NewsArticle[], onSave: (d: Partial<NewsArticle>, id?: string) => void, onDelete: (id: string) => void, onReorder: (idx: number, dir: 'up' | 'down') => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback: boolean, showMessage: any }> = ({ data, onSave, onDelete, onReorder, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [editing, setEditing] = useState<Partial<NewsArticle> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const newsList = data || [];

  const handleSave = async () => {
    if (!editing) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
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
          
          <div className="space-y-1">
            <label className="text-sm text-gray-500">Haber Tarihi</label>
            <input 
              type="date" 
              value={editing.date ? editing.date.split('T')[0] : ''} 
              onChange={e => {
                const date = e.target.value;
                if (date) {
                  // Preserve the time part if it exists, otherwise use 12:00:00 to avoid timezone issues
                  const timePart = editing.date?.includes('T') ? editing.date.split('T')[1] : '12:00:00.000Z';
                  setEditing({...editing, date: `${date}T${timePart}`});
                }
              }} 
              className="w-full p-2 border rounded-lg" 
            />
          </div>

          <textarea placeholder="Özet" value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="İçerik" value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} className="w-full p-2 border rounded-lg h-32" />
          
          <ImageUpload 
            label="Haber Görseli"
            currentUrl={editing.imageUrl}
            path="news"
            isHero={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
            onUpload={(url: string) => setEditing({ ...editing, imageUrl: url })}
          />

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving || isFallback}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {newsList.map((article, idx) => (
          <div key={article.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => onReorder(idx, 'up')} 
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-orange-600 disabled:opacity-20"
                >
                  <ChevronUp size={20} />
                </button>
                <button 
                  onClick={() => onReorder(idx, 'down')} 
                  disabled={idx === newsList.length - 1}
                  className="text-gray-400 hover:text-orange-600 disabled:opacity-20"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              <div>
                <h4 className="font-bold">{article.title}</h4>
                <p className="text-sm text-gray-500">{new Date(article.date).toLocaleDateString('tr-TR')}</p>
              </div>
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

const PagesTab: React.FC<{ data: DynamicPage[], onSave: (d: Partial<DynamicPage>, id?: string) => void, onDelete: (id: string) => void, onDeletePlayer: (pageId: string, playerId: string) => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, showMessage: any, isFallback: boolean }> = ({ data, onSave, onDelete, onDeletePlayer, handleUpload, ImageUpload, showMessage, isFallback }) => {
  const [editing, setEditing] = useState<Partial<DynamicPage> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pagesList = data || [];

  const handleSave = async () => {
    if (!editing) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      // Check for Base64 images in all fields and identify which one
      let base64Field = '';
      if (editing.heroImage?.startsWith('data:image/')) base64Field = 'Kapak Fotoğrafı';
      else if (editing.coach?.imageUrl?.startsWith('data:image/')) base64Field = 'Antrenör Fotoğrafı';
      else {
        const playerIdx = editing.players?.findIndex((p: any) => p.imageUrl?.startsWith('data:image/'));
        if (playerIdx !== undefined && playerIdx !== -1) {
          base64Field = `${playerIdx + 1}. Sporcu Fotoğrafı`;
        }
      }

      if (base64Field) {
        showMessage('warning', `"${base64Field}" hala buluta yüklenmemiş (Base64 formatında). Lütfen bu fotoğrafı silip tekrar yükleyin. Sorun devam ederse Firebase Storage ayarlarınızı kontrol edin.`);
        setIsSaving(false);
        return;
      }

      await onSave(editing, editing.id);
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  const addPlayer = () => {
    const players = [...(editing?.players || []), { id: Date.now(), name: '', position: '', number: 0, imageUrl: '' }];
    setEditing({ ...editing!, players });
  };

  const removePlayer = (id: number) => {
    const players = editing?.players?.filter(p => p.id !== id);
    setEditing({ ...editing!, players });
  };

  const addAnnouncement = () => {
    const announcements = [...(editing?.announcements || []), { title: '', date: new Date().toLocaleDateString('tr-TR'), content: '' }];
    setEditing({ ...editing!, announcements });
  };

  const removeAnnouncement = (idx: number) => {
    const announcements = editing?.announcements?.filter((_, i) => i !== idx);
    setEditing({ ...editing!, announcements });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Dinamik Sayfalar</h2>
        <button onClick={() => setEditing({ title: '', slug: '', content: '', heroImage: '', coach: { name: '', role: '', imageUrl: '' }, players: [], announcements: [] })} className="bg-[var(--primary-color)] text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 shadow-md">
          <Plus size={18}/> Yeni Sayfa Oluştur
        </button>
      </div>

      {editing && (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md space-y-6">
          <h3 className="font-bold text-xl border-b pb-2">{editing.id ? 'Sayfayı Düzenle' : 'Yeni Sayfa'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Başlığı</label>
              <input type="text" placeholder="Örn: Voleybol Branşı" value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Linki (Slug)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">/sayfa/</span>
                <input type="text" placeholder="voleybol" value={editing.slug} onChange={e => setEditing({...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama Metni</label>
            <textarea placeholder="Sayfa içeriği..." value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} className="w-full p-2 border rounded-lg h-32" />
          </div>

          <ImageUpload 
            label="Kapak Görseli (Hero)"
            currentUrl={editing.heroImage}
            path="pages"
            isHero={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
            onUpload={(url: string) => setEditing({ ...editing, heroImage: url })}
          />

          {/* Coach Section */}
          <div className="p-4 bg-blue-50 rounded-xl space-y-4">
            <h4 className="font-bold text-blue-800 flex items-center gap-2">
              <User size={18} /> Antrenör Bilgileri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Antrenör Adı" value={editing.coach?.name} onChange={e => setEditing({...editing, coach: {...editing.coach!, name: e.target.value}})} className="w-full p-2 border rounded-lg bg-white" />
              <input type="text" placeholder="Görevi" value={editing.coach?.role} onChange={e => setEditing({...editing, coach: {...editing.coach!, role: e.target.value}})} className="w-full p-2 border rounded-lg bg-white" />
            </div>
            <ImageUpload 
              currentUrl={editing.coach?.imageUrl}
              path="pages/coaches"
              cropAspect={1}
              circularCrop={true}
              isSmall={true}
              handleUpload={handleUpload}
              isFallback={isFallback}
              showMessage={showMessage}
              onUpload={(url: string) => setEditing({ ...editing, coach: { ...editing.coach!, imageUrl: url } })}
            />
          </div>

          {/* Players Section */}
          <div className="p-4 bg-amber-50 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <Users size={18} /> Sporcular / Üyeler
              </h4>
              <button onClick={addPlayer} className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded hover:bg-amber-300">+ Ekle</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editing.players?.map((player) => (
                <div key={player.id} className="bg-white p-3 rounded-lg border relative space-y-2">
                  <button 
                    onClick={async () => {
                      if (editing.id && typeof player.id === 'string') {
                        try {
                          await onDeletePlayer(editing.id, player.id);
                        } catch (err) {
                          console.error('Error deleting player from subcollection:', err);
                        }
                      }
                      const players = editing.players?.filter(p => p.id !== player.id);
                      setEditing({ ...editing, players });
                    }} 
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input type="text" placeholder="İsim" value={player.name} onChange={e => {
                    const players = editing.players?.map(p => p.id === player.id ? { ...p, name: e.target.value } : p);
                    setEditing({ ...editing, players });
                  }} className="w-full p-1 border rounded text-sm" />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Pozisyon" value={player.position} onChange={e => {
                      const players = editing.players?.map(p => p.id === player.id ? { ...p, position: e.target.value } : p);
                      setEditing({ ...editing, players });
                    }} className="w-2/3 p-1 border rounded text-xs" />
                    <input type="number" placeholder="No" value={player.number} onChange={e => {
                      const players = editing.players?.map(p => p.id === player.id ? { ...p, number: parseInt(e.target.value) } : p);
                      setEditing({ ...editing, players });
                    }} className="w-1/3 p-1 border rounded text-xs" />
                  </div>
                  <ImageUpload 
                    currentUrl={player.imageUrl}
                    path="pages/players"
                    cropAspect={1}
                    isSmall={true}
                    handleUpload={handleUpload}
                    isFallback={isFallback}
                    showMessage={showMessage}
                    onUpload={(url: string) => {
                      const players = editing.players?.map(p => p.id === player.id ? { ...p, imageUrl: url } : p);
                      setEditing({ ...editing, players });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Section */}
          <div className="p-4 bg-rose-50 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-rose-800 flex items-center gap-2">
                <Calendar size={18} /> Duyurular
              </h4>
              <button onClick={addAnnouncement} className="text-xs bg-rose-200 text-rose-800 px-2 py-1 rounded hover:bg-rose-300">+ Ekle</button>
            </div>
            <div className="space-y-3">
              {editing.announcements?.map((ann, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border relative space-y-2">
                  <button onClick={() => removeAnnouncement(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Başlık" value={ann.title} onChange={e => {
                      const announcements = [...editing.announcements!];
                      announcements[idx].title = e.target.value;
                      setEditing({ ...editing, announcements });
                    }} className="w-2/3 p-1 border rounded text-sm font-bold" />
                    <input type="text" placeholder="Tarih" value={ann.date} onChange={e => {
                      const announcements = [...editing.announcements!];
                      announcements[idx].date = e.target.value;
                      setEditing({ ...editing, announcements });
                    }} className="w-1/3 p-1 border rounded text-xs" />
                  </div>
                  <textarea placeholder="Duyuru içeriği..." value={ann.content} onChange={e => {
                    const announcements = [...editing.announcements!];
                    announcements[idx].content = e.target.value;
                    setEditing({ ...editing, announcements });
                  }} className="w-full p-1 border rounded text-xs h-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button 
              onClick={handleSave} 
              disabled={isSaving || isFallback}
              className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? 'Kaydediliyor...' : <><Save size={18}/> Sayfayı Yayınla</>}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-8 py-2 rounded-lg font-bold">İptal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pagesList.map(page => (
          <div key={page.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col justify-between">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {page.heroImage ? (
                  <img src={page.heroImage} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <img src="https://picsum.photos/seed/page/200/200" alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">{page.title}</h4>
                <p className="text-xs text-emerald-600 font-medium">/sayfa/{page.slug}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {page.players?.length || 0} Sporcu
                  </span>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                    {page.announcements?.length || 0} Duyuru
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t pt-3">
              <button onClick={() => setEditing(page)} className="flex-grow bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">Düzenle</button>
              <button onClick={() => onDelete(page.id!)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/#/sayfa/${page.slug}`;
                  navigator.clipboard.writeText(url);
                  showMessage('success', 'Sayfa linki kopyalandı!');
                }}
                className="bg-slate-50 text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Linki Kopyala"
              >
                <Copy size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GalleryTab: React.FC<{ data: GalleryItem[], onSave: (d: Partial<GalleryItem>) => void, onDelete: (id: string) => void, onReorder: (idx: number, dir: 'up' | 'down') => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback: boolean, showMessage: any }> = ({ data, onSave, onDelete, onReorder, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [newImage, setNewImage] = useState({ imageUrl: '', title: '' });
  const [isSaving, setIsSaving] = useState(false);
  const galleryList = data || [];

  const handleSave = async () => {
    if (!newImage.imageUrl) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(newImage);
      setNewImage({ imageUrl: '', title: '' });
    } catch (err) {
      console.error('[GALLERY_SAVE] Error saving gallery image:', err);
      showMessage('error', 'Görsel kaydedilirken bir hata oluştu.');
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
          disabled={!newImage.imageUrl || isSaving || isFallback}
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
              cropAspect={4/3}
              handleUpload={handleUpload}
              isFallback={isFallback}
              showMessage={showMessage}
              onUpload={(url: string) => setNewImage({ ...newImage, imageUrl: url })}
            />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Başlık (Opsiyonel)</label>
            <input type="text" placeholder="Görsel Başlığı" value={newImage.title} onChange={e => setNewImage({...newImage, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryList.map((img, idx) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100">
            {img.imageUrl ? (
              <img src={img.imageUrl} alt={img.title} className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => onReorder(idx, 'up')} 
                  disabled={idx === 0}
                  className="bg-white text-orange-600 p-1.5 rounded-full disabled:opacity-30"
                >
                  <ChevronUp size={18} />
                </button>
                <button 
                  onClick={() => onReorder(idx, 'down')} 
                  disabled={idx === galleryList.length - 1}
                  className="bg-white text-orange-600 p-1.5 rounded-full disabled:opacity-30"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
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

const HomepageTab: React.FC<{ data: HomePageHero, onSave: (d: HomePageHero) => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback: boolean, showMessage: any, setConfirmModal: any }> = ({ data, onSave, handleUpload, ImageUpload, isFallback, showMessage, setConfirmModal }) => {
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
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
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
          disabled={isSaving || isFallback}
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
            isHero={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
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
                      setConfirmModal({
                        title: 'Bölümü Sil',
                        message: 'Bu bölümü silmek istediğinize emin misiniz?',
                        confirmText: 'Sil',
                        type: 'danger',
                        onConfirm: () => {
                          const newSecs = form.sections.filter((_, i) => i !== idx);
                          setForm({...form, sections: newSecs});
                          setConfirmModal(null);
                        }
                      });
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

const TeamsTab: React.FC<{ data: Team[], onSave: (d: Partial<Team>, id?: string) => void, onDelete: (id: string) => void, onDeletePlayer: (teamId: string, playerId: string) => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback: boolean, showMessage: any }> = ({ data, onSave, onDelete, onDeletePlayer, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const teams = data || [];

  const handleSave = async () => {
    if (!editing) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      // Check for Base64 images in all fields and identify which one
      let base64Field = '';
      if (editing.heroImage?.startsWith('data:image/')) base64Field = 'Takım Fotoğrafı';
      else if (editing.coach?.imageUrl?.startsWith('data:image/')) base64Field = 'Teknik Sorumlu Fotoğrafı';
      else {
        const playerIdx = editing.players?.findIndex((p: any) => p.imageUrl?.startsWith('data:image/'));
        if (playerIdx !== undefined && playerIdx !== -1) {
          base64Field = `${playerIdx + 1}. Oyuncu Fotoğrafı`;
        }
      }

      if (base64Field) {
        showMessage('warning', `"${base64Field}" hala buluta yüklenmemiş (Base64 formatında). Lütfen bu fotoğrafı silip tekrar yükleyin. Sorun devam ederse Firebase Storage ayarlarınızı kontrol edin.`);
        setIsSaving(false);
        return;
      }

      await onSave(editing, editing.id?.toString());
      setEditing(null);
    } catch (err) {
      console.error('[TEAM_SAVE] Error saving team:', err);
      showMessage('error', 'Takım kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Takım Yönetimi</h2>
        <button onClick={() => setEditing({ name: '', slug: '', coach: { name: '', role: '', imageUrl: '' }, players: [], heroImage: '' })} className="bg-[var(--primary-color)] text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 shadow-md">
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
            <input type="text" placeholder="Teknik Sorumlu Adı" value={editing.coach?.name || ''} onChange={e => setEditing({...editing, coach: { ...(editing.coach || {}), name: e.target.value }})} className="w-full p-2 border rounded-lg" />
            <input type="text" placeholder="Teknik Sorumlu Görevi" value={editing.coach?.role || ''} onChange={e => setEditing({...editing, coach: { ...(editing.coach || {}), role: e.target.value }})} className="w-full p-2 border rounded-lg" />
          </div>
          
          <ImageUpload 
            label="Teknik Sorumlu Fotoğrafı"
            currentUrl={editing.coach?.imageUrl}
            path="coaches"
            cropAspect={1}
            circularCrop={true}
            isSmall={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
            onUpload={(url: string) => setEditing({ ...editing, coach: { ...(editing.coach || {}), imageUrl: url } })}
          />
          
          <ImageUpload 
            label="Takım Fotoğrafı"
            currentUrl={editing.heroImage}
            path="teams"
            isHero={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
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
                        onClick={async () => {
                          if (editing.id && typeof player.id === 'string') {
                            try {
                              await onDeletePlayer(editing.id.toString(), player.id);
                            } catch (err) {
                              console.error('Error deleting player from subcollection:', err);
                            }
                          }
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
                    cropAspect={1}
                    isSmall={true}
                    handleUpload={handleUpload}
                    isFallback={isFallback}
                    showMessage={showMessage}
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
              disabled={isSaving || isFallback}
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
                {team.heroImage ? (
                  <img src={team.heroImage} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Users size={20} />
                  </div>
                )}
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

const FixturesTab: React.FC<{ 
  data: Fixture[], 
  teams: Team[], 
  onSave: (d: Fixture) => void, 
  onReorder: (idx: number, dir: 'up' | 'down') => void,
  handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>,
  ImageUpload: any,
  isFallback: boolean,
  showMessage: any
}> = ({ data, teams, onSave, onReorder, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fixtures = data || [];

  const handleSave = async () => {
    if (!editing) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      // Check total size
      const size = new Blob([JSON.stringify(editing)]).size;
      if (size > 950 * 1024) {
        showMessage('error', 'Uyarı: Fikstür verisi çok büyük. Lütfen logoları daha küçük boyutlu seçin.');
        if (size > 1024 * 1024) {
          setIsSaving(false);
          return;
        }
      }
      await onSave(editing as Fixture);
      setEditing(null);
    } catch (err) {
      console.error('[FIXTURE_SAVE] Error saving fixture:', err);
      showMessage('error', 'Fikstür kaydedilirken bir hata oluştu.');
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
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tarih</label>
                    <input type="date" value={match.date} onChange={e => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].date = e.target.value;
                      setEditing({...editing, matches: newMatches});
                    }} className="w-full text-xs p-2 border rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Rakip</label>
                    <input type="text" placeholder="Rakip" value={match.opponent} onChange={e => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].opponent = e.target.value;
                      setEditing({...editing, matches: newMatches});
                    }} className="w-full text-xs p-2 border rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Skor</label>
                    <input type="text" placeholder="Skor" value={match.score} onChange={e => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].score = e.target.value;
                      setEditing({...editing, matches: newMatches});
                    }} className="w-full text-xs p-2 border rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Konum</label>
                    <select value={match.location} onChange={e => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].location = e.target.value as any;
                      setEditing({...editing, matches: newMatches});
                    }} className="w-full text-xs p-2 border rounded">
                      <option value="Ev">Ev</option>
                      <option value="Deplasman">Deplasman</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload 
                    label="Ev Sahibi Logo (Opsiyonel)"
                    currentUrl={match.homeLogo}
                    path="match-logos"
                    isSmall={true}
                    handleUpload={handleUpload}
                    isFallback={isFallback}
                    showMessage={showMessage}
                    onUpload={(url: string) => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].homeLogo = url;
                      setEditing({...editing, matches: newMatches});
                    }}
                  />
                  <ImageUpload 
                    label="Deplasman Logo (Opsiyonel)"
                    currentUrl={match.awayLogo}
                    path="match-logos"
                    isSmall={true}
                    handleUpload={handleUpload}
                    isFallback={isFallback}
                    showMessage={showMessage}
                    onUpload={(url: string) => {
                      const newMatches = [...editing.matches!];
                      newMatches[idx].awayLogo = url;
                      setEditing({...editing, matches: newMatches});
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <button onClick={() => {
                    const newMatches = editing.matches!.filter((_: any, i: number) => i !== idx);
                    setEditing({...editing, matches: newMatches});
                  }} className="text-red-500 flex items-center gap-1 text-xs font-bold hover:bg-red-50 p-1 rounded">
                    <Trash2 size={14}/> Maçı Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving || isFallback}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {fixtures.map((fix, idx) => (
          <div key={fix.teamSlug} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => onReorder(idx, 'up')} 
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-orange-600 disabled:opacity-20"
                >
                  <ChevronUp size={20} />
                </button>
                <button 
                  onClick={() => onReorder(idx, 'down')} 
                  disabled={idx === fixtures.length - 1}
                  className="text-gray-400 hover:text-orange-600 disabled:opacity-20"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              <h4 className="font-bold">{fix.teamName}</h4>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(fix)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg">Düzenle</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StaffTab: React.FC<{ data: StaffMember[], onSave: (d: Partial<StaffMember>, id?: string) => void, onDelete: (id: string) => void, onReorder: (idx: number, dir: 'up' | 'down') => void, handleUpload: (f: File, p: string, isHero?: boolean, isSmall?: boolean, onProgress?: (p: number) => void) => Promise<string>, ImageUpload: any, isFallback: boolean, showMessage: any }> = ({ data, onSave, onDelete, onReorder, handleUpload, ImageUpload, isFallback, showMessage }) => {
  const [editing, setEditing] = useState<Partial<StaffMember> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const staff = data || [];

  const handleSave = async () => {
    if (!editing) return;
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      // Check total size
      const size = new Blob([JSON.stringify(editing)]).size;
      if (size > 950 * 1024) {
        showMessage('error', 'Uyarı: Personel verisi çok büyük. Lütfen fotoğrafı daha küçük boyutlu seçin.');
        if (size > 1024 * 1024) {
          setIsSaving(false);
          return;
        }
      }
      await onSave(editing, editing.id?.toString());
      setEditing(null);
    } catch (err) {
      console.error('[STAFF_SAVE] Error saving staff:', err);
      showMessage('error', 'Personel kaydedilirken bir hata oluştu.');
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
            cropAspect={1}
            circularCrop={true}
            isSmall={true}
            handleUpload={handleUpload}
            isFallback={isFallback}
            showMessage={showMessage}
            onUpload={(url: string) => setEditing({ ...editing, imageUrl: url })}
          />

          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving || isFallback}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-200 px-6 py-2 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staff.map((member, idx) => (
          <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm text-center relative group">
            <div className="absolute left-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onReorder(idx, 'up')} 
                disabled={idx === 0}
                className="bg-white/80 p-1 rounded shadow-sm text-orange-600 disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button 
                onClick={() => onReorder(idx, 'down')} 
                disabled={idx === staff.length - 1}
                className="bg-white/80 p-1 rounded shadow-sm text-orange-600 disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            {member.imageUrl ? (
              <img src={member.imageUrl} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border" />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center bg-gray-100 border text-gray-400">
                <User size={32} />
              </div>
            )}
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

const AboutTab: React.FC<{ data: MissionVision, onSave: (d: MissionVision) => void, isFallback: boolean, showMessage: any }> = ({ data, onSave, isFallback, showMessage }) => {
  const [form, setForm] = useState(data || { mission: '', vision: '' });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = () => {
    if (isFallback) {
      showMessage('error', 'Veritabanı bağlantısı yok. Kayıt işlemi yapılamaz.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Misyon & Vizyon</h2>
        <button 
          onClick={handleSave} 
          disabled={isFallback}
          className="bg-[var(--primary-color)] text-white px-8 py-3 w-full sm:w-auto rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50"
        >
          Kaydet
        </button>
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

const UsersTab: React.FC<{ admins: any[], currentUser: any, onAdd: (email: string, uid: string) => void, onRemove: (uid: string) => void, isFallback: boolean, showMessage: any }> = ({ admins, currentUser, onAdd, onRemove, isFallback, showMessage }) => {
  const [newAdmin, setNewAdmin] = useState({ email: '', uid: '' });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('success', 'Kopyalandı: ' + text);
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
          onClick={() => { 
            if (isFallback) { showMessage('error', 'Veritabanı bağlantısı yok. Yetkili eklenemez.'); return; }
            if(newAdmin.email && newAdmin.uid) { onAdd(newAdmin.email, newAdmin.uid); setNewAdmin({ email: '', uid: '' }); } 
          }} 
          disabled={isFallback}
          className="bg-[var(--primary-color)] text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
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

const ExportCard: React.FC<{ title: string, count: number, onDownload: () => void }> = ({ title, count, onDownload }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <div>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-sm text-gray-500 mb-4">{count} kayıt bulundu</p>
    </div>
    <button 
      onClick={onDownload}
      className="flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-xl hover:bg-black transition-colors"
    >
      <Download size={18} /> CSV İndir
    </button>
  </div>
);

const WebflowExportTab: React.FC<{ cmsData: CMSData, showMessage: any }> = ({ cmsData, showMessage }) => {
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      showMessage('warning', 'Dışa aktarılacak veri bulunamadı.');
      return;
    }

    // Get all unique keys from all objects in the array
    const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          const escaped = stringValue.replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Webflow Veri Aktarımı</h2>
      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start gap-4">
        <div className="bg-orange-500 text-white p-2 rounded-lg">
          <Database size={24} />
        </div>
        <div>
          <h3 className="font-bold text-orange-900">Webflow Geçiş Aracı</h3>
          <p className="text-sm text-orange-700">
            Aşağıdaki butonları kullanarak mevcut verilerinizi CSV formatında indirebilirsiniz. 
            Bu dosyaları Webflow CMS koleksiyonlarınıza doğrudan "Import" ederek yükleyebilirsiniz.
            Resim URL'leri de dosya içerisinde yer almaktadır, Webflow bunları otomatik olarak çekecektir.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ExportCard 
          title="Haberler" 
          count={cmsData.newsData.length} 
          onDownload={() => downloadCSV(cmsData.newsData, 'cangucu_haberler')} 
        />
        <ExportCard 
          title="Takımlar" 
          count={cmsData.teamData.length} 
          onDownload={() => downloadCSV(cmsData.teamData, 'cangucu_takimlar')} 
        />
        <ExportCard 
          title="Fikstürler" 
          count={cmsData.fixtures.length} 
          onDownload={() => downloadCSV(cmsData.fixtures, 'cangucu_fiksturler')} 
        />
        <ExportCard 
          title="Galeri" 
          count={cmsData.galleryData.length} 
          onDownload={() => downloadCSV(cmsData.galleryData, 'cangucu_galeri')} 
        />
        <ExportCard 
          title="Personel" 
          count={cmsData.staffData.length} 
          onDownload={() => downloadCSV(cmsData.staffData, 'cangucu_personel')} 
        />
        <ExportCard 
          title="Sayfalar" 
          count={cmsData.pagesData.length} 
          onDownload={() => downloadCSV(cmsData.pagesData, 'cangucu_sayfalar')} 
        />
      </div>
    </div>
  );
};

export default AdminPage;
