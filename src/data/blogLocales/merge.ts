import type { BlogPost } from '../blogTypes';
import { BLOG_LOCALES } from './index';

export function applyBlogLocales(post: BlogPost): BlogPost {
  const extra = BLOG_LOCALES[post.slug];
  if (!extra) return post;
  return {
    ...post,
    tr: post.tr ?? extra.tr,
    ar: post.ar ?? extra.ar,
    es: post.es ?? extra.es,
    zh: post.zh ?? extra.zh,
  };
}
