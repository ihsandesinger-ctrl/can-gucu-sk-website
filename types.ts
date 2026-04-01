
export interface Player {
  id: number;
  name: string;
  position: string;
  number: number;
  imageUrl: string;
}

export interface Coach {
  name: string;
  role: string;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  heroImage: string;
  coach: Coach;
  players: Player[];
}

export interface Match {
  date: string;
  opponent: string;
  score?: string;
  location: 'Ev' | 'Deplasman';
  homeLogo?: string;
  awayLogo?: string;
}

export interface Fixture {
    teamName: string;
    teamSlug: string;
    matches: Match[];
    order?: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  date: string;
  imageUrl: string;
  order?: number;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  title?: string;
  order?: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
  order?: number;
}

export interface MissionVision {
  mission: string;
  vision: string;
}

export interface Announcement {
  title: string;
  date: string;
  content: string;
}

export interface DynamicPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  heroImage: string;
  coach?: Coach;
  players?: Player[];
  announcements?: Announcement[];
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
}

export interface NavigationItem {
  name: string;
  path?: string;
  visible?: boolean;
  isDropdown?: boolean;
  items?: NavigationItem[];
}

export interface GlobalStyles {
  fontFamily: string;
  baseFontSize: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface HomepageSection {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface SiteSettings {
  siteTitle?: string;
  logo: string;
  address: string;
  email: string;
  phone: string;
  socialMedia?: SocialMediaLinks;
  maintenanceMode: boolean;
  navigation: NavigationItem[];
  globalStyles: GlobalStyles;
}

export interface HomePageHero {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  sections: HomepageSection[];
}

export interface CMSData {
  siteSettings: SiteSettings;
  homePageHero: HomePageHero;
  teamData: Team[];
  fixtures: Fixture[];
  newsData: NewsArticle[];
  galleryData: GalleryItem[];
  staffData: StaffMember[];
  pagesData: DynamicPage[];
  missionVision: MissionVision;
  isFallback?: boolean;
}
