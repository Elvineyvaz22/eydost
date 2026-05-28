export interface BlogContent {
  title: string;
  description: string;
  sections: BlogSection[];
}

export interface BlogSection {
  heading?: string;
  body: string;
  list?: string[];
}

export const BLOG_CATEGORY_IMAGES: Record<BlogPost['category'], string> = {
  esim: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
  taxi: 'https://images.unsplash.com/photo-1449965403869-f00bc5ca6da0?w=800&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
};

export interface BlogPost {
  slug: string;
  category: 'esim' | 'taxi' | 'travel';
  publishedAt: string;
  readingMinutes: number;
  /** Featured image URL (card + article header). Falls back to category image. */
  image?: string;
  en: BlogContent;
  az: BlogContent;
  ru: BlogContent;
  tr?: BlogContent;
  ar?: BlogContent;
  es?: BlogContent;
  zh?: BlogContent;
}
