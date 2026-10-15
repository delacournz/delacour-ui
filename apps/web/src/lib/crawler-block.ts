/**
 * Crawlers refused at the origin. One constant so the range and the patterns
 * cannot drift apart: `57.141.0.0/16` is Meta (AS32934), which fetched `/theme`
 * ~13k times an hour; the user agents are Meta's declared crawlers.
 */
export const BLOCKED_CRAWLERS = {
	cidrs: ["57.141.0.0/16"],
	userAgents: [/meta-externalagent/i, /meta-externalfetcher/i, /facebookexternalhit/i, /facebookbot/i],
} as const satisfies { cidrs: readonly string[]; userAgents: readonly RegExp[] };

/** Never blocked: a crawler can only obey a `Disallow` it is allowed to read. */
const ALWAYS_ALLOWED_PATHS: ReadonlySet<string> = new Set(["/robots.txt"]);

/** Dotted-quad IPv4 as an unsigned 32-bit integer, or `null` if it is not one. */
function ipv4ToInt(ip: string): number | null {
	const octets = ip.split(".");
	if (octets.length !== 4) return null;

	let value = 0;
	for (const octet of octets) {
		if (!/^\d{1,3}$/.test(octet)) return null;
		const n = Number(octet);
		if (n > 255) return null;
		value = value * 256 + n;
	}
	return value;
}

/** Whether an IPv4 address falls in an IPv4 CIDR block. Anything else is `false`. */
export function inCidr(ip: string, cidr: string): boolean {
	const [base, bitsText] = cidr.split("/");
	const bits = Number(bitsText);
	const address = ipv4ToInt(ip);
	const network = base === undefined ? null : ipv4ToInt(base);
	if (address === null || network === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;

	const size = 2 ** (32 - bits);
	return Math.floor(address / size) === Math.floor(network / size);
}

/**
 * The caller's IP as Railway's edge reports it. `X-Real-IP` is the documented header
 * (`docs.railway.com/networking/public-networking/specs-and-limits`); it is set by
 * the edge, not appended to, so unlike the leftmost `X-Forwarded-For` hop a client
 * cannot choose it. `X-Forwarded-For` is deliberately never read.
 */
export function clientIp(request: Request): string | null {
	return request.headers.get("X-Real-IP")?.trim() || null;
}

/** Whether the request comes from a blocked range or a blocked user agent. */
export function isBlockedCrawler(request: Request): boolean {
	if (ALWAYS_ALLOWED_PATHS.has(new URL(request.url).pathname)) return false;

	const userAgent = request.headers.get("User-Agent") ?? "";
	if (BLOCKED_CRAWLERS.userAgents.some((pattern) => pattern.test(userAgent))) return true;

	const ip = clientIp(request);
	return ip !== null && BLOCKED_CRAWLERS.cidrs.some((cidr) => inCidr(ip, cidr));
}

/**
 * A bare 403. `no-store` keeps Railway's edge from caching it under the path's cache
 * key, where a real visitor would be served it.
 */
export function blockCrawlerResponse(): Response {
	return new Response("Forbidden", {
		status: 403,
		headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
	});
}
