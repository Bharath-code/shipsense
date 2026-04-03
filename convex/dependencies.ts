import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { fetchNpmAdvisorySummary, fetchNpmPackageMetadata } from './npmRegistry';

export type DependencyManifest = {
	path: string;
	content: string;
};

export type ParsedDependency = {
	name: string;
	ecosystem: 'npm' | 'pypi';
	manifestPath: string;
	currentRequirement: string;
	currentVersion: string;
};

type DependencyRecord = ParsedDependency & {
	latestVersion?: string;
	isOutdated: boolean;
	outdatedType: 'none' | 'patch' | 'minor' | 'major' | 'unknown';
	isDeprecated: boolean;
	deprecationMessage?: string;
	hasVulnerability: boolean;
	vulnerabilitySeverity: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown';
	vulnerabilitySummary?: string;
	lastCheckedAt: number;
};

type DependencySummary = {
	total: number;
	outdated: number;
	majorOutdated: number;
	deprecated: number;
	vulnerable: number;
};

type GitHubTreeItem = {
	path: string;
	type: string;
};

type GitHubRepoResponse = {
	default_branch?: string;
};

type GitHubTreeResponse = {
	tree?: GitHubTreeItem[];
};

type PackageJsonFile = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

type PackageLockFile = {
	packages?: Record<
		string,
		{
			version?: string;
		}
	>;
};

function normalizeVersionSpec(spec: string): string {
	return spec.trim().replace(/^[~^<>=\s]+/, '').replace(/,.+$/, '');
}

function parseSemver(version: string): [number, number, number] | null {
	const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function getOutdatedType(
	currentVersion: string,
	latestVersion?: string
): 'none' | 'patch' | 'minor' | 'major' | 'unknown' {
	if (!latestVersion) return 'unknown';

	const current = parseSemver(currentVersion);
	const latest = parseSemver(latestVersion);
	if (!current || !latest) return 'unknown';
	if (current[0] === latest[0] && current[1] === latest[1] && current[2] === latest[2]) {
		return 'none';
	}
	if (latest[0] > current[0]) return 'major';
	if (latest[1] > current[1]) return 'minor';
	if (latest[2] > current[2]) return 'patch';
	return 'none';
}

function parsePackageJsonDependencies(
	manifest: DependencyManifest,
	lockManifest?: DependencyManifest
): ParsedDependency[] {
	const packageJson = JSON.parse(manifest.content) as PackageJsonFile;
	const packageLock = lockManifest ? (JSON.parse(lockManifest.content) as PackageLockFile) : null;
	const sections = [
		packageJson.dependencies ?? {},
		packageJson.devDependencies ?? {},
		packageJson.optionalDependencies ?? {},
		packageJson.peerDependencies ?? {}
	];
	const seen = new Set<string>();
	const parsed: ParsedDependency[] = [];

	for (const section of sections) {
		for (const [name, requirement] of Object.entries(section)) {
			if (seen.has(name)) continue;
			seen.add(name);

			const lockKey = `node_modules/${name}`;
			const resolvedVersion = packageLock?.packages?.[lockKey]?.version;
			parsed.push({
				name,
				ecosystem: 'npm',
				manifestPath: manifest.path,
				currentRequirement: requirement,
				currentVersion: resolvedVersion ?? normalizeVersionSpec(requirement)
			});
		}
	}

	return parsed;
}

export function parseRequirementsDependencies(manifest: DependencyManifest): ParsedDependency[] {
	const lines = manifest.content.split('\n');
	const parsed: ParsedDependency[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-r ')) continue;

		const withoutComment = trimmed.split('#')[0].trim();
		const match = withoutComment.match(/^([A-Za-z0-9._-]+)\s*(==|>=|<=|~=|>|<)?\s*([^\s;]+)?/);
		if (!match) continue;

		const [, name, operator = '', version = ''] = match;
		parsed.push({
			name,
			ecosystem: 'pypi',
			manifestPath: manifest.path,
			currentRequirement: withoutComment,
			currentVersion: operator === '==' ? version : normalizeVersionSpec(version || withoutComment)
		});
	}

	return parsed;
}

async function fetchPyPiLatestVersion(name: string): Promise<string | null> {
	try {
		const response = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
		if (!response.ok) return null;
		const data = (await response.json()) as { info?: { version?: string } };
		return data.info?.version ?? null;
	} catch {
		return null;
	}
}

async function fetchRepoTree(
	owner: string,
	name: string,
	accessToken: string
): Promise<GitHubTreeItem[]> {
	const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json'
		}
	});
	if (!repoResponse.ok) return [];

	const repo = (await repoResponse.json()) as GitHubRepoResponse;
	const branch = repo.default_branch ?? 'main';
	const treeResponse = await fetch(
		`https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.github+json'
			}
		}
	);
	if (!treeResponse.ok) return [];

	const tree = (await treeResponse.json()) as GitHubTreeResponse;
	return tree.tree?.filter((item) => item.type === 'blob') ?? [];
}

async function fetchRepoFile(
	owner: string,
	name: string,
	path: string,
	accessToken: string
): Promise<DependencyManifest | null> {
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.github.raw+json'
			}
		}
	);

	if (!response.ok) return null;
	return { path, content: await response.text() };
}

async function buildDependencyRecords(parsed: ParsedDependency[]): Promise<DependencyRecord[]> {
	const now = Date.now();
	const records = await Promise.all(
		parsed.map(async (dependency) => {
			if (dependency.ecosystem === 'npm') {
				const [registryMetadata, advisory] = await Promise.all([
					fetchNpmPackageMetadata(dependency.name, dependency.currentVersion),
					fetchNpmAdvisorySummary(dependency.name, dependency.currentVersion)
				]);
				const outdatedType = getOutdatedType(
					dependency.currentVersion,
					registryMetadata.latestVersion ?? undefined
				);

				return {
					...dependency,
					latestVersion: registryMetadata.latestVersion ?? undefined,
					isOutdated: outdatedType !== 'none' && outdatedType !== 'unknown',
					outdatedType,
					isDeprecated: Boolean(registryMetadata.deprecatedMessage),
					deprecationMessage: registryMetadata.deprecatedMessage ?? undefined,
					hasVulnerability:
						advisory.severity !== 'none' && advisory.severity !== 'unknown' && Boolean(advisory.summary),
					vulnerabilitySeverity: advisory.severity,
					vulnerabilitySummary: advisory.summary ?? undefined,
					lastCheckedAt: now
				} satisfies DependencyRecord;
			}

			const latestVersion = await fetchPyPiLatestVersion(dependency.name);
			const outdatedType = getOutdatedType(dependency.currentVersion, latestVersion ?? undefined);
			return {
				...dependency,
				latestVersion: latestVersion ?? undefined,
				isOutdated: outdatedType !== 'none' && outdatedType !== 'unknown',
				outdatedType,
				isDeprecated: false,
				hasVulnerability: false,
				vulnerabilitySeverity: 'none',
				lastCheckedAt: now
			} satisfies DependencyRecord;
		})
	);

	return records;
}

function summarizeDependencies(records: DependencyRecord[]): DependencySummary {
	return {
		total: records.length,
		outdated: records.filter((record) => record.isOutdated).length,
		majorOutdated: records.filter((record) => record.outdatedType === 'major').length,
		deprecated: records.filter((record) => record.isDeprecated).length,
		vulnerable: records.filter((record) => record.hasVulnerability).length
	};
}

export const replaceRepoDependencies = internalMutation({
	args: {
		repoId: v.id('repos'),
		dependencies: v.array(
			v.object({
				name: v.string(),
				ecosystem: v.union(v.literal('npm'), v.literal('pypi')),
				manifestPath: v.string(),
				currentRequirement: v.string(),
				currentVersion: v.string(),
				latestVersion: v.optional(v.string()),
				isOutdated: v.boolean(),
				outdatedType: v.union(
					v.literal('none'),
					v.literal('patch'),
					v.literal('minor'),
					v.literal('major'),
					v.literal('unknown')
				),
				isDeprecated: v.boolean(),
				deprecationMessage: v.optional(v.string()),
				hasVulnerability: v.boolean(),
				vulnerabilitySeverity: v.union(
					v.literal('none'),
					v.literal('low'),
					v.literal('moderate'),
					v.literal('high'),
					v.literal('critical'),
					v.literal('unknown')
				),
				vulnerabilitySummary: v.optional(v.string()),
				lastCheckedAt: v.number()
			})
		)
	},
	handler: async (ctx, { repoId, dependencies }) => {
		const existing = await ctx.db
			.query('repoDependencies')
			.withIndex('by_repoId', (q) => q.eq('repoId', repoId))
			.collect();

		for (const dependency of existing) {
			await ctx.db.delete(dependency._id);
		}

		for (const dependency of dependencies) {
			await ctx.db.insert('repoDependencies', {
				repoId,
				...dependency
			});
		}
	}
});

export const getRepoDependencySummary = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const dependencies = await ctx.db
			.query('repoDependencies')
			.withIndex('by_repoId', (q) => q.eq('repoId', repoId))
			.collect();

		return summarizeDependencies(dependencies);
	}
});

export const fetchAndMonitorDependencies = internalAction({
	args: {
		repoId: v.id('repos'),
		accessToken: v.string(),
		owner: v.string(),
		name: v.string(),
		repoDisplayName: v.string(),
		userId: v.id('users')
	},
	handler: async (ctx, { repoId, accessToken, owner, name, repoDisplayName, userId }) => {
		const tree = await fetchRepoTree(owner, name, accessToken);
		const manifestPaths = tree
			.map((item) => item.path)
			.filter(
				(path) =>
					path.endsWith('package.json') ||
					path.endsWith('package-lock.json') ||
					path.endsWith('requirements.txt')
			);

		if (manifestPaths.length === 0) {
			await ctx.runMutation(internal.dependencies.replaceRepoDependencies, {
				repoId,
				dependencies: []
			});
			return { total: 0, outdated: 0, majorOutdated: 0, deprecated: 0, vulnerable: 0 };
		}

		const fetchedManifests = (
			await Promise.all(
				manifestPaths.map((path) => fetchRepoFile(owner, name, path, accessToken))
			)
		).filter(Boolean) as DependencyManifest[];

		const parsed: ParsedDependency[] = [];
		for (const manifest of fetchedManifests) {
			if (manifest.path.endsWith('package.json')) {
				const lockPath = manifest.path.replace(/package\.json$/, 'package-lock.json');
				const lockManifest = fetchedManifests.find((item) => item.path === lockPath);
				parsed.push(...parsePackageJsonDependencies(manifest, lockManifest));
			}
			if (manifest.path.endsWith('requirements.txt')) {
				parsed.push(...parseRequirementsDependencies(manifest));
			}
		}

		const deduped = Array.from(
			new Map(parsed.map((dependency) => [`${dependency.ecosystem}:${dependency.name}`, dependency])).values()
		);
		const dependencyRecords = await buildDependencyRecords(deduped);

		await ctx.runMutation(internal.dependencies.replaceRepoDependencies, {
			repoId,
			dependencies: dependencyRecords
		});

		const summary = summarizeDependencies(dependencyRecords);
		if (summary.vulnerable > 0 || summary.majorOutdated > 0 || summary.deprecated > 0) {
			const alertParts: string[] = [];
			if (summary.vulnerable > 0) {
				alertParts.push(`${summary.vulnerable} vulnerable`);
			}
			if (summary.majorOutdated > 0) {
				alertParts.push(`${summary.majorOutdated} major updates`);
			}
			if (summary.deprecated > 0) {
				alertParts.push(`${summary.deprecated} deprecated`);
			}

			await ctx.runMutation(internal.notifications.createNotification, {
				userId,
				type: 'dependency_alert',
				title: 'Dependency issues found',
				message: `${repoDisplayName} has ${alertParts.join(', ')} dependency items to review.`,
				repoId,
				repoName: repoDisplayName
			});
		}

		return summary;
	}
});
