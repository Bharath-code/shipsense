import { describe, expect, it } from 'vitest';
import {
	getOutdatedType,
	parseRequirementsDependencies,
	type DependencyManifest
} from './dependencies';

describe('getOutdatedType', () => {
	it('detects major, minor, and patch updates', () => {
		expect(getOutdatedType('1.2.3', '2.0.0')).toBe('major');
		expect(getOutdatedType('1.2.3', '1.3.0')).toBe('minor');
		expect(getOutdatedType('1.2.3', '1.2.4')).toBe('patch');
		expect(getOutdatedType('1.2.3', '1.2.3')).toBe('none');
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
