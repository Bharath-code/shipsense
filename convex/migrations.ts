import { mutation } from './_generated/server';

export const backfillSlugs = mutation({
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
