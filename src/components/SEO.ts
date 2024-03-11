import type { AstroGlobal } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, TWITTER_HANDLE } from '../consts';

export type SEOProps = {
  title: string;
  description: string;
  image: string;
  image_width: number;
  image_height: number;
  image_alt: string;
  generator: string;
  canonical: string;
  sitemap: string;
  rss: {
    url: string;
    title: string;
  };
  twitter: {
    handle: string;
    cardType: string;
  };
  ogType: 'website' | 'article';
};

export type PartialSEOProps = Partial<SEOProps>;

export function defaultSEOProps(astro: AstroGlobal): SEOProps {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/jb.png`,
    image_width: 512,
    image_height: 512,
    image_alt: `Cover picture for ${SITE_TITLE}`,
    generator: astro.generator,
    canonical: `${SITE_URL}${astro.url.pathname}`,
    sitemap: `${SITE_URL}/sitemap-index.xml`,
    rss: {
      url: `${SITE_URL}/posts/index.xml`,
      title: `${SITE_TITLE}`,
    },
    twitter: {
      handle: TWITTER_HANDLE,
      cardType: 'summary_large_image',
    },
    ogType: 'website',
  };
}
