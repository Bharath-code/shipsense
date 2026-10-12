import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStandardWebhook, verifySlackSignature } from './webhookAuth';

const now = 1_760_000_000;
const body = '{"type":"subscription.active","data":{"customer_id":"cus_1"}}';

describe('verifyStandardWebhook', () => {
	const rawKey = Buffer.from('super-secret-key-bytes');
	const secret = `whsec_${rawKey.toString('base64')}`;
	const sign = (id: string, ts: number, payload: string) =>
		'v1,' + createHmac('sha256', rawKey).update(`${id}.${ts}.${payload}`).digest('base64');

	it('accepts a correctly signed request', async () => {
		const headers = { id: 'msg_1', timestamp: String(now), signature: sign('msg_1', now, body) };
		expect(await verifyStandardWebhook(secret, headers, body, now)).toBe(true);
	});

	it('accepts when one of several signatures matches (key rotation)', async () => {
		const headers = {
			id: 'msg_1',
			timestamp: String(now),
			signature: `v1,bm9wZQ== ${sign('msg_1', now, body)}`
		};
		expect(await verifyStandardWebhook(secret, headers, body, now)).toBe(true);
	});

	it('rejects a tampered body', async () => {
		const headers = { id: 'msg_1', timestamp: String(now), signature: sign('msg_1', now, body) };
		expect(await verifyStandardWebhook(secret, headers, body.replace('cus_1', 'cus_2'), now)).toBe(false);
	});

	it('rejects missing headers and stale timestamps', async () => {
		const sig = sign('msg_1', now, body);
		expect(await verifyStandardWebhook(secret, { id: null, timestamp: String(now), signature: sig }, body, now)).toBe(false);
		expect(await verifyStandardWebhook(secret, { id: 'msg_1', timestamp: String(now), signature: null }, body, now)).toBe(false);
		expect(await verifyStandardWebhook(secret, { id: 'msg_1', timestamp: String(now), signature: sig }, body, now + 600)).toBe(false);
	});
});

describe('verifySlackSignature', () => {
	const signingSecret = 'slack-signing-secret';
	const form = 'payload=%7B%22type%22%3A%22block_actions%22%7D';
	const sign = (ts: number, payload: string) =>
		'v0=' + createHmac('sha256', signingSecret).update(`v0:${ts}:${payload}`).digest('hex');

	it('accepts a correctly signed request', async () => {
		expect(await verifySlackSignature(signingSecret, String(now), sign(now, form), form, now)).toBe(true);
	});

	it('rejects wrong secret, tampered body, and replayed requests', async () => {
		expect(await verifySlackSignature('other', String(now), sign(now, form), form, now)).toBe(false);
		expect(await verifySlackSignature(signingSecret, String(now), sign(now, form), form + 'x', now)).toBe(false);
		expect(await verifySlackSignature(signingSecret, String(now), sign(now, form), form, now + 301)).toBe(false);
		expect(await verifySlackSignature(signingSecret, null, sign(now, form), form, now)).toBe(false);
	});
});
