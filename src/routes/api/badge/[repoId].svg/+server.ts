import type { RequestHandler } from './$types';
import { generateBadge } from '$lib/badge/generateBadge';

const CONVEX_URL = 'https://wary-lapwing-596.eu-west-1.convex.cloud';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const identifier = params.repoId as string;

	try {
		// Try querying by repoId first
		let res = await fetch(`${CONVEX_URL}/api/query`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				path: 'dashboard:getPublicRepoHealthById',
				args: { repoId: identifier }
			})
		});

		// If not found, try querying by slug
		if (!res.ok) {
			res = await fetch(`${CONVEX_URL}/api/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					path: 'dashboard:getPublicRepoHealth',
					args: { slug: identifier }
				})
			});
		}

		if (!res.ok) {
			return new Response(generateBadge(null), {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=300'
				}
			});
		}

		const result = await res.json();
		// Convex wraps response in {status: "success", value: {...}}
		const data = result.value || result;
		if (!data || data.healthScore === null || data.healthScore === undefined) {
			return new Response(generateBadge(null), {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=300'
				}
			});
		}

		const svg = generateBadge(data.healthScore);

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		console.error('Badge generation error:', e);
		return new Response(generateBadge(null), {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=300'
			}
		});
	}
};
