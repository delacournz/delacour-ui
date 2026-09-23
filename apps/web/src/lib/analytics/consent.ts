/**
 * Consent for Google Analytics, which runs through GTM and sets cookies.
 * Umami sets none and needs no consent, so nothing here gates it.
 *
 * The choice lives in `localStorage` under `CONSENT_KEY`. It is read twice: by
 * the inline bootstrap, before GTM loads, so a returning visitor who accepted is
 * counted from their first hit; and by the banner, to decide whether to ask.
 */

export const CONSENT_KEY = "consent.analytics";

export type Consent = "granted" | "denied";

/** The window event the footer's "Cookie settings" link fires to reopen the banner. */
export const CONSENT_OPEN_EVENT = "consent:open";

declare global {
	interface Window {
		/** Defined by `gtmBootstrap`, only on a build with GTM on. */
		gtag?: (...args: unknown[]) => void;
	}
}

export function parseConsent(value: string | null): Consent | null {
	return value === "granted" || value === "denied" ? value : null;
}

/**
 * The inline script that goes in `<head>` ahead of everything GTM does.
 *
 * Consent Mode v2 has to be told its defaults before the container loads, or
 * the container's first hits go out under no consent state at all. Everything
 * is denied, a stored grant is replayed, and only then is `gtm.js` requested.
 * Only `analytics_storage` is ever granted: the site shows no adverts, so the
 * three advertising types stay denied whatever the visitor chooses.
 *
 * `id` has already been held to `/^GTM-[A-Z0-9]+$/` by `analyticsConfig`, which
 * is what makes interpolating it here safe.
 */
export function gtmBootstrap(id: string): string {
	return [
		"window.dataLayer=window.dataLayer||[];",
		"function gtag(){dataLayer.push(arguments);}",
		"gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});",
		`try{if(localStorage.getItem('${CONSENT_KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}`,
		"(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});",
		"var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';",
		"j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);",
		`})(window,document,'script','dataLayer','${id}');`,
	].join("");
}

export function readConsent(): Consent | null {
	try {
		return parseConsent(window.localStorage.getItem(CONSENT_KEY));
	} catch {
		return null;
	}
}

/** Store the choice and tell GTM, which applies it to every tag without a reload. */
export function writeConsent(consent: Consent): void {
	try {
		window.localStorage.setItem(CONSENT_KEY, consent);
	} catch {
		// A blocked storage still gets this page's answer; it just asks again next visit.
	}
	window.gtag?.("consent", "update", { analytics_storage: consent });
}
