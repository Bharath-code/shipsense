import { describe, it, expect } from 'vitest';
import { calculateNewStreak } from './streakTracker';

describe('calculateNewStreak', () => {
	it('increments streak and optionally longest streak on consecutive day', () => {
		const result = calculateNewStreak(1, 1, '2023-10-01', '2023-10-02');
		expect(result.currentStreak).toBe(2);
		expect(result.longestStreak).toBe(2);
		expect(result.broken).toBe(false);
	});

	it('breaks the streak and resets to 1 on skipped days', () => {
		const result = calculateNewStreak(3, 5, '2023-10-01', '2023-10-03');
		expect(result.currentStreak).toBe(1);
		expect(result.longestStreak).toBe(5);
		expect(result.broken).toBe(true);
	});

	it('maintains streak on the same day without incrementing', () => {
		const result = calculateNewStreak(3, 5, '2023-10-01', '2023-10-01');
		expect(result.currentStreak).toBe(3);
		expect(result.longestStreak).toBe(5);
		expect(result.broken).toBe(false);
	});
});
