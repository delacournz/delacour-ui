import { posthogConsent } from "./posthog";

/**
 * Consent for analytics cookies: Google Analytics, which is loaded as
 * `gtag.js` only on Accept, and PostHog, which runs cookieless until Accept.
 * One banner and one answer gate both.
 *
 * The choice lives in `localStorage` under `CONSENT_KEY`. It is read three
 * times: by the inline bootstrap, before GA is configured, so a returning
 * visitor who accepted is counted from their first hit; by `startPosthog`, to
 * bring PostHog's own stored answer into line; and by the banner, to decide
 * whether to ask.
 */

export const CONSENT_KEY = "consent.analytics";

export type Consent = "granted" | "denied";

/** The window event the footer's "Cookie settings" link fires to reopen the banner. */
export const CONSENT_OPEN_EVENT = "consent:open";

declare global {
	interface Window {
		/** Defined by `gaBootstrap`, only on a build with GA on. */
		gtag?: (...args: unknown[]) => void;
		/** Defined by `gaBootstrap`: requests `gtag.js`, once. */
		loadGa?: () => void;
	}
}

export function parseConsent(value: string | null): Consent | null {
	return value === "granted" || value === "denied" ? value : null;
}

export function gaScriptUrl(id: string): string {
	return `https://www.googletagmanager.com/gtag/js?id=${id}`;
}

/**
 * The inline script that goes in `<head>` ahead of everything GA does.
 *
 * This is Consent Mode's **basic** mode: `gtag.js` is not requested at all
 * until the visitor accepts, so before that Google receives nothing — not even
 * the cookieless pings advanced mode sends. The privacy policy promises exactly
 * that, and `consent.test.ts` holds the script to it.
 *
 * The queue is still set up for everyone: consent defaults (all denied), then
 * `config`, so that whenever `loadGa` runs — here for a stored grant, or from
 * the banner's Accept — the library replays the queue in the right order. Only
 * `analytics_storage` is ever granted; the site shows no adverts. GA4's enhanced
 * measurement counts client-side navigations from the History API, so the
 * router needs nothing from it.
 *
 * `id` has already been held to `/^G-[A-Z0-9]+$/` by `analyticsConfig`, which
 * is what makes interpolating it here safe.
 */
export function gaBootstrap(id: string): string {
	return [
		"window.dataLayer=window.dataLayer||[];",
		"function gtag(){dataLayer.push(arguments);}",
		"gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});",
		"function loadGa(){if(document.getElementById('ga-js'))return;",
		`var s=document.createElement('script');s.id='ga-js';s.async=true;s.src='${gaScriptUrl(id)}';document.head.appendChild(s);}`,
		`try{if(localStorage.getItem('${CONSENT_KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted'});loadGa();}}catch(e){}`,
		"gtag('js',new Date());",
		`gtag('config','${id}');`,
	].join("");
}

export function readConsent(): Consent | null {
	try {
		return parseConsent(window.localStorage.getItem(CONSENT_KEY));
	} catch {
		return null;
	}
}

/**
 * Store the choice and tell both providers. Accepting loads `gtag.js` for the
 * first time on this page and lets PostHog persist; declining after an earlier
 * accept stops GA writing cookies at once and sends PostHog back to cookieless,
 * clearing what it stored.
 */
export function writeConsent(consent: Consent): void {
	try {
		window.localStorage.setItem(CONSENT_KEY, consent);
	} catch {
		// A blocked storage still gets this page's answer; it just asks again next visit.
	}
	window.gtag?.("consent", "update", { analytics_storage: consent });
	if (consent === "granted") window.loadGa?.();
	posthogConsent(consent);
}
