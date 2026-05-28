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

export interface BlogPost {
  slug: string;
  category: 'esim' | 'taxi' | 'travel';
  publishedAt: string;
  readingMinutes: number;
  en: BlogContent;
  az: BlogContent;
  ru: BlogContent;
  tr?: BlogContent;
  ar?: BlogContent;
  es?: BlogContent;
  zh?: BlogContent;
}
