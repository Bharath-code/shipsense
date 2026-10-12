// Webhook signature verification using Web Crypto, so it runs in the default Convex runtime.

const MAX_AGE_SECONDS = 5 * 60;
const encoder = new TextEncoder();

async function hmacSha256(key: Uint8Array<ArrayBuffer>, message: string): Promise<Uint8Array> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		key,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message)));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

function isFresh(timestamp: string | null, nowSeconds: number): boolean {
	const ts = Number(timestamp);
	return Number.isFinite(ts) && Math.abs(nowSeconds - ts) <= MAX_AGE_SECONDS;
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Standard Webhooks spec (used by Dodo Payments): signs `${id}.${timestamp}.${body}`
 * with the base64 secret after the `whsec_` prefix. The header holds space-separated `v1,<base64>`.
 */
export async function verifyStandardWebhook(
	secret: string,
	headers: { id: string | null; timestamp: string | null; signature: string | null },
	body: string,
	nowSeconds = Math.floor(Date.now() / 1000)
): Promise<boolean> {
	const { id, timestamp, signature } = headers;
	if (!id || !signature || !isFresh(timestamp, nowSeconds)) return false;

	const key = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
	const expected = toBase64(await hmacSha256(key, `${id}.${timestamp}.${body}`));

	return signature
		.split(' ')
		.map((part) => part.split(',', 2))
		.some(([version, sig]) => version === 'v1' && !!sig && timingSafeEqual(sig, expected));
}

/** Slack request signing: `v0=` + hex HMAC of `v0:${timestamp}:${body}` with the signing secret. */
export async function verifySlackSignature(
	signingSecret: string,
	timestamp: string | null,
	signature: string | null,
	body: string,
	nowSeconds = Math.floor(Date.now() / 1000)
): Promise<boolean> {
	if (!signature || !isFresh(timestamp, nowSeconds)) return false;
	const expected =
		'v0=' + toHex(await hmacSha256(encoder.encode(signingSecret), `v0:${timestamp}:${body}`));
	return timingSafeEqual(signature, expected);
}
