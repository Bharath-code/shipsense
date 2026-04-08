import { describe, it, expect } from 'vitest';

describe('settings page logic', () => {
	describe('repo usage meter', () => {
		const calculateRepoUsage = (activeRepos: number, plan: string) => {
			const maxRepos: Record<string, number> = { free: 1, indie: 5, builder: 50 };
			const repoLimit = maxRepos[plan as keyof typeof maxRepos] ?? 1;
			const isOverLimit = activeRepos > repoLimit;
			const repoUsagePercent = Math.min(Math.round((activeRepos / repoLimit) * 100), 100);
			return { repoLimit, isOverLimit, repoUsagePercent };
		};

		it('free plan with 0 repos shows 0%', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(0, 'free');
			expect(repoLimit).toBe(1);
			expect(isOverLimit).toBe(false);
			expect(repoUsagePercent).toBe(0);
		});

		it('free plan with 1 repo shows 100%', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(1, 'free');
			expect(repoLimit).toBe(1);
			expect(isOverLimit).toBe(false);
			expect(repoUsagePercent).toBe(100);
		});

		it('free plan with 5 repos shows over limit', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(5, 'free');
			expect(repoLimit).toBe(1);
			expect(isOverLimit).toBe(true);
			expect(repoUsagePercent).toBe(100); // capped at 100
		});

		it('indie plan with 3 repos shows 60%', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(3, 'indie');
			expect(repoLimit).toBe(5);
			expect(isOverLimit).toBe(false);
			expect(repoUsagePercent).toBe(60);
		});

		it('indie plan with 5 repos shows 100%', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(5, 'indie');
			expect(repoLimit).toBe(5);
			expect(isOverLimit).toBe(false);
			expect(repoUsagePercent).toBe(100);
		});

		it('builder plan with 20 repos shows 40%', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(20, 'builder');
			expect(repoLimit).toBe(50);
			expect(isOverLimit).toBe(false);
			expect(repoUsagePercent).toBe(40);
		});

		it('unknown plan defaults to free limits', () => {
			const { repoLimit, isOverLimit, repoUsagePercent } = calculateRepoUsage(2, 'unknown');
			expect(repoLimit).toBe(1);
			expect(isOverLimit).toBe(true);
			expect(repoUsagePercent).toBe(100);
		});
	});

	describe('checkout URL construction', () => {
		it('builds a valid Dodo checkout URL', () => {
			const buildCheckoutUrl = (baseUrl: string, productId: string, customerId: string, userId: string) => {
				const url = new URL(baseUrl);
				url.searchParams.set('product_id', productId);
				url.searchParams.set('customer_id', customerId);
				url.searchParams.set('metadata[userId]', userId);
				return url.toString();
			};

			const url = buildCheckoutUrl(
				'https://payments.dodo.io',
				'indie',
				'cust_abc123',
				'user_xyz789'
			);

			expect(url).toContain('product_id=indie');
			expect(url).toContain('customer_id=cust_abc123');
			expect(url).toContain('metadata%5BuserId%5D=user_xyz789');
		});

		it('handles empty customer ID gracefully', () => {
			const buildCheckoutUrl = (baseUrl: string, productId: string, customerId: string, userId: string) => {
				const url = new URL(baseUrl);
				url.searchParams.set('product_id', productId);
				url.searchParams.set('customer_id', customerId);
				url.searchParams.set('metadata[userId]', userId);
				return url.toString();
			};

			const url = buildCheckoutUrl('https://payments.dodo.io', 'builder', '', 'user123');
			expect(url).toContain('customer_id=');
			expect(url).toContain('metadata%5BuserId%5D=user123');
		});
	});
});
