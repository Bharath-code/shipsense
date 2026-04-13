/**
 * Email Nurture — 3-email sequence after lead capture.
 *
 * Day 0: Report delivery (already handled by sendReport in emailLeads.ts)
 * Day 2: "3 quick wins to boost your score by 15 points"
 * Day 5: Social proof — "How a founder grew their repo from 20 to 200 stars"
 *
 * Triggered via cron job that checks for leads captured 2/5 days ago
 * who haven't received the nurture email yet.
 */

import { v } from 'convex/values';
import { internalAction, internalMutation, query } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getLetterGrade, getGradeInfo, generateQuickWins } from './healthGrade';

// ─── Day 2: Quick Wins Email ───────────────────────────────────────────

/**
 * Find leads captured 2 days ago who haven't received the Day 2 email.
 */
export const getLeadsForDay2 = query({
	args: {},
	handler: async (ctx) => {
		const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
		const fiveDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

		const leads = await ctx.db
			.query('emailLeads')
			.withIndex('by_createdAt', (q) => q.gte('createdAt', fiveDaysAgo).lte('createdAt', twoDaysAgo))
			.collect();

		return leads.filter((l) => !l.nurtureDay2Sent);
	}
});

/**
 * Send the Day 2 quick wins email.
 */
export const sendDay2Email = internalAction({
	args: {
		leadId: v.id('emailLeads'),
		leadEmail: v.string(),
		repoName: v.string(),
		healthScore: v.number(),
		stars: v.number(),
		forks: v.number(),
		hasLicense: v.boolean(),
		hasReadme: v.boolean(),
		hasContributing: v.boolean(),
		issuesOpen: v.number()
	},
	handler: async (_ctx, args) => {
		const RESEND_API_KEY = process.env.RESEND_API_KEY;
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured. Skipping Day 2 nurture email.');
			return;
		}

		const grade = getLetterGrade(args.healthScore);
		const gradeInfo = getGradeInfo(args.healthScore);

		const quickWins = generateQuickWins({
			stars: args.stars,
			forks: args.forks,
			hasLicense: args.hasLicense,
			hasReadme: args.hasReadme,
			hasContributing: args.hasContributing,
			issuesOpen: args.issuesOpen,
			commitGapHours: 0,
			prsOpen: 0
		});

		const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Quick Wins — ShipSense</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 14px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em;">ShipSense</span>
  </div>

  <h1 style="color: #f5f5f5; font-size: 22px; margin-bottom: 8px;">3 quick wins to boost your repo score</h1>
  <p style="color: #a3a3a3; font-size: 16px; margin-bottom: 24px;">
    Your repo <strong style="color: #f5f5f5;">${args.repoName}</strong> scored a <strong style="color: ${gradeInfo.color};">${grade} (${args.healthScore}/100)</strong>. Here are the fastest ways to push it higher:
  </p>

  ${quickWins.map((win, i) => `
    <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <p style="color: #f5f5f5; font-weight: 600; margin: 0 0 8px 0;">${i + 1}. ${win.title}</p>
      <p style="color: #a3a3a3; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">${win.steps}</p>
      <p style="color: #10b981; font-size: 12px; font-weight: 600; margin: 0;">${win.impact}</p>
    </div>
  `).join('')}

  <div style="margin-top: 32px; padding: 20px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 16px; text-align: center;">
    <p style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #f5f5f5;">
      ShipSense does this automatically — daily tracking, AI insights, and task recommendations.
    </p>
    <a href="https://shipsense.app/auth/login"
       style="display: inline-block; background: #6366f1; color: #f5f5f5; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Start Free — 1 Repo
    </a>
  </div>

  <hr style="margin-top: 32px; border: none; border-top: 1px solid #262626;">
  <p style="font-size: 12px; color: #525252;">
    You're receiving this because you requested a report from <a href="https://shipsense.app" style="color: #6366f1; text-decoration: none;">ShipSense</a>.
    <a href="https://shipsense.app/unsubscribe?email=${encodeURIComponent(args.leadEmail)}" style="color: #737373; text-decoration: underline;">Unsubscribe</a>
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
				subject: `3 ways to boost your repo score from ${grade} → A`,
				html: htmlBody
			})
		});

		if (!response.ok) {
			console.error('Failed to send Day 2 email:', await response.text());
		}
	}
});

// ─── Day 5: Social Proof Email ───────────────────────────────────────────

/**
 * Find leads captured 5 days ago who haven't received the Day 5 email.
 */
export const getLeadsForDay5 = query({
	args: {},
	handler: async (ctx) => {
		const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
		const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;

		const leads = await ctx.db
			.query('emailLeads')
			.withIndex('by_createdAt', (q) => q.gte('createdAt', sixDaysAgo).lte('createdAt', fiveDaysAgo))
			.collect();

		return leads.filter((l) => !l.nurtureDay5Sent);
	}
});

/**
 * Send the Day 5 social proof email.
 */
export const sendDay5Email = internalAction({
	args: {
		leadId: v.id('emailLeads'),
		leadEmail: v.string(),
		repoName: v.string()
	},
	handler: async (_ctx, args) => {
		const RESEND_API_KEY = process.env.RESEND_API_KEY;
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured. Skipping Day 5 nurture email.');
			return;
		}

		const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Case Study — ShipSense</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 14px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em;">ShipSense</span>
  </div>

  <h1 style="color: #f5f5f5; font-size: 22px; margin-bottom: 8px;">How a founder grew their repo from 20 to 200 stars 🚀</h1>
  <p style="color: #a3a3a3; font-size: 16px; margin-bottom: 24px;">
    Last month, a ShipSense user shared how they 10x'd their repo in 90 days. Here's what worked:
  </p>

  <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
    <p style="color: #f5f5f5; font-weight: 600; margin: 0 0 12px 0;">Their 3-step playbook:</p>
    <ol style="color: #a3a3a3; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
      <li><strong style="color: #f5f5f5;">Daily health checks</strong> — They tracked their repo score every morning and acted on the #1 recommendation.</li>
      <li><strong style="color: #f5f5f5;">AI-powered issue replies</strong> — They used ShipSense drafts to respond to issues 3x faster.</li>
      <li><strong style="color: #f5f5f5;">Weekly competitor tracking</strong> — They watched similar repos and learned what features drove growth.</li>
    </ol>
  </div>

  <p style="color: #a3a3a3; font-size: 15px; margin-bottom: 24px;">
    The best part? They did all of this on the <strong style="color: #f5f5f5;">free plan</strong>.
  </p>

  <div style="padding: 20px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 16px; text-align: center;">
    <p style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #f5f5f5;">
      Start tracking your repo today — no credit card needed.
    </p>
    <a href="https://shipsense.app/auth/login"
       style="display: inline-block; background: #6366f1; color: #f5f5f5; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Get Started Free
    </a>
    <p style="font-size: 13px; color: #737373; margin-top: 10px;">Free for 1 repo. No credit card needed.</p>
  </div>

  <hr style="margin-top: 32px; border: none; border-top: 1px solid #262626;">
  <p style="font-size: 12px; color: #525252;">
    You're receiving this because you requested a report from <a href="https://shipsense.app" style="color: #6366f1; text-decoration: none;">ShipSense</a>.
    <a href="https://shipsense.app/unsubscribe?email=${encodeURIComponent(args.leadEmail)}" style="color: #737373; text-decoration: underline;">Unsubscribe</a>
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
				subject: `How a founder grew their repo from 20 → 200 stars`,
				html: htmlBody
			})
		});

		if (!response.ok) {
			console.error('Failed to send Day 5 email:', await response.text());
		}
	}
});

// ─── Cron Triggers ─────────────────────────────────────────────────────────

/**
 * Orchestrator: run Day 2 nurture for all eligible leads.
 * Called from crons.ts daily.
 */
export const runDay2Nurture = internalAction({
	args: {},
	handler: async (ctx) => {
		const leads = await ctx.runQuery((internal as any).emailNurture.getLeadsForDay2, {});

		for (const lead of leads) {
			// Fetch repo data for the email
			const url = `https://api.github.com/repos/${lead.repoUrl}`;
			const response = await fetch(url, {
				headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ShipSense-Nurture' }
			});

			let stars = 0;
			let forks = 0;
			let openIssues = 0;
			let hasLicense = false;
			let hasReadme = true;
			let hasContributing = false;

			if (response.ok) {
				const data = await response.json();
				stars = data.stargazers_count ?? 0;
				forks = data.forks_count ?? 0;
				openIssues = data.open_issues_count ?? 0;
				hasLicense = data.license !== null;

				// Check README
				const readmeUrl = `https://api.github.com/repos/${lead.repoUrl}/readme`;
				const readmeRes = await fetch(readmeUrl, {
					headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ShipSense-Nurture' }
				});
				hasReadme = readmeRes.ok;
			}

			const starScore = Math.min(stars / 100 * 35, 35);
			const forkScore = Math.min(forks / 50 * 15, 15);
			const hygieneScore = (hasLicense ? 10 : 0) + (hasReadme ? 25 : 0);
			const healthScore = Math.round(starScore + forkScore + hygieneScore);

			try {
				await ctx.runAction((internal as any).emailNurture.sendDay2Email, {
					leadId: lead._id,
					leadEmail: lead.email,
					repoName: lead.repoUrl,
					healthScore,
					stars,
					forks,
					hasLicense,
					hasReadme,
					hasContributing,
					issuesOpen: openIssues
				});

				// Mark as sent
				await ctx.runMutation((internal as any).emailNurture.markDay2Sent, { leadId: lead._id });
				console.log(`Day 2 nurture sent to ${lead.email}`);
			} catch (err) {
				console.error(`Failed to send Day 2 email to ${lead.email}:`, err);
			}
		}
	}
});

/**
 * Orchestrator: run Day 5 nurture for all eligible leads.
 */
export const runDay5Nurture = internalAction({
	args: {},
	handler: async (ctx) => {
		const leads = await ctx.runQuery((internal as any).emailNurture.getLeadsForDay5, {});

		for (const lead of leads) {
			try {
				await ctx.runAction((internal as any).emailNurture.sendDay5Email, {
					leadId: lead._id,
					leadEmail: lead.email,
					repoName: lead.repoUrl
				});

				await ctx.runMutation((internal as any).emailNurture.markDay5Sent, { leadId: lead._id });
				console.log(`Day 5 nurture sent to ${lead.email}`);
			} catch (err) {
				console.error(`Failed to send Day 5 email to ${lead.email}:`, err);
			}
		}
	}
});

// ─── Internal Mutations ─────────────────────────────────────────────────

export const markDay2Sent = internalMutation({
	args: { leadId: v.id('emailLeads') },
	handler: async (ctx, args) => {
		const lead = await ctx.db.get(args.leadId);
		if (!lead) return;
		await ctx.db.patch(args.leadId, { nurtureDay2Sent: true });
	}
});

export const markDay5Sent = internalMutation({
	args: { leadId: v.id('emailLeads') },
	handler: async (ctx, args) => {
		const lead = await ctx.db.get(args.leadId);
		if (!lead) return;
		await ctx.db.patch(args.leadId, { nurtureDay5Sent: true });
	}
});
