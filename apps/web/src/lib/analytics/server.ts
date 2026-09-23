import { siteUrl } from "@/lib/shared";
import { ANALYTICS, type UmamiConfig } from "./config";

/**
 * Server-side events, for the readers the browser tracker can never see.
 *
 * `/llms.txt`, each page's `.md` twin and the skill files are read by coding
 * agents, crawlers and `curl` — none of which run JavaScript, so Umami's script
 * never loads for them. For a library whose setup path is "hand this to your
 * agent", those reads are the traffic most worth counting. The request
 * middleware in `src/start.ts` reports each one here.
 */

export type AgentFetchKind = "llms" | "markdown" | "skill";

/**
 * The user agent the events are sent with. Umami discards any request whose
 * user agent `isbot` matches, which is every agent this exists to count, so the
 * caller's own agent travels in the event's data instead. `server.test.ts`
 * holds this string to passing that check.
 */
export const SERVER_USER_AGENT = "Mozilla/5.0 (compatible; delacour-web)";

const MAX_AGENT = 200;

export function agentFetch(pathname: string): AgentFetchKind | null {
	if (pathname === "/llms.txt" || pathname === "/llms-full.txt") return "llms";
	if (pathname.startsWith("/skills/")) return "skill";
	if (pathname.startsWith("/docs/") && pathname.endsWith(".md")) return "markdown";
	return null;
}

export function serverEventBody(umami: Extract<UmamiConfig, { kind: "on" }>, request: Request, kind: AgentFetchKind) {
	const url = new URL(request.url);
	const language = request.headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() ?? "";

	return {
		type: "event",
		payload: {
			website: umami.websiteId,
			hostname: url.hostname,
			url: url.pathname,
			language,
			name: "agent-fetch",
			data: {
				path: url.pathname,
				kind,
				agent: (request.headers.get("user-agent") ?? "unknown").slice(0, MAX_AGENT),
			},
		},
	} as const;
}

const SITE_HOST = new URL(siteUrl).host;

/**
 * Report an agent fetch, if this is one, Umami is on, and the request arrived
 * on the site's own host — the server's twin of the browser tag's
 * `data-domains`, so a production build run on `localhost` never counts
 * itself. Never awaited and never throws: a slow or unreachable analytics host
 * must not cost the reader a millisecond. The visitor's IP is not forwarded.
 */
export function reportAgentFetch(request: Request, umami: UmamiConfig = ANALYTICS.umami): void {
	if (umami.kind === "off") return;

	const url = new URL(request.url);
	if (url.host !== SITE_HOST) return;

	const kind = agentFetch(url.pathname);
	if (!kind) return;

	void fetch(`${umami.host}/api/send`, {
		method: "POST",
		headers: { "content-type": "application/json", "user-agent": SERVER_USER_AGENT },
		body: JSON.stringify(serverEventBody(umami, request, kind)),
	}).catch(() => {});
}
