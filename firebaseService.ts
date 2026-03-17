import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocFromCache
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { CMSData, Team, NewsArticle, Fixture, GalleryItem, StaffMember, SiteSettings, HomePageHero, MissionVision } from './types';

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data Fetching
export const subscribeToCMSData = (callback: (data: CMSData) => void) => {
  const data: Partial<CMSData> = {};
  let loadedCount = 0;
  const totalCollections = 8;

  const checkAndEmit = () => {
    if (Object.keys(data).length === totalCollections) {
      callback(data as CMSData);
    }
  };

  // Settings
  onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
    data.siteSettings = snapshot.data() as SiteSettings || {
      address: '',
      email: '',
      phone: '',
      socialMedia: { facebook: '', instagram: '', twitter: '', youtube: '' },
      maintenanceMode: false,
      navigation: [],
      globalStyles: { primaryColor: '#f27d26', secondaryColor: '#1a1a1a', fontFamily: 'Inter' }
    };
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/site'));

  // Homepage
  onSnapshot(doc(db, 'homepage', 'hero'), (snapshot) => {
    data.homePageHero = snapshot.data() as HomePageHero || {
      heroImage: '',
      heroTitle: '',
      heroSubtitle: '',
      sections: []
    };
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.GET, 'homepage/hero'));

  // News
  onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snapshot) => {
    data.newsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    if (!data.newsData) data.newsData = [];
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'news'));

  // Teams
  onSnapshot(collection(db, 'teams'), (snapshot) => {
    data.teamData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    if (!data.teamData) data.teamData = [];
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'teams'));

  // Fixtures
  onSnapshot(collection(db, 'fixtures'), (snapshot) => {
    data.fixtures = snapshot.docs.map(d => d.data()) as any;
    if (!data.fixtures) data.fixtures = [];
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'fixtures'));

  // Gallery
  onSnapshot(collection(db, 'gallery'), (snapshot) => {
    data.galleryData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    if (!data.galleryData) data.galleryData = [];
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));

  // Staff
  onSnapshot(collection(db, 'staff'), (snapshot) => {
    data.staffData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    if (!data.staffData) data.staffData = [];
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'staff'));

  // Mission/Vision
  onSnapshot(doc(db, 'missionVision', 'content'), (snapshot) => {
    data.missionVision = snapshot.data() as MissionVision || {
      mission: '',
      vision: ''
    };
    checkAndEmit();
  }, (err) => handleFirestoreError(err, OperationType.GET, 'missionVision/content'));
};

// Migration Function
export const migrateDataToFirestore = async (localData: CMSData) => {
  try {
    // Settings
    await setDoc(doc(db, 'settings', 'site'), localData.siteSettings);
    
    // Homepage
    await setDoc(doc(db, 'homepage', 'hero'), localData.homePageHero);
    
    // Mission/Vision
    await setDoc(doc(db, 'missionVision', 'content'), localData.missionVision);

    // News
    for (const article of localData.newsData) {
      const { id, ...rest } = article;
      await setDoc(doc(db, 'news', String(id)), rest);
    }

    // Teams
    for (const team of localData.teamData) {
      const { id, ...rest } = team;
      await setDoc(doc(db, 'teams', String(id)), rest);
    }

    // Fixtures
    for (const fixture of localData.fixtures) {
      await setDoc(doc(db, 'fixtures', fixture.teamSlug), fixture);
    }

    // Gallery
    for (const item of localData.galleryData) {
      const { id, ...rest } = item;
      await setDoc(doc(db, 'gallery', String(id)), rest);
    }

    // Staff
    for (const member of localData.staffData) {
      const { id, ...rest } = member;
      await setDoc(doc(db, 'staff', String(id)), rest);
    }

    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

// Admin Operations
export const updateSettings = (settings: SiteSettings) => 
  setDoc(doc(db, 'settings', 'site'), settings);

export const updateHomepage = (hero: HomePageHero) => 
  setDoc(doc(db, 'homepage', 'hero'), hero);

export const saveNewsArticle = (article: Partial<NewsArticle>, id?: string) => {
  if (id) return updateDoc(doc(db, 'news', id), article);
  return addDoc(collection(db, 'news'), { ...article, date: new Date().toISOString() });
};

export const deleteNewsArticle = (id: string) => deleteDoc(doc(db, 'news', id));

export const saveTeam = (team: Partial<Team>, id?: string) => {
  if (id) return updateDoc(doc(db, 'teams', id), team);
  return addDoc(collection(db, 'teams'), team);
};

export const deleteTeam = (id: string) => deleteDoc(doc(db, 'teams', id));

export const saveGalleryImage = (image: Partial<GalleryItem>) => 
  addDoc(collection(db, 'gallery'), image);

export const deleteGalleryImage = (id: string) => deleteDoc(doc(db, 'gallery', id));

export const updateMissionVision = (content: MissionVision) => 
  setDoc(doc(db, 'missionVision', 'content'), content);

export const saveStaffMember = (member: Partial<StaffMember>, id?: string) => {
  if (id) return updateDoc(doc(db, 'staff', id), member);
  return addDoc(collection(db, 'staff'), member);
};

export const deleteStaffMember = (id: string) => deleteDoc(doc(db, 'staff', id));

export const saveFixture = (fixture: Fixture) => 
  setDoc(doc(db, 'fixtures', fixture.teamSlug), fixture);

// User Management
export const subscribeToAdmins = (callback: (admins: any[]) => void) => {
  return onSnapshot(query(collection(db, 'users')), (snapshot) => {
    callback(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
};

export const addAdmin = async (email: string, uid: string) => {
  return setDoc(doc(db, 'users', uid), {
    email,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
};

export const removeAdmin = async (uid: string) => {
  return deleteDoc(doc(db, 'users', uid));
};
