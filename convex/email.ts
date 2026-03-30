import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendWeeklyReport = internalAction({
	args: { userId: v.id('users'), email: v.string(), reportData: v.any() },
	handler: async (ctx, { email, reportData }) => {
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured.');
			return;
		}

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'ShipSense <reports@shipsense.app>',
				to: email,
				subject: 'Your Weekly Repo Growth Report',
				html: `<h1>Repo Growth Report</h1><p>Your repositories had a great week!</p>` // Payload format placeholder
			})
		});

		if (!response.ok) {
			console.error('Failed to send email via Resend');
		}
	}
});
