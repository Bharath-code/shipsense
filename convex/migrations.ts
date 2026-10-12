import { internalMutation } from './_generated/server';

// Run with: npx convex run migrations:backfillSlugs
export const backfillSlugs = internalMutation({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.db.query('repos').collect();
		let count = 0;

		for (const repo of repos) {
			if (!repo.slug) {
				await ctx.db.patch(repo._id, {
					slug: `${repo.owner.toLowerCase()}-${repo.name.toLowerCase()}`
				});
				count++;
			}
		}

		return { backfilled: count };
	}
});
