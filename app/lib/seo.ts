import type { MetaFunction } from '@remix-run/cloudflare';

/**
 * Helper to generate consistent meta tags for any route
 */
export function getDefaultMeta(
  title: string,
  description: string,
  path: string = '/'
): ReturnType<MetaFunction> {
  const url = `https://sharelock.cc${path}`;
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'twitter:title', content: title },
    { property: 'twitter:description', content: description },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
  ];
}
