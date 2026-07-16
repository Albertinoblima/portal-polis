export type UserRole =
  | "admin"
  | "editor_chief"
  | "editor"
  | "reviewer"
  | "columnist"
  | "user";

export interface User {
  id: string;
  /** Omitido no conteúdo público sincronizado do Supabase (ver scripts/sync-content.mjs). */
  email?: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  bio?: string;
  socials?: Partial<Record<"twitter" | "instagram" | "linkedin", string>>;
  /** Omitidos no conteúdo público sincronizado do Supabase (a view authors_public não os expõe). */
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
  linkUrl: string;
  position: "home_hero" | "home_secondary" | "sidebar";
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  preferences: string[];
  confirmedAt?: string;
  unsubscribedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  handledAt?: string;
  createdAt: string;
}
