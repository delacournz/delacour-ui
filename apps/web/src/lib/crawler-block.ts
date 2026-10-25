/**
 * Crawlers refused at the origin. One constant so the ranges and the patterns
 * cannot drift apart, and so the Railway edge rules that mirror them have one
 * place to be checked against:
 *
 * - `57.141.0.0/16` and `2a03:2880::/32` are Meta (AS32934). The IPv4 range
 *   fetched `/theme` ~13k times an hour in 2026-10; the IPv6 range came back on
 *   2026-10-25 as `meta-webindexer`, a browser user agent with Meta's crawler
 *   name appended, at ~1.5 requests a second after the IPv4 block held.
 * - `47.79.192.0/19` is Alibaba Cloud (AS45102). On 2026-10-25 a fleet of 400+
 *   addresses across it loaded `/theme?preset=` at ~37 requests a second under
 *   rotating Chrome user agents, defeating the per-IP limiter, and the service
 *   had been down on it for twenty hours. Nobody reads a docs site from a cloud
 *   provider's address space.
 *
 * The edge rules block the IPv4 ranges and the user agents before the cache;
 * Railway's edge cannot match IPv6, so the `2a03:2880::/32` entry here is the
 * only thing that catches a Meta address with the name stripped from the agent.
 */
export const BLOCKED_CRAWLERS = {
	cidrs: ["57.141.0.0/16", "2a03:2880::/32", "47.79.192.0/19"],
	userAgents: [
		/meta-externalagent/i,
		/meta-externalfetcher/i,
		/meta-webindexer/i,
		/facebookexternalhit/i,
		/facebookbot/i,
	],
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

/**
 * Textual IPv6 as an unsigned 128-bit integer, or `null` if it is not one. Handles one
 * `::` run; a zone id, a port or an embedded IPv4 tail is not an address here.
 */
function ipv6ToInt(ip: string): bigint | null {
	if (!/^[0-9a-f:]+$/i.test(ip) || ip.includes(":::")) return null;
	const halves = ip.split("::");
	if (halves.length > 2) return null;

	const groups = (part: string): string[] => (part === "" ? [] : part.split(":"));
	const head = groups(halves[0] ?? "");
	const tail = halves.length === 2 ? groups(halves[1] ?? "") : [];
	const missing = 8 - head.length - tail.length;
	if (halves.length === 2 ? missing < 1 : missing !== 0) return null;

	const all = [...head, ...Array.from({ length: missing }, () => "0"), ...tail];
	let value = 0n;
	for (const group of all) {
		if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
		value = (value << 16n) | BigInt(Number.parseInt(group, 16));
	}
	return value;
}

/** An address as an integer with its width in bits, or `null`: IPv4 and IPv6 never compare equal. */
function toInt(ip: string): { value: bigint; width: 32 | 128 } | null {
	const v4 = ipv4ToInt(ip);
	if (v4 !== null) return { value: BigInt(v4), width: 32 };
	const v6 = ipv6ToInt(ip);
	return v6 === null ? null : { value: v6, width: 128 };
}

/** Whether an IPv4 or IPv6 address falls in a CIDR block of the same family. Anything else is `false`. */
export function inCidr(ip: string, cidr: string): boolean {
	const [base, bitsText] = cidr.split("/");
	const bits = Number(bitsText);
	const address = toInt(ip);
	const network = base === undefined ? null : toInt(base);
	if (address === null || network === null || address.width !== network.width) return false;
	if (!Number.isInteger(bits) || bits < 0 || bits > address.width) return false;

	const shift = BigInt(address.width - bits);
	return address.value >> shift === network.value >> shift;
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
