import { describe, it, expect } from 'vitest';
import { generateBadge } from './generateBadge';

describe('generateBadge', () => {
	it('generates SVG badge for a valid score', () => {
		const svg = generateBadge(85);

		expect(svg).toContain('ShipSense');
		expect(svg).toContain('85');
		expect(svg).toContain('<svg');
		expect(svg).toContain('#4c1'); // green for >= 80
		expect(svg).toContain('role="img"');
		expect(svg).toContain('aria-label="ShipSense: 85"');
		expect(svg).toContain('<title>ShipSense: 85</title>');
	});

	it('generates a placeholder badge for null score', () => {
		const svg = generateBadge(null);

		expect(svg).toContain('---');
		expect(svg).toContain('#9f9f9f'); // grey for null
		expect(svg).toContain('aria-label="ShipSense: ---"');
	});

	it('scales SVG width based on score string length', () => {
		const svg1 = generateBadge(5);
		const svg100 = generateBadge(100);

		// Extract width from first SVG tag
		const width1 = parseInt(svg1.match(/width="(\d+)"/)?.[1] ?? '0');
		const width100 = parseInt(svg100.match(/width="(\d+)"/)?.[1] ?? '0');

		expect(width100).toBeGreaterThan(width1);
	});

	it('renders boundary scores correctly', () => {
		expect(generateBadge(0)).toContain('0');
		expect(generateBadge(40)).toContain('40');
		expect(generateBadge(60)).toContain('60');
		expect(generateBadge(80)).toContain('80');
		expect(generateBadge(100)).toContain('100');
	});

	it('produces valid SVG with proper structure', () => {
		const svg = generateBadge(72);

		expect(svg).toMatch(/^<svg/);
		expect(svg).toContain('<linearGradient');
		expect(svg).toContain('<clipPath');
		expect(svg).toContain('</svg>');
		expect(svg).toContain('text-anchor="middle"');
	});
});
