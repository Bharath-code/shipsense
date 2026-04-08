import type { RequestHandler } from './$types';

/**
 * Generates a 1200x630 social preview card as an SVG.
 * Used as the og:image for all pages.
 *
 * Query params:
 *   - title: repo name or page title (optional)
 *   - score: health score 0-100 (optional, shows color-coded badge)
 *
 * Without params, renders the default ShipSense branded card.
 */
export const GET: RequestHandler = async ({ url }) => {
	const title = url.searchParams.get('title') || '';
	const scoreParam = url.searchParams.get('score');
	const score = scoreParam ? parseInt(scoreParam, 10) : null;

	function getScoreColor(s: number): string {
		if (s >= 80) return '#22c55e';
		if (s >= 60) return '#eab308';
		if (s >= 40) return '#f97316';
		return '#ef4444';
	}

	const scoreColor = score !== null ? getScoreColor(score) : null;
	const scoreBadge = score !== null
		? `<rect x="460" y="290" width="${score >= 100 ? 70 : 52}" height="50" rx="25" fill="${scoreColor}" opacity="0.15"/>`
			+ `<text x="${score >= 100 ? 495 : 486}" y="323" font-family="monospace" font-size="22" font-weight="700" fill="${scoreColor}">${score}/100</text>`
		: '';

	const titleText = title
		? `<text x="600" y="280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#fafafa">${escapeXml(truncate(title, 50))}</text>`
		: '';

	const subtitle = title
		? `<text x="600" y="360" text-anchor="middle" font-family="monospace" font-size="18" fill="#737373">Daily health brief · Anomaly detection · Growth intelligence</text>`
		: `<text x="600" y="340" text-anchor="middle" font-family="monospace" font-size="20" fill="#a3a3a3">Daily health briefs for your GitHub repositories</text>`;

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#0a0a0a"/>
			<stop offset="100%" stop-color="#171717"/>
		</linearGradient>
		<linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="#fafafa"/>
			<stop offset="100%" stop-color="#a3a3a3"/>
		</linearGradient>
		<filter id="glow">
			<feGaussianBlur stdDeviation="60" result="blur"/>
			<feMerge>
				<feMergeNode in="blur"/>
				<feMergeNode in="SourceGraphic"/>
			</feMerge>
		</filter>
	</defs>

	<!-- Background -->
	<rect width="1200" height="630" fill="url(#bg)"/>

	<!-- Ambient glow -->
	<circle cx="200" cy="100" r="200" fill="#fafafa" opacity="0.03" filter="url(#glow)"/>
	<circle cx="1000" cy="530" r="200" fill="#fafafa" opacity="0.03" filter="url(#glow)"/>

	<!-- Top accent bar -->
	<rect x="0" y="0" width="1200" height="4" fill="#fafafa" opacity="0.6"/>

	<!-- Grid pattern (subtle) -->
	${generateGrid()}

	<!-- Logo + Brand -->
	<circle cx="600" cy="140" r="28" fill="#fafafa" opacity="0.1"/>
	<text x="600" y="149" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="#fafafa">
		<tspan font-size="14">⚡</tspan>
	</text>
	<text x="640" y="147" font-family="monospace" font-size="20" font-weight="700" fill="#fafafa" letter-spacing="0.05em">ShipSense</text>

	${titleText}
	${scoreBadge}
	${subtitle}

	${title ? generateMockMetrics() : generateMockDashboard()}

	<!-- Bottom bar -->
	<rect x="0" y="590" width="1200" height="40" fill="#0a0a0a" opacity="0.8"/>
	<text x="600" y="615" text-anchor="middle" font-family="monospace" font-size="13" fill="#525252">shipsense.app · Daily repo health intelligence</text>
</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400',
		},
	});
};

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function truncate(str: string, max: number): string {
	return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function generateGrid(): string {
	let lines = '';
	for (let x = 0; x < 1200; x += 60) {
		lines += `<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="#262626" stroke-width="0.5" opacity="0.3"/>`;
	}
	for (let y = 0; y < 630; y += 60) {
		lines += `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#262626" stroke-width="0.5" opacity="0.3"/>`;
	}
	return lines;
}

function generateMockDashboard(): string {
	return `
	<!-- Mock dashboard cards -->
	<rect x="150" y="380" width="280" height="120" rx="12" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="170" y="410" font-family="monospace" font-size="12" fill="#737373">Health Score</text>
	<text x="170" y="460" font-family="monospace" font-size="42" font-weight="700" fill="#22c55e">72</text>
	<text x="240" y="458" font-family="monospace" font-size="18" fill="#525252">/100</text>

	<rect x="460" y="380" width="280" height="120" rx="12" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="480" y="410" font-family="monospace" font-size="12" fill="#737373">Momentum</text>
	<text x="480" y="455" font-family="monospace" font-size="24" font-weight="700" fill="#22c55e">→ Accelerating</text>

	<rect x="770" y="380" width="280" height="120" rx="12" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="790" y="410" font-family="monospace" font-size="12" fill="#737373">Ship Streak</text>
	<text x="790" y="455" font-family="monospace" font-size="24" font-weight="700" fill="#eab308">🔥 14 days</text>

	<!-- Trend line -->
	<polyline points="170,520 230,510 290,515 350,490 410,480 470,470 530,460" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
	<circle cx="530" cy="460" r="4" fill="#22c55e"/>`;
}

function generateMockMetrics(): string {
	return `
	<!-- Mini metrics row -->
	<rect x="300" y="400" width="200" height="80" rx="10" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="320" y="430" font-family="monospace" font-size="11" fill="#737373">Stars</text>
	<text x="320" y="460" font-family="monospace" font-size="20" font-weight="700" fill="#fafafa">+128</text>

	<rect x="520" y="400" width="200" height="80" rx="10" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="540" y="430" font-family="monospace" font-size="11" fill="#737373">Contributors</text>
	<text x="540" y="460" font-family="monospace" font-size="20" font-weight="700" fill="#fafafa">12 active</text>

	<rect x="740" y="400" width="200" height="80" rx="10" fill="#171717" stroke="#262626" stroke-width="1"/>
	<text x="760" y="430" font-family="monospace" font-size="11" fill="#737373">Commits (7d)</text>
	<text x="760" y="460" font-family="monospace" font-size="20" font-weight="700" fill="#fafafa">47</text>`;
}
