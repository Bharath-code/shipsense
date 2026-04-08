import type { RequestHandler } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$convex/_generated/api';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

const BASE_URL = 'https://shipsense.app';

const staticPages = [
	{ loc: '/', changefreq: 'weekly', priority: '1.0' },
	{ loc: '/auth/login', changefreq: 'monthly', priority: '0.6' },
	{ loc: '/legal/privacy', changefreq: 'monthly', priority: '0.5' },
	{ loc: '/legal/terms', changefreq: 'monthly', priority: '0.5' },
];

/**
 * GET /sitemap.xml
 *
 * Generates a sitemap with:
 * - Static marketing pages
 * - All public health pages (/p/[slug]) for active repos
 */
export const GET: RequestHandler = async () => {
	let publicSlugs: string[] = [];
	try {
		const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
		publicSlugs = await client.query(api.dashboard.listPublicSlugs, {});
	} catch {
		// If Convex is unavailable, still serve static pages
		console.warn('Could not fetch public slugs for sitemap');
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((page) =>
	`  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
).join('\n')}
${publicSlugs.map((slug) =>
	`  <url>
    <loc>${BASE_URL}/p/${slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=43200',
		},
	});
};
