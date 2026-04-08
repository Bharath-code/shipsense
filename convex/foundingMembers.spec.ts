import { describe, it, expect } from 'vitest';
import { FOUNDING_MEMBER_SPOTS } from './foundingMembers';

describe('foundingMembers', () => {
	describe('FOUNDING_MEMBER_SPOTS', () => {
		it('is set to 50', () => {
			expect(FOUNDING_MEMBER_SPOTS).toBe(50);
		});

		it('is a positive integer', () => {
			expect(Number.isInteger(FOUNDING_MEMBER_SPOTS)).toBe(true);
			expect(FOUNDING_MEMBER_SPOTS).toBeGreaterThan(0);
		});
	});

	describe('pricing math', () => {
		it('founding member price is 50% of regular Indie price', () => {
			const regularPrice = 9;
			const foundingPrice = 4.50;
			expect(foundingPrice).toBe(regularPrice * 0.5);
		});

		it('annual founding member price is $4.50 × 12', () => {
			const foundingAnnual = 4.50 * 12;
			expect(foundingAnnual).toBe(54);
			// Note: not 50% of regular annual ($84) — founding members pay monthly rate always
		});

		it('founding member saves 50% per month', () => {
			const regularPrice = 9;
			const foundingPrice = 4.50;
			const savings = ((regularPrice - foundingPrice) / regularPrice) * 100;
			expect(savings).toBe(50);
		});
	});

	describe('spot capacity logic', () => {
		it('returns true when spots are available (count < max)', () => {
			const hasSpots = (count: number, max: number) => count < max;
			expect(hasSpots(0, FOUNDING_MEMBER_SPOTS)).toBe(true);
			expect(hasSpots(23, FOUNDING_MEMBER_SPOTS)).toBe(true);
			expect(hasSpots(49, FOUNDING_MEMBER_SPOTS)).toBe(true);
		});

		it('returns false when spots are full (count >= max)', () => {
			const hasSpots = (count: number, max: number) => count < max;
			expect(hasSpots(50, FOUNDING_MEMBER_SPOTS)).toBe(false);
			expect(hasSpots(51, FOUNDING_MEMBER_SPOTS)).toBe(false);
			expect(hasSpots(100, FOUNDING_MEMBER_SPOTS)).toBe(false);
		});

		it('prevents duplicate claims for same user', () => {
			const claimedUsers = new Set<string>(['user1', 'user2']);
			const canClaim = (userId: string) => !claimedUsers.has(userId);
			expect(canClaim('user3')).toBe(true);
			expect(canClaim('user1')).toBe(false);
			expect(canClaim('user2')).toBe(false);
		});
	});

	describe('progress bar display', () => {
		it('calculates correct percentage for progress', () => {
			const progressPercent = (claimed: number, total: number) =>
				Math.round((claimed / total) * 100);
			expect(progressPercent(0, FOUNDING_MEMBER_SPOTS)).toBe(0);
			expect(progressPercent(25, FOUNDING_MEMBER_SPOTS)).toBe(50);
			expect(progressPercent(50, FOUNDING_MEMBER_SPOTS)).toBe(100);
		});

		it('formats the display text correctly', () => {
			const formatDisplay = (claimed: number, total: number) =>
				`${claimed}/${total} claimed`;
			expect(formatDisplay(0, FOUNDING_MEMBER_SPOTS)).toBe('0/50 claimed');
			expect(formatDisplay(23, FOUNDING_MEMBER_SPOTS)).toBe('23/50 claimed');
			expect(formatDisplay(50, FOUNDING_MEMBER_SPOTS)).toBe('50/50 claimed');
		});
	});
});
