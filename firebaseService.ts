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
  getDocFromCache,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { CMSData, Team, NewsArticle, Fixture, GalleryItem, StaffMember, SiteSettings, HomePageHero, MissionVision, DynamicPage } from './types';

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
  if (!db) {
    console.warn("Firebase not initialized. CMS data subscription skipped.");
    return () => {};
  }
  const data: Partial<CMSData> = {
    siteSettings: undefined,
    homePageHero: undefined,
    teamData: [],
    fixtures: [],
    newsData: [],
    galleryData: [],
    staffData: [],
    pagesData: [],
    missionVision: undefined
  };
  const totalCollections = 9;
  const unsubscribes: (() => void)[] = [];
  const loadedCollections = new Set<string>();

  const checkAndEmit = (collectionName: string) => {
    loadedCollections.add(collectionName);
    // Emit data if all collections have been attempted (either success or error)
    if (loadedCollections.size === totalCollections) {
      // Calculate total docs for debugging quota
      const totalDocs = 
        (data.newsData?.length || 0) + 
        (data.teamData?.length || 0) + 
        (data.galleryData?.length || 0) + 
        (data.staffData?.length || 0) + 
        (data.fixtures?.length || 0) + 
        (data.pagesData?.length || 0) + 
        3; // settings, homepage, missionVision
      
      console.log(`[FIRESTORE] Initial load complete. Total documents: ${totalDocs}`);
      
      // If critical data is missing (due to errors), mark as fallback
      const isFallback = !data.siteSettings || !data.homePageHero || !data.missionVision;
      callback({ ...data, isFallback } as CMSData);
    }
  };

  const handleError = (err: any, collectionName: string, path: string) => {
    console.error(`Error loading ${collectionName}:`, err);
    // Still mark as "loaded" so we don't get stuck, but we might have missing data
    checkAndEmit(collectionName);
    // We don't throw here to avoid breaking the entire subscription process
  };

  // Settings
  unsubscribes.push(onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
    if (!snapshot.exists()) {
      console.warn('Settings document does not exist in Firestore');
      checkAndEmit('settings');
      return;
    }
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
  }, (err) => handleError(err, 'settings', 'settings/site')));

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
  }, (err) => handleError(err, 'homepage', 'homepage/hero')));

  // News
  unsubscribes.push(onSnapshot(query(collection(db, 'news'), orderBy('order', 'desc'), limit(50)), (snapshot) => {
    if (snapshot.metadata.fromCache) console.log('[FIRESTORE] News loaded from cache');
    data.newsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('news');
  }, (err) => handleError(err, 'news', 'news')));

  // Teams
  unsubscribes.push(onSnapshot(collection(db, 'teams'), (snapshot) => {
    if (snapshot.metadata.fromCache) console.log('[FIRESTORE] Teams loaded from cache');
    const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // For each team, we also need to subscribe to its players subcollection
    teams.forEach(team => {
      const playersRef = collection(db, 'teams', team.id, 'players');
      const unsubPlayers = onSnapshot(query(playersRef, orderBy('number', 'asc')), (playerSnapshot) => {
        const players = playerSnapshot.docs.map(pd => ({ id: pd.id, ...pd.data() })) as any[];
        // Update the team in our local data
        const teamIdx = data.teamData?.findIndex(t => t.id === team.id);
        if (teamIdx !== undefined && teamIdx !== -1) {
          const updatedTeamData = [...(data.teamData || [])];
          updatedTeamData[teamIdx] = { ...updatedTeamData[teamIdx], players };
          data.teamData = updatedTeamData;
          callback({ ...data } as CMSData);
        }
      }, (err) => console.error(`Error loading players for team ${team.id}:`, err));
      unsubscribes.push(unsubPlayers);
    });

    data.teamData = teams;
    checkAndEmit('teams');
  }, (err) => handleError(err, 'teams', 'teams')));

  // Fixtures
  unsubscribes.push(onSnapshot(query(collection(db, 'fixtures'), orderBy('order', 'desc')), (snapshot) => {
    data.fixtures = snapshot.docs.map(d => d.data()) as any;
    checkAndEmit('fixtures');
  }, (err) => handleError(err, 'fixtures', 'fixtures')));

  // Gallery
  unsubscribes.push(onSnapshot(query(collection(db, 'gallery'), orderBy('order', 'desc'), limit(50)), (snapshot) => {
    if (snapshot.metadata.fromCache) console.log('[FIRESTORE] Gallery loaded from cache');
    data.galleryData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('gallery');
  }, (err) => handleError(err, 'gallery', 'gallery')));

  // Staff
  unsubscribes.push(onSnapshot(query(collection(db, 'staff'), orderBy('order', 'desc')), (snapshot) => {
    data.staffData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('staff');
  }, (err) => handleError(err, 'staff', 'staff')));

  // Mission/Vision
  unsubscribes.push(onSnapshot(doc(db, 'missionVision', 'content'), (snapshot) => {
    const docData = snapshot.data();
    data.missionVision = {
      mission: '',
      vision: '',
      ...docData
    } as MissionVision;
    checkAndEmit('missionVision');
  }, (err) => handleError(err, 'missionVision', 'missionVision/content')));

  // Pages
  unsubscribes.push(onSnapshot(collection(db, 'pages'), (snapshot) => {
    const pages = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // Subscribe to players subcollection for each page
    pages.forEach(page => {
      const playersRef = collection(db, 'pages', page.id, 'players');
      const unsubPlayers = onSnapshot(query(playersRef, orderBy('number', 'asc')), (playerSnapshot) => {
        const players = playerSnapshot.docs.map(pd => ({ id: pd.id, ...pd.data() })) as any[];
        const pageIdx = data.pagesData?.findIndex(p => p.id === page.id);
        if (pageIdx !== undefined && pageIdx !== -1) {
          const updatedPagesData = [...(data.pagesData || [])];
          updatedPagesData[pageIdx] = { ...updatedPagesData[pageIdx], players };
          data.pagesData = updatedPagesData;
          callback({ ...data } as CMSData);
        }
      }, (err) => console.error(`Error loading players for page ${page.id}:`, err));
      unsubscribes.push(unsubPlayers);
    });

    data.pagesData = pages;
    checkAndEmit('pages');
  }, (err) => handleError(err, 'pages', 'pages')));

  return () => unsubscribes.forEach(unsub => unsub());
};

// Migration Function
export const migrateDataToFirestore = async (localData: CMSData) => {
  if (!db) {
    console.error("Firebase not initialized. Migration aborted.");
    return;
  }
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
      const { id, players, ...rest } = team;
      const teamId = String(id);
      await setDoc(doc(db, 'teams', teamId), rest);
      
      // Migrate players to subcollection
      if (players && Array.isArray(players)) {
        for (const player of players) {
          const { id: playerId, ...playerData } = player;
          await setDoc(doc(db, 'teams', teamId, 'players', String(playerId || Date.now())), playerData);
        }
      }
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
export const updateSettings = async (settings: SiteSettings) => {
  try {
    return await setDoc(doc(db, 'settings', 'site'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/site');
  }
};

export const updateHomepage = async (hero: HomePageHero) => {
  try {
    return await setDoc(doc(db, 'homepage', 'hero'), hero);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'homepage/hero');
  }
};

export const saveNewsArticle = async (article: Partial<NewsArticle>, id?: string) => {
  try {
    if (id) return await updateDoc(doc(db, 'news', id), article);
    return await addDoc(collection(db, 'news'), { 
      ...article, 
      date: article.date || new Date().toISOString(),
      order: article.order ?? Date.now()
    });
  } catch (err) {
    console.error('[FIRESTORE] News save failed:', err);
    if (err instanceof Error && err.message.includes('too large')) {
      console.error('[FIRESTORE] Document size exceeds 1MB limit. Image might be too large.');
    }
    throw err;
  }
};

export const deleteNewsArticle = (id: string) => deleteDoc(doc(db, 'news', id));

export const saveTeam = async (team: Partial<Team>, id?: string) => {
  try {
    const { players, ...teamData } = team;
    let teamId = id;

    if (teamId) {
      await updateDoc(doc(db, 'teams', teamId), teamData);
    } else {
      const docRef = await addDoc(collection(db, 'teams'), teamData);
      teamId = docRef.id;
    }

    // Save players to subcollection if provided
    if (players && Array.isArray(players)) {
      for (const player of players) {
        const { id: playerId, ...playerData } = player;
        if (playerId && typeof playerId === 'string' && !String(playerId).includes('.')) {
           // Existing player with string ID
           await setDoc(doc(db, 'teams', teamId, 'players', playerId), playerData);
        } else {
           // New player or numeric ID (from local state)
           await addDoc(collection(db, 'teams', teamId, 'players'), playerData);
        }
      }
    }
    return teamId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, id ? `teams/${id}` : 'teams');
  }
};

export const deletePlayer = async (teamId: string, playerId: string) => {
  try {
    await deleteDoc(doc(db, 'teams', teamId, 'players', playerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `teams/${teamId}/players/${playerId}`);
  }
};

export const deleteTeam = (id: string) => deleteDoc(doc(db, 'teams', id));

export const saveGalleryImage = async (image: Partial<GalleryItem>) => {
  try {
    return await addDoc(collection(db, 'gallery'), {
      ...image,
      order: image.order ?? Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'gallery');
  }
};

export const deleteGalleryImage = (id: string) => deleteDoc(doc(db, 'gallery', id));

export const updateMissionVision = async (content: MissionVision) => {
  try {
    return await setDoc(doc(db, 'missionVision', 'content'), content);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'missionVision/content');
  }
};

export const saveStaffMember = async (member: Partial<StaffMember>, id?: string) => {
  try {
    if (id) return await updateDoc(doc(db, 'staff', id), member);
    return await addDoc(collection(db, 'staff'), {
      ...member,
      order: member.order ?? Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, id ? `staff/${id}` : 'staff');
  }
};

export const deleteStaffMember = (id: string) => deleteDoc(doc(db, 'staff', id));

export const savePage = async (page: Partial<DynamicPage>, id?: string) => {
  try {
    const { players, ...pageData } = page;
    let pageId = id;

    if (pageId) {
      await updateDoc(doc(db, 'pages', pageId), pageData);
    } else {
      const docRef = await addDoc(collection(db, 'pages'), pageData);
      pageId = docRef.id;
    }

    // Save players to subcollection
    if (players && Array.isArray(players)) {
      for (const player of players) {
        const { id: playerId, ...playerData } = player;
        if (playerId && typeof playerId === 'string' && !String(playerId).includes('.')) {
          await setDoc(doc(db, 'pages', pageId, 'players', playerId), playerData);
        } else {
          await addDoc(collection(db, 'pages', pageId, 'players'), playerData);
        }
      }
    }
    return pageId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, id ? `pages/${id}` : 'pages');
  }
};

export const deletePagePlayer = async (pageId: string, playerId: string) => {
  try {
    await deleteDoc(doc(db, 'pages', pageId, 'players', playerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `pages/${pageId}/players/${playerId}`);
  }
};

export const deletePage = (id: string) => deleteDoc(doc(db, 'pages', id));

export const updateOrder = (collectionName: string, id: string, newOrder: number) =>
  updateDoc(doc(db, collectionName, id), { order: newOrder });

export const saveFixture = async (fixture: Fixture) => {
  try {
    return await setDoc(doc(db, 'fixtures', fixture.teamSlug), {
      ...fixture,
      order: fixture.order ?? Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `fixtures/${fixture.teamSlug}`);
  }
};

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
