import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { verifySlackSignature, verifyStandardWebhook } from './webhookAuth';

const http = httpRouter();

// Mount Convex Auth routes (handles GitHub OAuth callback)
auth.addHttpRoutes(http);

// DodoPayments webhook endpoint
http.route({
	path: '/webhooks/dodo',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const body = await request.text();

		const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
		if (!webhookKey) {
			console.error('[dodo] DODO_PAYMENTS_WEBHOOK_KEY is not set; rejecting webhook');
			return new Response('Webhook not configured', { status: 500 });
		}
		const verified = await verifyStandardWebhook(
			webhookKey,
			{
				id: request.headers.get('webhook-id'),
				timestamp: request.headers.get('webhook-timestamp'),
				signature: request.headers.get('webhook-signature')
			},
			body
		);
		if (!verified) return new Response('Invalid signature', { status: 401 });

		let payload: Record<string, unknown>;
		try {
			payload = JSON.parse(body);
		} catch {
			return new Response('Invalid JSON', { status: 400 });
		}

		const eventType = payload.type as string;

		// Handle subscription lifecycle events
		if (eventType === 'subscription.active' || eventType === 'subscription.renewed') {
			const data = payload.data as Record<string, unknown>;
			const customerId = data.customer_id as string;
			const subscriptionId = data.subscription_id as string;
			const productId = data.product_id as string;

			await ctx.runMutation(internal.billing.activateSubscription, {
				customerId,
				subscriptionId,
				productId
			});
		} else if (
			eventType === 'subscription.cancelled' ||
			eventType === 'subscription.expired' ||
			eventType === 'subscription.failed'
		) {
			const data = payload.data as Record<string, unknown>;
			const customerId = data.customer_id as string;

			await ctx.runMutation(internal.billing.cancelSubscription, {
				customerId
			});
		} else if (eventType === 'subscription.plan_changed') {
			const data = payload.data as Record<string, unknown>;
			const customerId = data.customer_id as string;
			const productId = data.product_id as string;

			await ctx.runMutation(internal.billing.changePlan, {
				customerId,
				productId
			});
		}

		return new Response('OK', { status: 200 });
	})
});

// Slack interactive actions webhook endpoint
http.route({
	path: '/webhooks/slack',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const body = await request.text();

		const signingSecret = process.env.SLACK_SIGNING_SECRET;
		if (!signingSecret) {
			console.error('[slack] SLACK_SIGNING_SECRET is not set; rejecting webhook');
			return new Response('Webhook not configured', { status: 500 });
		}
		const verified = await verifySlackSignature(
			signingSecret,
			request.headers.get('x-slack-request-timestamp'),
			request.headers.get('x-slack-signature'),
			body
		);
		if (!verified) return new Response('Invalid signature', { status: 401 });

		let payload: Record<string, unknown>;
		try {
			// Slack sends form-encoded payload when using interactive actions
			const params = new URLSearchParams(body);
			const payloadStr = params.get('payload');
			if (!payloadStr) return new Response('Missing payload', { status: 400 });
			payload = JSON.parse(payloadStr);
		} catch {
			return new Response('Invalid payload', { status: 400 });
		}

		try {
			await ctx.runMutation(internal.slack.processSlackAction, {
				payload: JSON.stringify(payload)
			});
		} catch (err) {
			console.error('[slack] Webhook error:', err);
		}

		return new Response('OK', { status: 200 });
	})
});

export default http;
