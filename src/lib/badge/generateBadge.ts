export function generateBadge(score: number | null): string {
	const scoreStr = score !== null ? score.toString() : '---';
	const { color } = getScoreColor(score);

	const leftWidth = 68;
	const rightWidth = Math.max(32, scoreStr.length * 11 + 14);
	const totalWidth = leftWidth + rightWidth;
	const rightX = leftWidth;

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="ShipSense: ${scoreStr}">
  <title>ShipSense: ${scoreStr}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${rightX}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">ShipSense</text>
    <text x="${leftWidth / 2}" y="14" fill="#fff">ShipSense</text>
    <text x="${rightX + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${scoreStr}</text>
    <text x="${rightX + rightWidth / 2}" y="14" fill="#fff">${scoreStr}</text>
  </g>
</svg>`;

	return svg;
}

function getScoreColor(score: number | null): { color: string } {
	if (score === null) return { color: '#9f9f9f' };
	if (score >= 80) return { color: '#4c1' };
	if (score >= 60) return { color: '#dfb317' };
	if (score >= 40) return { color: '#fe7d37' };
	return { color: '#e05d44' };
}
