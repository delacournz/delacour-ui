/**
 * Which analytics providers this build talks to, read from the environment.
 *
 * Every variable is optional, and a missing or malformed one turns its
 * provider off rather than throwing — so `bun run dev`, CI and staging, none of
 * which set them, render a page with no analytics tags at all. The values are
 * `VITE_*` and therefore inlined at build time, into the client bundle and the
 * server one alike, which is why Railway sets them per environment.
 *
 * The validation is not pedantry. The GTM id is written into an inline script
 * and the Umami values into attributes, so a value that is not the shape it
 * claims to be is refused before it can reach the markup.
 */

export type UmamiConfig = { kind: "off" } | { kind: "on"; host: string; websiteId: string };

export type GtmConfig = { kind: "off" } | { kind: "on"; id: string };

export type AnalyticsConfig = { umami: UmamiConfig; gtm: GtmConfig };

export type AnalyticsEnv = {
	VITE_UMAMI_HOST?: string;
	VITE_UMAMI_WEBSITE_ID?: string;
	VITE_GTM_ID?: string;
};

const GTM_ID = /^GTM-[A-Z0-9]+$/;
const WEBSITE_ID = /^[A-Za-z0-9-]+$/;

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
	const host = httpsOrigin(env.VITE_UMAMI_HOST);
	const websiteId = env.VITE_UMAMI_WEBSITE_ID;
	const gtmId = env.VITE_GTM_ID;

	return {
		umami: host && websiteId && WEBSITE_ID.test(websiteId) ? { kind: "on", host, websiteId } : { kind: "off" },
		gtm: gtmId && GTM_ID.test(gtmId) ? { kind: "on", id: gtmId } : { kind: "off" },
	};
}

/** This build's providers. */
export const ANALYTICS: AnalyticsConfig = analyticsConfig({
	VITE_UMAMI_HOST: import.meta.env.VITE_UMAMI_HOST,
	VITE_UMAMI_WEBSITE_ID: import.meta.env.VITE_UMAMI_WEBSITE_ID,
	VITE_GTM_ID: import.meta.env.VITE_GTM_ID,
});
