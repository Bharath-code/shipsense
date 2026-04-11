/**
 * Email Leads — capture emails from landing page visitors who aren't ready to OAuth.
 *
 * Flow:
 * 1. Visitor enters GitHub repo URL + email on landing page
 * 2. We generate a one-time health report and email it
 * 3. Report includes CTA to sign up for daily tracking
 */

import { v } from 'convex/values';
import { mutation, query, internalMutation, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

// ─── Public Mutations ─────────────────────────────────────────────

/**
 * Capture a lead from the landing page.
 * Validates the repo URL, stores the lead, and schedules report generation.
 */
export const captureLead = mutation({
	args: {
		email: v.string(),
		repoUrl: v.string()
	},
	handler: async (ctx, args) => {
		// Basic validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(args.email)) {
			throw new Error('Please enter a valid email address.');
		}

		// Validate GitHub URL
		const githubMatch = args.repoUrl.match(
			/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/
		);
		if (!githubMatch) {
			throw new Error('Please enter a valid GitHub repo URL (e.g., https://github.com/owner/repo).');
		}

		const fullName = `${githubMatch[1]}/${githubMatch[2]}`;

		// Check if this email already exists
		const existing = await ctx.db
			.query('emailLeads')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.first();

		if (existing) {
			return {
				success: true,
				message: 'You\'re already on the list! Check your inbox for your report.',
				leadId: existing._id
			};
		}

		// Check if they're already a user
		const users = await ctx.db.query('userProfiles').collect();
		const isUser = users.some((u) => u.email === args.email);
		if (isUser) {
			return {
				success: false,
				message: 'This email is already registered. Sign in to track daily.'
			};
		}

		const id = await ctx.db.insert('emailLeads', {
			email: args.email,
			repoUrl: fullName,
			reportGenerated: false,
			createdAt: Date.now(),
			convertedToUser: false
		});

		// Schedule report generation (via internal mutation that then triggers action)
		await ctx.scheduler.runAfter(0, internal.emailLeads.generateReport, {
			leadId: id as Id<'emailLeads'>
		});

		return {
			success: true,
			message: 'Generating your free health report — check your inbox soon!',
			leadId: id
		};
	}
});

// ─── Internal: Report Generation ──────────────────────────────────

/**
 * Generate a one-time health report for a captured lead.
 * Fetches public repo data from GitHub, computes score, then triggers email action.
 */
export const generateReport = internalMutation({
	args: { leadId: v.id('emailLeads') },
	handler: async (ctx, args) => {
		const lead = await ctx.db.get(args.leadId);
		if (!lead) return;
		if (lead.reportGenerated) return;

		try {
			// Fetch basic repo data from GitHub (public, no auth needed)
			const url = `https://api.github.com/repos/${lead.repoUrl}`;
			const response = await fetch(url, {
				headers: {
					Accept: 'application/vnd.github.v3+json',
					'User-Agent': 'ShipSense-LeadReport'
				}
			});

			if (!response.ok) {
				console.warn(`GitHub API error for ${lead.repoUrl}: ${response.status}`);
				await ctx.db.patch(args.leadId, { reportGenerated: true });
				return;
			}

			const data = await response.json();

			const stars = data.stargazers_count ?? 0;
			const forks = data.forks_count ?? 0;
			const hasLicense = data.license !== null;

			// Simple health score (subset of full scorer since we lack private data)
			const starScore = Math.min(stars / 100 * 35, 35);
			const forkScore = Math.min(forks / 50 * 15, 15);
			const hygieneScore = (hasLicense ? 10 : 0) + 25;
			const healthScore = Math.round(starScore + forkScore + hygieneScore);

			const reportUrl = `/p/example`; // Point to demo page for now

			// Trigger email via action (actions can do external fetch)
			// Note: pass email through args since actions can't read DB
			await ctx.scheduler.runAfter(0, internal.emailLeads.sendReport, {
				leadId: args.leadId,
				leadEmail: lead.email,
				repoName: lead.repoUrl,
				healthScore,
				stars,
				forks,
				hasLicense,
				reportUrl
			});

			await ctx.db.patch(args.leadId, {
				reportGenerated: true,
				reportUrl
			});
		} catch (err) {
			console.error(`Failed to generate report for lead ${args.leadId}:`, err);
		}
	}
});

/**
 * Send the health report email to a lead via Resend.
 */
export const sendReport = internalAction({
	args: {
		leadId: v.id('emailLeads'),
		leadEmail: v.string(),
		repoName: v.string(),
		healthScore: v.number(),
		stars: v.number(),
		forks: v.number(),
		hasLicense: v.boolean(),
		reportUrl: v.string()
	},
	handler: async (_ctx, args) => {
		const RESEND_API_KEY = process.env.RESEND_API_KEY;
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured. Skipping lead email.');
			return;
		}

		const scoreEmoji = args.healthScore >= 80 ? '🟢' : args.healthScore >= 60 ? '🟡' : args.healthScore >= 40 ? '🟠' : '🔴';

		const suggestions: string[] = [];
		if (!args.hasLicense) suggestions.push('Add a LICENSE file to clarify usage rights');
		if (args.stars < 10) suggestions.push('Share your repo on social to get initial traction');
		if (args.forks < 5) suggestions.push('Add a CONTRIBUTING.md to encourage collaborators');

		const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>ShipSense Health Report</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 14px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em;">ShipSense</span>
  </div>

  <h1 style="color: #f5f5f5; font-size: 24px; margin-bottom: 8px;">Your Free Health Report</h1>
  <p style="color: #a3a3a3; font-size: 16px; margin-bottom: 24px;">Here's the health breakdown for <strong style="color: #f5f5f5;">${args.repoName}</strong>:</p>
  
  <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 32px; margin: 24px 0; text-align: center;">
    <div style="font-size: 48px; font-weight: 800; color: ${args.healthScore >= 60 ? '#10b981' : '#f59e0b'};">
      ${args.healthScore}/100
    </div>
    <p style="color: #737373; margin-top: 8px; font-size: 14px;">Health Score ${scoreEmoji}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 12px 0; color: #a3a3a3;">⭐ Stars</td><td style="text-align: right; color: #f5f5f5; font-weight: 600;">${args.stars}</td></tr>
    <tr><td style="padding: 12px 0; color: #a3a3a3;">🍴 Forks</td><td style="text-align: right; color: #f5f5f5; font-weight: 600;">${args.forks}</td></tr>
    <tr><td style="padding: 12px 0; color: #a3a3a3;">📄 License</td><td style="text-align: right; color: #f5f5f5; font-weight: 600;">${args.hasLicense ? '✅ Yes' : '❌ Missing'}</td></tr>
  </table>

  ${suggestions.length > 0 ? `
    <h3 style="color: #f5f5f5; margin-top: 32px;">Quick Wins:</h3>
    <ul style="color: #a3a3a3;">${suggestions.map((s) => `<li style="padding: 6px 0;">${s}</li>`).join('')}</ul>
  ` : '<p style="color: #10b981; font-weight: 600;">Your repo looks solid! Keep shipping 🚀</p>'}

  <div style="margin-top: 40px; padding: 24px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 16px; text-align: center;">
    <p style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #f5f5f5;">
      Want daily tracking + AI insights + task recommendations?
    </p>
    <a href="https://shipsense.app/auth/login"
       style="display: inline-block; background: #6366f1; color: #f5f5f5; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
      Connect Your Repo — Free
    </a>
    <p style="font-size: 13px; color: #737373; margin-top: 12px;">Free for 1 repo. No credit card needed.</p>
  </div>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #262626;">
  <p style="font-size: 12px; color: #525252;">
    Generated by <a href="https://shipsense.app" style="color: #6366f1; text-decoration: none;">ShipSense</a> — Daily repo health intelligence.
  </p>
</body>
</html>`;

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'ShipSense <reports@shipsense.app>',
				to: args.leadEmail,
				subject: `Your ShipSense Health Report for ${args.repoName}: ${args.healthScore}/100`,
				html: htmlBody
			})
		});

		if (!response.ok) {
			console.error('Failed to send lead email via Resend:', await response.text());
		} else {
			console.log(`Lead report sent to ${args.leadEmail}`);
		}
	}
});
