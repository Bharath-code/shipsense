import { describe, expect, it } from 'vitest';
import {
	getOutdatedType,
	parseSemver,
	normalizeVersionSpec,
	parseRequirementsDependencies,
	type DependencyManifest
} from './dependencies';

describe('parseSemver', () => {
	it('parses valid semver strings', () => {
		expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
		expect(parseSemver('0.0.1')).toEqual([0, 0, 1]);
		expect(parseSemver('10.20.30')).toEqual([10, 20, 30]);
	});

	it('extracts semver from longer version strings', () => {
		expect(parseSemver('v1.2.3')).toEqual([1, 2, 3]);
		expect(parseSemver('1.2.3-beta')).toEqual([1, 2, 3]);
		expect(parseSemver('1.2.3+build.123')).toEqual([1, 2, 3]);
	});

	it('returns null for invalid semver', () => {
		expect(parseSemver('1.2')).toBeNull();
		expect(parseSemver('abc')).toBeNull();
		expect(parseSemver('')).toBeNull();
		expect(parseSemver('1')).toBeNull();
		expect(parseSemver('1.2.')).toBeNull();
	});
});

describe('normalizeVersionSpec', () => {
	it('strips version prefixes', () => {
		expect(normalizeVersionSpec('^1.2.3')).toBe('1.2.3');
		expect(normalizeVersionSpec('~1.2.3')).toBe('1.2.3');
		expect(normalizeVersionSpec('>=1.2.3')).toBe('1.2.3');
		expect(normalizeVersionSpec('<=1.2.3')).toBe('1.2.3');
		expect(normalizeVersionSpec('>1.2.3')).toBe('1.2.3');
		expect(normalizeVersionSpec('<1.2.3')).toBe('1.2.3');
	});

	it('strips whitespace', () => {
		expect(normalizeVersionSpec('  1.2.3  ')).toBe('1.2.3');
		expect(normalizeVersionSpec('^  1.2.3')).toBe('1.2.3');
	});

	it('takes only the first part of range specs', () => {
		expect(normalizeVersionSpec('>=1.0.0,<2.0.0')).toBe('1.0.0');
		expect(normalizeVersionSpec('>= 1.0.0, < 2.0.0')).toBe('1.0.0');
	});

	it('handles already-clean versions', () => {
		expect(normalizeVersionSpec('1.2.3')).toBe('1.2.3');
	});
});

describe('getOutdatedType', () => {
	it('detects major, minor, and patch updates', () => {
		expect(getOutdatedType('1.2.3', '2.0.0')).toBe('major');
		expect(getOutdatedType('1.2.3', '1.3.0')).toBe('minor');
		expect(getOutdatedType('1.2.3', '1.2.4')).toBe('patch');
		expect(getOutdatedType('1.2.3', '1.2.3')).toBe('none');
	});

	it('returns unknown for invalid versions', () => {
		expect(getOutdatedType('abc', '1.2.3')).toBe('unknown');
		expect(getOutdatedType('1.2.3', 'xyz')).toBe('unknown');
	});

	it('returns unknown when latest is missing', () => {
		expect(getOutdatedType('1.2.3')).toBe('unknown');
		expect(getOutdatedType('1.2.3', undefined)).toBe('unknown');
	});

	it('detects multi-digit version bumps', () => {
		expect(getOutdatedType('1.9.9', '2.0.0')).toBe('major');
		expect(getOutdatedType('1.9.9', '1.10.0')).toBe('minor');
		expect(getOutdatedType('1.9.9', '1.9.10')).toBe('patch');
	});
});

describe('parseRequirementsDependencies', () => {
	it('parses pinned and ranged requirements', () => {
		const manifest: DependencyManifest = {
			path: 'requirements.txt',
			content: `
django==5.1.2
requests>=2.31.0
# comment
`
		};

		const dependencies = parseRequirementsDependencies(manifest);
		expect(dependencies).toEqual([
			{
				name: 'django',
				ecosystem: 'pypi',
				manifestPath: 'requirements.txt',
				currentRequirement: 'django==5.1.2',
				currentVersion: '5.1.2'
			},
			{
				name: 'requests',
				ecosystem: 'pypi',
				manifestPath: 'requirements.txt',
				currentRequirement: 'requests>=2.31.0',
				currentVersion: '2.31.0'
			}
		]);
	});
});
