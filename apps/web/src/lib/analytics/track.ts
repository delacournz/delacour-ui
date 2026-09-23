import { type AnalyticsEvent, classifyLink, type EventData, eventPayload } from "./events";

declare global {
	interface Window {
		/** Umami's tracker, once `script.js` has loaded. */
		umami?: { track: (name: string, data?: EventData) => void };
		/** gtag's queue, defined by `gaBootstrap`. */
		dataLayer?: unknown[];
	}
}

/**
 * Send one event to whichever providers are on this page. Both are optional —
 * a build without the env vars, a blocker, a script still loading — so this is
 * a no-op rather than an error whenever neither is there.
 *
 * GA gets the same event through `gtag('event')`. Before consent it only joins
 * the queue — `gtag.js` is not loaded, so nothing leaves the page — and it is
 * sent only if the visitor accepts on this page.
 */
export function track(event: AnalyticsEvent): void {
	if (typeof window === "undefined") return;
	const { name, data } = eventPayload(event);
	window.umami?.track(name, data);
	window.gtag?.("event", name, data);
}

/**
 * Fumadocs' code-block copy button. It is Fumadocs' markup rather than ours, so
 * it is found by the label it renders; the site is English-only.
 */
const CODE_COPY = 'button[aria-label="Copy Text"]';

/**
 * One delegated listener for every link and code-block copy on the site.
 *
 * Umami's guides scan the DOM once on load and tag each link, which misses every
 * link an SPA renders after its first navigation. A listener on `document` sees
 * them all without knowing when they appeared. A link that already carries
 * `data-umami-event` is left to Umami, which tracks those itself.
 *
 * Returns the cleanup for `useEffect`.
 */
export function installClickTracking(): () => void {
	const onClick = (event: MouseEvent) => {
		if (!(event.target instanceof Element)) return;

		if (event.target.closest(CODE_COPY)) {
			track({ name: "copy", what: "code" });
			return;
		}

		const anchor = event.target.closest("a[href]");
		if (!anchor || anchor.hasAttribute("data-umami-event")) return;

		const link = classifyLink(anchor.getAttribute("href") ?? "", window.location.href);
		if (link) track(link);
	};

	document.addEventListener("click", onClick, { capture: true });
	return () => document.removeEventListener("click", onClick, { capture: true });
}
