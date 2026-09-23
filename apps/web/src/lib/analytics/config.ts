import { siteUrl } from "@/lib/shared";

/**
 * Which analytics providers this build talks to, read from the environment.
 *
 * Every variable is optional, and a missing or malformed one turns its
 * provider off rather than throwing — so `bun run dev` and CI, which set none
 * of them, render a page with no analytics at all. The values are `VITE_*` and
 * therefore inlined at build time, into the client bundle and the server one
 * alike, which is why Railway sets them per environment.
 *
 * The validation is not pedantry. The GA id is written into an inline script
 * and the PostHog values into the SDK's config and a server-side URL, so a
 * value that is not the shape it claims to be is refused before it can reach
 * either.
 */

export type GaConfig = { kind: "off" } | { kind: "on"; id: string };

/** `host` is an https origin, with no path or trailing slash. */
export type PosthogConfig = { kind: "off" } | { kind: "on"; token: string; host: string };

export type AnalyticsConfig = { ga: GaConfig; posthog: PosthogConfig };

export type AnalyticsEnv = {
	VITE_GA_ID?: string;
	VITE_POSTHOG_TOKEN?: string;
	VITE_POSTHOG_HOST?: string;
};

const GA_ID = /^G-[A-Z0-9]+$/;
/** A public project token. A personal API key (`phx_`) is a secret and is refused. */
const POSTHOG_TOKEN = /^phc_[A-Za-z0-9]+$/;

function httpsOrigin(value: string | undefined): string | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.origin : null;
	} catch {
		return null;
	}
}

export function analyticsConfig(env: AnalyticsEnv): AnalyticsConfig {
	const gaId = env.VITE_GA_ID;
	const token = env.VITE_POSTHOG_TOKEN;
	const host = httpsOrigin(env.VITE_POSTHOG_HOST);

	return {
		ga: gaId && GA_ID.test(gaId) ? { kind: "on", id: gaId } : { kind: "off" },
		posthog: token && POSTHOG_TOKEN.test(token) && host ? { kind: "on", token, host } : { kind: "off" },
	};
}

/**
 * The hosts whose traffic is counted: production, and staging, which reports
 * to its own PostHog project. A production build run on `localhost` or reached
 * through Railway's own domain counts nothing.
 */
const COUNTED_HOSTS: ReadonlySet<string> = new Set([new URL(siteUrl).host, "ui.staging.delacour.co.nz"]);

export function isCountedHost(host: string): boolean {
	return COUNTED_HOSTS.has(host);
}

/** This build's providers. */
export const ANALYTICS: AnalyticsConfig = analyticsConfig({
	VITE_GA_ID: import.meta.env.VITE_GA_ID,
	VITE_POSTHOG_TOKEN: import.meta.env.VITE_POSTHOG_TOKEN,
	VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
});
