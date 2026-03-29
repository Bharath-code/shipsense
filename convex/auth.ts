import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          // Request access to user repos for API calls
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile, provider, account }) {
      if (existingUserId) {
        // Update access token on re-login
        await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", existingUserId))
          .unique()
          .then(async (existing) => {
            if (existing && account?.access_token) {
              await ctx.db.patch(existing._id, {
                githubAccessToken: account.access_token,
                avatarUrl: profile.image ?? existing.avatarUrl,
              });
            }
          });
        return existingUserId;
      }
      // Create user in Convex auth
      const userId = await ctx.db.insert("users", {
        name: profile.name ?? profile.email ?? "User",
        email: profile.email ?? "",
        emailVerificationTime: Date.now(),
        image: profile.image,
      });
      // Create profile
      await ctx.db.insert("userProfiles", {
        userId,
        githubUsername: (profile as any).login ?? "",
        githubAccessToken: account?.access_token ?? "",
        avatarUrl: profile.image ?? "",
        plan: "free",
        emailReportsEnabled: true,
        createdAt: Date.now(),
      });
      return userId;
    },
  },
});
