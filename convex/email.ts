import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getPlanConfig, type PlanType } from './plan';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendWeeklyReport = internalAction({
	args: { userId: v.id('users'), email: v.string(), reportData: v.any() },
	handler: async (ctx, { userId, email, reportData }) => {
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured.');
			return;
		}

		// Check plan gating
		const plan = (await ctx.runQuery(internal.billing.getMyPlan, { userId })) as PlanType;
		const planConfig = getPlanConfig(plan);

		if (!planConfig.emailReports) {
			console.warn(`User ${userId} on plan ${plan} does not have email reports enabled.`);
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
