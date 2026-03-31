import type { HandleClientError } from '@sveltejs/kit';

// Client-side error handling
export const handleError: HandleClientError = async ({ error }) => {
	console.error('Client error:', error);

	// Return safe error message for UI
	return {
		message: 'Something went wrong. Please refresh and try again.'
	};
};
