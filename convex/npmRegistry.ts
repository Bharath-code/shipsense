export type NpmPackageMetadata = {
	name: string;
	latestVersion: string | null;
	deprecatedMessage: string | null;
};

export type NpmAdvisoryResult = {
	severity: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown';
	summary: string | null;
};

type NpmPackument = {
	'dist-tags'?: {
		latest?: string;
	};
	versions?: Record<
		string,
		{
			deprecated?: string;
		}
	>;
};

type NpmBulkAdvisory = {
	severity?: 'low' | 'moderate' | 'high' | 'critical';
	title?: string;
	url?: string;
};

function encodePackageName(name: string): string {
	return name.startsWith('@') ? name.replace('/', '%2f') : encodeURIComponent(name);
}

export async function fetchNpmPackageMetadata(
	name: string,
	currentVersion: string
): Promise<NpmPackageMetadata> {
	try {
		const response = await fetch(`https://registry.npmjs.org/${encodePackageName(name)}`);
		if (!response.ok) {
			return {
				name,
				latestVersion: null,
				deprecatedMessage: null
			};
		}

		const packument = (await response.json()) as NpmPackument;
		const latestVersion = packument['dist-tags']?.latest ?? null;
		const deprecatedMessage =
			(currentVersion && packument.versions?.[currentVersion]?.deprecated) || null;

		return {
			name,
			latestVersion,
			deprecatedMessage
		};
	} catch {
		return {
			name,
			latestVersion: null,
			deprecatedMessage: null
		};
	}
}

export async function fetchNpmAdvisorySummary(
	name: string,
	version: string
): Promise<NpmAdvisoryResult> {
	if (!version) {
		return { severity: 'unknown', summary: null };
	}

	try {
		const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				[name]: [version]
			})
		});

		if (!response.ok) {
			return { severity: 'unknown', summary: null };
		}

		const advisories = (await response.json()) as Record<string, NpmBulkAdvisory[]>;
		const packageAdvisories = advisories[name] ?? [];
		if (packageAdvisories.length === 0) {
			return { severity: 'none', summary: null };
		}

		const severityRank = {
			unknown: 0,
			low: 1,
			moderate: 2,
			high: 3,
			critical: 4
		} as const;

		let highest: keyof typeof severityRank = 'unknown';
		for (const advisory of packageAdvisories) {
			const severity = advisory.severity ?? 'unknown';
			if (severityRank[severity] > severityRank[highest]) {
				highest = severity;
			}
		}

		const first = packageAdvisories[0];
		return {
			severity: highest,
			summary: first?.title ?? first?.url ?? `${packageAdvisories.length} advisory found`
		};
	} catch {
		return { severity: 'unknown', summary: null };
	}
}
