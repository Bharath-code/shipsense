import type { PageServerLoad } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$convex/_generated/api';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

export const load: PageServerLoad = async () => {
	let foundingMemberCount = 0;
	let stats = { totalUsers: 0, totalRepos: 0, totalLeads: 0, totalTracked: 0 };

	try {
		const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
		const [count, statsData] = await Promise.all([
			client.query(api.foundingMembers.getFoundingMemberCount, {}),
			client.query(api.foundingMembers.getPlatformStats, {})
		]);
		foundingMemberCount = count;
		stats = statsData;
	} catch {
		// If Convex is unavailable, fall back to 0
		foundingMemberCount = 0;
	}

	return { foundingMemberCount, stats };
};
