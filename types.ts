
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

export interface SiteSettings {
  logo: string;
  address: string;
  email: string;
  phone: string;
  socialMedia?: SocialMediaLinks;
}

export interface HomePageHero {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
}

export interface CMSData {
  siteSettings: SiteSettings;
  homePageHero: HomePageHero;
  teamData: Team[];
  fixtures: Fixture[];
  newsData: NewsArticle[];
  galleryData: GalleryItem[];
  staffData: StaffMember[];
  missionVision: MissionVision;
}