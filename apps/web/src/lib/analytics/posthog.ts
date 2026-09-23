import type { PostHog, PostHogConfig } from "posthog-js";
import { ANALYTICS, isCountedHost, type PosthogConfig } from "./config";
import { type Consent, readConsent } from "./consent";
import type { EventData } from "./events";

/**
 * PostHog, in the browser, behind the reverse proxy at `i.delacour.co.nz`.
 *
 * Until the visitor accepts, PostHog runs cookieless: it stores nothing on the
 * device and PostHog's servers count visitors with a privacy-preserving hash
 * instead. Accept turns on its cookie and local storage; Decline, or no answer
 * at all, keeps it cookieless. The same banner, and the same stored answer,
 * gate Google Analytics — see `consent.ts`.
 *
 * The SDK is imported only once this build has PostHog on and the page is on
 * a counted host, so a build without the env vars never requests it.
 */

/** The PostHog app the proxy fronts. Only the toolbar's links use it. */
const UI_HOST = "https://us.posthog.com";

/**
 * The init options. Everything the privacy policy does not describe is off, in
 * code rather than in the PostHog project, so that a switch flipped there —
 * session replay, surveys, heatmaps — cannot reach a visitor unannounced.
 */
export function posthogOptions(posthog: Extract<PosthogConfig, { kind: "on" }>) {
	return {
		api_host: posthog.host,
		ui_host: UI_HOST,
		defaults: "2026-08-30",
		cookieless_mode: "on_reject",
		opt_out_capturing_by_default: true,
		person_profiles: "identified_only",
		capture_pageview: "history_change",
		autocapture: false,
		rageclick: false,
		capture_dead_clicks: false,
		capture_heatmaps: false,
		capture_exceptions: false,
		capture_performance: false,
		disable_session_recording: true,
		disable_surveys: true,
		advanced_disable_flags: true,
		disable_external_dependency_loading: true,
	} as const satisfies Partial<PostHogConfig>;
}

/**
 * What PostHog needs telling on load. PostHog stores its own copy of the
 * answer, and the banner's `CONSENT_KEY` is the one that counts, so the two are
 * reconciled whenever they disagree — after storage was partly cleared, say.
 */
export function consentReplay(
	stored: Consent | null,
	current: ReturnType<PostHog["get_explicit_consent_status"]>
): "opt_in" | "opt_out" | null {
	if (stored === "granted" && current !== "granted") return "opt_in";
	if (stored === "denied" && current !== "denied") return "opt_out";
	return null;
}

let client: PostHog | null = null;

/** Load and start PostHog, once, if this build and this host have it. */
export function startPosthog(posthog: PosthogConfig = ANALYTICS.posthog): void {
	if (posthog.kind === "off" || client || !isCountedHost(window.location.host)) return;

	void import("posthog-js").then(({ default: instance }) => {
		if (client) return;
		instance.init(posthog.token, posthogOptions(posthog));
		client = instance;

		const replay = consentReplay(readConsent(), instance.get_explicit_consent_status());
		if (replay === "opt_in") instance.opt_in_capturing();
		if (replay === "opt_out") instance.opt_out_capturing();
	});
}

/** Send one event, if PostHog has loaded. */
export function posthogCapture(name: string, data: EventData): void {
	client?.capture(name, data);
}

/** Tell PostHog the banner's answer: cookies and local storage on Accept, cookieless on Decline. */
export function posthogConsent(consent: Consent): void {
	if (!client) return;
	if (consent === "granted") client.opt_in_capturing();
	else client.opt_out_capturing();
}
