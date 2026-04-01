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
export const getCMSData = async (): Promise<CMSData> => {
  if (!db) throw new Error("Firebase not initialized");

  const collections = [
    { path: 'settings/site', key: 'siteSettings' },
    { path: 'homepage/hero', key: 'homePageHero' },
    { path: 'missionVision/content', key: 'missionVision' },
    { path: 'news', key: 'newsData', isCollection: true, query: query(collection(db, 'news'), orderBy('order', 'desc'), limit(50)) },
    { path: 'teams', key: 'teamData', isCollection: true },
    { path: 'fixtures', key: 'fixtures', isCollection: true, query: query(collection(db, 'fixtures'), orderBy('order', 'desc')) },
    { path: 'gallery', key: 'galleryData', isCollection: true, query: query(collection(db, 'gallery'), orderBy('order', 'desc'), limit(50)) },
    { path: 'staff', key: 'staffData', isCollection: true, query: query(collection(db, 'staff'), orderBy('order', 'desc')) },
    { path: 'pages', key: 'pagesData', isCollection: true }
  ];

  const data: Partial<CMSData> = {};

  try {
    // Try to load from cache first for instant UI
    console.log('[FIRESTORE] Attempting to load from cache...');
    const cachePromises = collections.map(async (col) => {
      try {
        if (col.isCollection) {
          const q = col.query || collection(db, col.path);
          const snap = await getDocs(q); // Firestore handles cache automatically if persistence is enabled
          data[col.key as keyof CMSData] = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;
        } else {
          const snap = await getDoc(doc(db, col.path.split('/')[0], col.path.split('/')[1]));
          if (snap.exists()) {
            data[col.key as keyof CMSData] = snap.data() as any;
          }
        }
      } catch (e) {
        console.warn(`[FIRESTORE] Cache load failed for ${col.path}:`, e);
      }
    });

    await Promise.all(cachePromises);

    // If we have enough data from cache, return it immediately
    if (data.siteSettings && data.homePageHero) {
      console.log('[FIRESTORE] Loaded from cache successfully');
      // We still want to trigger a background fetch to update the cache
      // but we return the cached data for speed
      return { ...data, isFallback: false } as CMSData;
    }

    // Fallback to server if cache is empty
    console.log('[FIRESTORE] Cache empty or incomplete, fetching from server...');
    const [settingsSnap, heroSnap, missionSnap, newsSnap, teamsSnap, fixturesSnap, gallerySnap, staffSnap, pagesSnap] = await Promise.all([
      getDoc(doc(db, 'settings', 'site')),
      getDoc(doc(db, 'homepage', 'hero')),
      getDoc(doc(db, 'missionVision', 'content')),
      getDocs(query(collection(db, 'news'), orderBy('order', 'desc'), limit(50))),
      getDocs(collection(db, 'teams')),
      getDocs(query(collection(db, 'fixtures'), orderBy('order', 'desc'))),
      getDocs(query(collection(db, 'gallery'), orderBy('order', 'desc'), limit(50))),
      getDocs(query(collection(db, 'staff'), orderBy('order', 'desc'))),
      getDocs(collection(db, 'pages'))
    ]);

    const serverData: Partial<CMSData> = {
      siteSettings: settingsSnap.exists() ? settingsSnap.data() as SiteSettings : undefined,
      homePageHero: heroSnap.exists() ? heroSnap.data() as HomePageHero : undefined,
      missionVision: missionSnap.exists() ? missionSnap.data() as MissionVision : undefined,
      newsData: newsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any,
      fixtures: fixturesSnap.docs.map(d => d.data()) as any,
      galleryData: gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })) as any,
      staffData: staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any,
      teamData: teamsSnap.docs.map(d => ({ id: d.id, ...d.data(), players: [] })) as any,
      pagesData: pagesSnap.docs.map(d => ({ id: d.id, ...d.data(), players: [] })) as any
    };

    return { ...serverData, isFallback: false } as CMSData;
  } catch (err) {
    console.error('[FIRESTORE] Error fetching CMS data:', err);
    throw err;
  }
};

export const getTeamPlayers = async (teamId: string) => {
  try {
    const playersSnap = await getDocs(query(collection(db, 'teams', teamId, 'players'), orderBy('number', 'asc')));
    return playersSnap.docs.map(pd => ({ id: pd.id, ...pd.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `teams/${teamId}/players`);
    return [];
  }
};

export const getPagePlayers = async (pageId: string) => {
  try {
    const playersSnap = await getDocs(query(collection(db, 'pages', pageId, 'players'), orderBy('number', 'asc')));
    return playersSnap.docs.map(pd => ({ id: pd.id, ...pd.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `pages/${pageId}/players`);
    return [];
  }
};

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
  const playerUnsubscribes = new Map<string, () => void>();
  const loadedCollections = new Set<string>();

  const checkAndEmit = (collectionName: string) => {
    loadedCollections.add(collectionName);
    if (loadedCollections.size === totalCollections) {
      const isFallback = !data.siteSettings || !data.homePageHero || !data.missionVision;
      callback({ ...data, isFallback } as CMSData);
    }
  };

  const handleError = (err: any, collectionName: string, path: string) => {
    console.error(`Error loading ${collectionName}:`, err);
    checkAndEmit(collectionName);
  };

  // Settings
  unsubscribes.push(onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
    if (snapshot.exists()) {
      data.siteSettings = { id: snapshot.id, ...snapshot.data() } as any;
    }
    checkAndEmit('settings');
  }, (err) => handleError(err, 'settings', 'settings/site')));

  // Homepage
  unsubscribes.push(onSnapshot(doc(db, 'homepage', 'hero'), (snapshot) => {
    if (snapshot.exists()) {
      data.homePageHero = { id: snapshot.id, ...snapshot.data() } as any;
    }
    checkAndEmit('homepage');
  }, (err) => handleError(err, 'homepage', 'homepage/hero')));

  // News
  unsubscribes.push(onSnapshot(query(collection(db, 'news'), orderBy('order', 'desc'), limit(50)), (snapshot) => {
    data.newsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    checkAndEmit('news');
  }, (err) => handleError(err, 'news', 'news')));

  // Teams
  unsubscribes.push(onSnapshot(collection(db, 'teams'), (snapshot) => {
    const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data(), players: [] })) as any[];
    data.teamData = teams;

    // Manage player sub-subscriptions
    teams.forEach(team => {
      if (!playerUnsubscribes.has(`team_${team.id}`)) {
        const unsub = onSnapshot(query(collection(db, 'teams', team.id, 'players'), orderBy('number', 'asc')), (pSnap) => {
          const players = pSnap.docs.map(pd => ({ id: pd.id, ...pd.data() }));
          const teamIdx = data.teamData?.findIndex(t => t.id === team.id);
          if (teamIdx !== undefined && teamIdx !== -1) {
            const updated = [...(data.teamData || [])];
            updated[teamIdx] = { ...updated[teamIdx], players: players as any };
            data.teamData = updated;
            callback({ ...data } as CMSData);
          }
        });
        playerUnsubscribes.set(`team_${team.id}`, unsub);
      }
    });

    // Cleanup unsubscribes for deleted teams
    const teamIds = new Set(teams.map(t => t.id));
    for (const key of playerUnsubscribes.keys()) {
      if (key.startsWith('team_')) {
        const id = key.replace('team_', '');
        if (!teamIds.has(id)) {
          playerUnsubscribes.get(key)?.();
          playerUnsubscribes.delete(key);
        }
      }
    }

    checkAndEmit('teams');
  }, (err) => handleError(err, 'teams', 'teams')));

  // Fixtures
  unsubscribes.push(onSnapshot(query(collection(db, 'fixtures'), orderBy('order', 'desc')), (snapshot) => {
    data.fixtures = snapshot.docs.map(d => d.data()) as any;
    checkAndEmit('fixtures');
  }, (err) => handleError(err, 'fixtures', 'fixtures')));

  // Gallery
  unsubscribes.push(onSnapshot(query(collection(db, 'gallery'), orderBy('order', 'desc'), limit(50)), (snapshot) => {
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
    if (snapshot.exists()) {
      data.missionVision = snapshot.data() as any;
    }
    checkAndEmit('missionVision');
  }, (err) => handleError(err, 'missionVision', 'missionVision/content')));

  // Pages
  unsubscribes.push(onSnapshot(collection(db, 'pages'), (snapshot) => {
    const pages = snapshot.docs.map(d => ({ id: d.id, ...d.data(), players: [] })) as any[];
    data.pagesData = pages;

    pages.forEach(page => {
      if (!playerUnsubscribes.has(`page_${page.id}`)) {
        const unsub = onSnapshot(query(collection(db, 'pages', page.id, 'players'), orderBy('number', 'asc')), (pSnap) => {
          const players = pSnap.docs.map(pd => ({ id: pd.id, ...pd.data() }));
          const pageIdx = data.pagesData?.findIndex(p => p.id === page.id);
          if (pageIdx !== undefined && pageIdx !== -1) {
            const updated = [...(data.pagesData || [])];
            updated[pageIdx] = { ...updated[pageIdx], players: players as any };
            data.pagesData = updated;
            callback({ ...data } as CMSData);
          }
        });
        playerUnsubscribes.set(`page_${page.id}`, unsub);
      }
    });

    const pageIds = new Set(pages.map(p => p.id));
    for (const key of playerUnsubscribes.keys()) {
      if (key.startsWith('page_')) {
        const id = key.replace('page_', '');
        if (!pageIds.has(id)) {
          playerUnsubscribes.get(key)?.();
          playerUnsubscribes.delete(key);
        }
      }
    }

    checkAndEmit('pages');
  }, (err) => handleError(err, 'pages', 'pages')));

  return () => {
    unsubscribes.forEach(unsub => unsub());
    playerUnsubscribes.forEach(unsub => unsub());
  };
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
