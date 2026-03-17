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
  const data: Partial<CMSData> = {
    siteSettings: undefined,
    homePageHero: undefined,
    teamData: [],
    fixtures: [],
    newsData: [],
    galleryData: [],
    staffData: [],
    missionVision: undefined
  };
  const totalCollections = 8;
  const unsubscribes: (() => void)[] = [];
  const loadedCollections = new Set<string>();

  const checkAndEmit = (collectionName: string) => {
    loadedCollections.add(collectionName);
    if (loadedCollections.size === totalCollections) {
      callback(data as CMSData);
    }
  };

  // Settings
  unsubscribes.push(onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
    const docData = snapshot.data();
    data.siteSettings = {
      logo: '',
      address: '',
      email: '',
      phone: '',
      socialMedia: { facebook: '', instagram: '', twitter: '', youtube: '' },
      maintenanceMode: false,
      navigation: [],
      globalStyles: { primaryColor: '#f27d26', secondaryColor: '#1a1a1a', fontFamily: 'Inter', baseFontSize: '16px' },
      ...docData
    } as SiteSettings;
    checkAndEmit('settings');
  }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/site')));

  // Homepage
  unsubscribes.push(onSnapshot(doc(db, 'homepage', 'hero'), (snapshot) => {
    const docData = snapshot.data();
    data.homePageHero = {
      heroImage: '',
      heroTitle: '',
      heroSubtitle: '',
      sections: [],
      ...docData
    } as HomePageHero;
    checkAndEmit('homepage');
  }, (err) => handleFirestoreError(err, OperationType.GET, 'homepage/hero')));

  // News
  unsubscribes.push(onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snapshot) => {
    data.newsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('news');
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'news')));

  // Teams
  unsubscribes.push(onSnapshot(collection(db, 'teams'), (snapshot) => {
    data.teamData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('teams');
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'teams')));

  // Fixtures
  unsubscribes.push(onSnapshot(collection(db, 'fixtures'), (snapshot) => {
    data.fixtures = snapshot.docs.map(d => d.data()) as any;
    checkAndEmit('fixtures');
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'fixtures')));

  // Gallery
  unsubscribes.push(onSnapshot(collection(db, 'gallery'), (snapshot) => {
    data.galleryData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('gallery');
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery')));

  // Staff
  unsubscribes.push(onSnapshot(collection(db, 'staff'), (snapshot) => {
    data.staffData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('staff');
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'staff')));

  // Mission/Vision
  unsubscribes.push(onSnapshot(doc(db, 'missionVision', 'content'), (snapshot) => {
    const docData = snapshot.data();
    data.missionVision = {
      mission: '',
      vision: '',
      ...docData
    } as MissionVision;
    checkAndEmit('missionVision');
  }, (err) => handleFirestoreError(err, OperationType.GET, 'missionVision/content')));

  return () => unsubscribes.forEach(unsub => unsub());
};

// Migration Function
export const migrateDataToFirestore = async (localData: CMSData) => {
  console.log('Starting migration with data:', localData);
  try {
    // Settings
    await setDoc(doc(db, 'settings', 'site'), localData.siteSettings);
    console.log('Settings migrated');
    
    // Homepage
    await setDoc(doc(db, 'homepage', 'hero'), localData.homePageHero);
    console.log('Homepage migrated');
    
    // Mission/Vision
    await setDoc(doc(db, 'missionVision', 'content'), localData.missionVision);
    console.log('Mission/Vision migrated');

    // News
    for (const article of localData.newsData) {
      const { id, ...rest } = article;
      await setDoc(doc(db, 'news', String(id)), rest);
    }
    console.log('News migrated');

    // Teams
    for (const team of localData.teamData) {
      const { id, ...rest } = team;
      await setDoc(doc(db, 'teams', String(id)), rest);
    }
    console.log('Teams migrated');

    // Fixtures
    for (const fixture of localData.fixtures) {
      await setDoc(doc(db, 'fixtures', fixture.teamSlug), fixture);
    }
    console.log('Fixtures migrated');

    // Gallery
    for (const item of localData.galleryData) {
      const { id, ...rest } = item;
      await setDoc(doc(db, 'gallery', String(id)), rest);
    }
    console.log('Gallery migrated');

    // Staff
    for (const member of localData.staffData) {
      const { id, ...rest } = member;
      await setDoc(doc(db, 'staff', String(id)), rest);
    }
    console.log('Staff migrated');

    // Ensure current user is admin in Firestore if logged in
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        email: auth.currentUser.email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Admin user record created');
    }

    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
    handleFirestoreError(err, OperationType.WRITE, 'migration');
    throw err;
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
