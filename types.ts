
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
}

export interface Fixture {
    teamName: string;
    teamSlug: string;
    matches: Match[];
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  date: string;
  imageUrl: string;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  title?: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
}

export interface MissionVision {
  mission: string;
  vision: string;
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

export interface Branch {
  name: string;
  slug: string;
  heroImage: string;
  description: string;
  content: string;
  coach?: Coach;
  players?: Player[];
}

export interface CMSData {
  siteSettings: SiteSettings;
  homePageHero: HomePageHero;
  teamData: Team[];
  branchData: Branch[];
  fixtures: Fixture[];
  newsData: NewsArticle[];
  galleryData: GalleryItem[];
  staffData: StaffMember[];
  missionVision: MissionVision;
}