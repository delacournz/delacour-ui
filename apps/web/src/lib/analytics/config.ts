/**
 * Which analytics providers this build talks to, read from the environment.
 *
 * Every variable is optional, and a missing or malformed one turns its
 * provider off rather than throwing — so `bun run dev`, CI and staging, none of
 * which set them, render a page with no analytics tags at all. The values are
 * `VITE_*` and therefore inlined at build time, into the client bundle and the
 * server one alike, which is why Railway sets them per environment.
 *
 * The validation is not pedantry. The GA id is written into an inline script,
 * so a value that is not the shape it claims to be is refused before it can
 * reach the markup.
 */

export type GaConfig = { kind: "off" } | { kind: "on"; id: string };

export type AnalyticsConfig = { ga: GaConfig };

export type AnalyticsEnv = {
	VITE_GA_ID?: string;
};

const GA_ID = /^G-[A-Z0-9]+$/;

export function analyticsConfig(env: AnalyticsEnv): AnalyticsConfig {
	const gaId = env.VITE_GA_ID;

	return {
		ga: gaId && GA_ID.test(gaId) ? { kind: "on", id: gaId } : { kind: "off" },
	};
}

/** This build's providers. */
export const ANALYTICS: AnalyticsConfig = analyticsConfig({
	VITE_GA_ID: import.meta.env.VITE_GA_ID,
});
