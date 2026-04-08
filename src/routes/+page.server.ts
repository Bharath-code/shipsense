import type { PageServerLoad } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$convex/_generated/api';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

export const load: PageServerLoad = async () => {
	let foundingMemberCount = 0;
	try {
		const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
		foundingMemberCount = await client.query(api.foundingMembers.getFoundingMemberCount, {});
	} catch {
		// If Convex is unavailable, fall back to 0
		foundingMemberCount = 0;
	}

	return { foundingMemberCount };
};
