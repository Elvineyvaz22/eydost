import { Navigate, useParams } from 'react-router-dom';
import LocaleBlogSync from '../components/LocaleBlogSync';
import Blog from '../pages/Blog';
import BlogPost from '../pages/BlogPost';
import {
  blogPath,
  DEFAULT_LOCALE,
  isLocalizedPathLocale,
} from '../utils/localePaths';

export function LegacyBlogIndexRedirect() {
  return <Navigate to={blogPath()} replace />;
}

export function LegacyBlogPostRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to={blogPath()} replace />;
  return <Navigate to={blogPath(slug)} replace />;
}

export function LocalizedBlogIndexRoute() {
  const { lang } = useParams<{ lang: string }>();
  if (!lang || !isLocalizedPathLocale(lang)) {
    return <Navigate to={blogPath()} replace />;
  }
  return (
    <LocaleBlogSync locale={lang}>
      <Blog contentLocale={lang} />
    </LocaleBlogSync>
  );
}

export function LocalizedBlogPostRoute() {
  const { lang, slug } = useParams<{ lang: string; slug: string }>();
  if (!slug) return <Navigate to={blogPath()} replace />;
  if (!lang || !isLocalizedPathLocale(lang)) {
    return <Navigate to={blogPath(slug, DEFAULT_LOCALE)} replace />;
  }
  return (
    <LocaleBlogSync locale={lang}>
      <BlogPost contentLocale={lang} />
    </LocaleBlogSync>
  );
}
