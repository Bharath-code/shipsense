import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export const fetchUserReposFromGithub = action({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // @convex-dev/auth encodes subject as "userId|sessionId"
    const userId = identity.subject.split("|")[0];

    const tokens = (await ctx.runQuery(internal.users.getGithubToken, {
      subject: userId,
    })) as any;

    if (!tokens || !tokens.accessToken) {
      throw new Error("No GitHub access token found for user: " + userId);
    }

    const query = `
      query {
        viewer {
          repositories(first: 50, ownerAffiliations: [OWNER, COLLABORATOR], orderBy: {field: PUSHED_AT, direction: DESC}) {
            nodes {
              databaseId
              owner { login }
              name
              nameWithOwner
              description
              stargazerCount
              forkCount
              isPrivate
              primaryLanguage { name }
            }
          }
        }
      }
    `;

    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const json = (await response.json()) as any;
    return json.data.viewer.repositories.nodes.map((repo: any) => ({
      githubRepoId: repo.databaseId,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.nameWithOwner,
      description: repo.description,
      starsCount: repo.stargazerCount,
      forksCount: repo.forkCount,
      isPrivate: repo.isPrivate,
      language: repo.primaryLanguage?.name,
    }));
  },
});
