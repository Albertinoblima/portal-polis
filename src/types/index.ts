export type UserRole =
  | "admin"
  | "editor_chief"
  | "editor"
  | "reviewer"
  | "columnist"
  | "user";

export interface User {
  id: string;
  /** Omitido do manifesto público em src/content/authors.json. */
  email?: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  bio?: string;
  socials?: Partial<Record<"twitter" | "instagram" | "linkedin", string>>;
  /** Omitidos do manifesto público em src/content/authors.json. */
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "scheduled"
  | "archived";

export interface Editoria {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  editoriaId: string;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  altText: string;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  authorName: string;
  content: string;
  parentId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  /** Vídeo derivado (MP4) quando featuredImage era um GIF — ver scripts/transcode-gif-media.mjs. */
  featuredVideoUrl?: string;
  /** Calculado em scripts/sync-content.mjs (precisa bater com getAllEditionsAscending() em
   * src/lib/editions.ts). Redundante por design — o site calcula o número de edição em
   * build via editions.ts; este campo existe só pro preâmbulo falado do áudio
   * (scripts/generate-audio.mjs), que não pode importar módulos TS. */
  editionNumber?: number;
  editoriaId: string;
  authorId: string;
  categoryIds: string[];
  tagIds: string[];
  status: ArticleStatus;
  publishedAt: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  readingTimeMinutes: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Edition {
  /** 1 = primeira edição (mais antiga); cresce a cada novo dia com matéria publicada. */
  number: number;
  /** "YYYY-MM-DD" — dia de publicação das matérias desta edição. */
  date: string;
  /** Matérias publicadas neste dia, da mais recente para a mais antiga. */
  articles: Article[];
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  /** Vídeo derivado (MP4) quando imageUrl era um GIF — ver scripts/transcode-gif-media.mjs. */
  videoUrl?: string;
  linkUrl: string;
  position: "sidebar";
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export type HeadingFont = "eb-garamond" | "playfair-display" | "merriweather";
export type BodyFont = "inter" | "source-sans-3" | "ibm-plex-sans";

export interface SiteSettings {
  siteName: string;
  tagline: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  colorPrimary: string;
  colorAccent: string;
  colorPaper: string;
  fontHeading: HeadingFont;
  fontBody: BodyFont;
  navLinks: NavLink[];
  footerLinks: NavLink[];
  socialLinks: SocialLink[];
}
