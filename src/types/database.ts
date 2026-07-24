// Tipos gerados manualmente a partir de supabase/migrations/0001_init.sql.
// Ao alterar o schema, mantenha este arquivo em sincronia — ou, com o projeto
// já linkado, prefira `npx supabase gen types typescript --linked` para gerar
// automaticamente.

export type UserRole = "admin" | "editor_chief" | "editor" | "reviewer" | "columnist" | "user";

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "scheduled"
  | "archived";

export type CommentStatus = "pending" | "approved" | "rejected";
export type BannerPosition = "home_hero" | "home_secondary" | "sidebar";
export type HeadingFont = "eb-garamond" | "playfair-display" | "merriweather";
export type BodyFont = "inter" | "source-sans-3" | "ibm-plex-sans";

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

interface Relationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

type Table<
  Row,
  Insert,
  Update = Partial<Insert>,
  Relationships extends readonly Relationship[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: UserRole;
          bio: string | null;
          socials: Record<string, string>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        { id: string } & Partial<{
          email: string;
          name: string;
          avatar_url: string | null;
          role: UserRole;
          bio: string | null;
          socials: Record<string, string>;
          is_active: boolean;
        }>
      >;
      editorias: Table<
        {
          id: string;
          name: string;
          slug: string;
          color: string;
          description: string;
          is_active: boolean;
          created_at: string;
        },
        { name: string; slug: string; color: string } & Partial<{
          id: string;
          description: string;
          is_active: boolean;
          created_at: string;
        }>
      >;
      categories: Table<
        {
          id: string;
          name: string;
          slug: string;
          editoria_id: string;
          parent_id: string | null;
          created_at: string;
        },
        { name: string; slug: string; editoria_id: string } & Partial<{
          id: string;
          parent_id: string | null;
          created_at: string;
        }>
      >;
      tags: Table<
        { id: string; name: string; slug: string },
        { name: string; slug: string } & Partial<{ id: string }>
      >;
      articles: Table<
        {
          id: string;
          title: string;
          slug: string;
          subtitle: string;
          content: string;
          featured_image: string | null;
          featured_image_alt: string;
          editoria_id: string;
          author_id: string;
          status: ArticleStatus;
          published_at: string | null;
          scheduled_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          reading_time_minutes: number;
          view_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        { title: string; slug: string; editoria_id: string; author_id: string } & Partial<{
          id: string;
          subtitle: string;
          content: string;
          featured_image: string | null;
          featured_image_alt: string;
          status: ArticleStatus;
          published_at: string | null;
          scheduled_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          reading_time_minutes: number;
          view_count: number;
          deleted_at: string | null;
        }>,
        Partial<{
          title: string;
          slug: string;
          subtitle: string;
          content: string;
          featured_image: string | null;
          featured_image_alt: string;
          editoria_id: string;
          author_id: string;
          status: ArticleStatus;
          published_at: string | null;
          scheduled_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          reading_time_minutes: number;
          view_count: number;
          deleted_at: string | null;
        }>,
        [
          {
            foreignKeyName: "articles_editoria_id_fkey";
            columns: ["editoria_id"];
            isOneToOne: false;
            referencedRelation: "editorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      article_categories: Table<
        { article_id: string; category_id: string },
        { article_id: string; category_id: string },
        Partial<{ article_id: string; category_id: string }>,
        [
          {
            foreignKeyName: "article_categories_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      article_tags: Table<
        { article_id: string; tag_id: string },
        { article_id: string; tag_id: string },
        Partial<{ article_id: string; tag_id: string }>,
        [
          {
            foreignKeyName: "article_tags_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ]
      >;
      comments: Table<
        {
          id: string;
          article_id: string;
          user_id: string | null;
          author_name: string;
          content: string;
          parent_id: string | null;
          status: CommentStatus;
          created_at: string;
        },
        { article_id: string; author_name: string; content: string } & Partial<{
          id: string;
          user_id: string | null;
          parent_id: string | null;
          status: CommentStatus;
          created_at: string;
        }>,
        Partial<{
          article_id: string;
          user_id: string | null;
          author_name: string;
          content: string;
          parent_id: string | null;
          status: CommentStatus;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ]
      >;
      media: Table<
        {
          id: string;
          filename: string;
          url: string;
          mime_type: string;
          size: number;
          alt_text: string;
          uploaded_by: string;
          created_at: string;
        },
        {
          filename: string;
          url: string;
          mime_type: string;
          size: number;
          uploaded_by: string;
        } & Partial<{ id: string; alt_text: string; created_at: string }>
      >;
      banners: Table<
        {
          id: string;
          title: string;
          image_url: string;
          link_url: string;
          position: BannerPosition;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
        },
        { title: string; image_url: string } & Partial<{
          id: string;
          link_url: string;
          position: BannerPosition;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
        }>
      >;
      newsletter_subscribers: Table<
        {
          id: string;
          email: string;
          name: string | null;
          preferences: string[];
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
        },
        { email: string } & Partial<{
          id: string;
          name: string | null;
          preferences: string[];
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
        }>
      >;
      staff_editorias: Table<
        { profile_id: string; editoria_id: string },
        { profile_id: string; editoria_id: string },
        Partial<{ profile_id: string; editoria_id: string }>,
        [
          {
            foreignKeyName: "staff_editorias_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_editorias_editoria_id_fkey";
            columns: ["editoria_id"];
            isOneToOne: false;
            referencedRelation: "editorias";
            referencedColumns: ["id"];
          },
        ]
      >;
      contact_messages: Table<
        {
          id: string;
          name: string;
          email: string;
          message: string;
          handled_at: string | null;
          created_at: string;
        },
        { name: string; email: string; message: string } & Partial<{
          id: string;
          handled_at: string | null;
          created_at: string;
        }>
      >;
      game_players: Table<
        {
          id: string;
          name: string;
          email: string | null;
          game: string;
          wants_newsletter: boolean;
          created_at: string;
        },
        { name: string } & Partial<{
          id: string;
          email: string | null;
          game: string;
          wants_newsletter: boolean;
          created_at: string;
        }>
      >;
      audit_logs: Table<
        {
          id: string;
          user_id: string;
          action: string;
          entity: string;
          entity_id: string;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          created_at: string;
        },
        {
          user_id: string;
          action: string;
          entity: string;
          entity_id: string;
        } & Partial<{
          id: string;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          created_at: string;
        }>,
        Partial<{
          user_id: string;
          action: string;
          entity: string;
          entity_id: string;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          created_at: string;
        }>,
        [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      site_settings: Table<
        {
          id: number;
          site_name: string;
          tagline: string;
          default_seo_title: string;
          default_seo_description: string;
          logo_url: string | null;
          favicon_url: string | null;
          color_primary: string;
          color_accent: string;
          color_paper: string;
          font_heading: HeadingFont;
          font_body: BodyFont;
          nav_links: NavLink[];
          footer_links: NavLink[];
          social_links: SocialLink[];
          updated_at: string;
        },
        Partial<{
          id: number;
          site_name: string;
          tagline: string;
          default_seo_title: string;
          default_seo_description: string;
          logo_url: string | null;
          favicon_url: string | null;
          color_primary: string;
          color_accent: string;
          color_paper: string;
          font_heading: HeadingFont;
          font_body: BodyFont;
          nav_links: NavLink[];
          footer_links: NavLink[];
          social_links: SocialLink[];
          updated_at: string;
        }>
      >;
    };
    Views: {
      authors_public: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          socials: Record<string, string>;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
