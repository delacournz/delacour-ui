/**
 * How a web page is opened from this app, as a pure function so `bun test` can
 * reach it — `expo-web-browser` is a native module and cannot be imported
 * outside a build. `open-web-page.ts` is the wiring and holds nothing else.
 *
 * **In the app first, the system browser second.** The in-app browser is
 * `SFSafariViewController` on iOS and a Custom Tab on Android, and both can
 * refuse: an Android image with no Custom Tabs provider, or a URL whose scheme
 * is not `http(s)`. A refusal falls through to the system browser, and only
 * when that refuses too is the caller told — with the URL, so it can still be
 * put on screen.
 *
 * **One page at a time.** iOS resolves the in-app call only when the sheet is
 * dismissed and rejects a second presentation while one is up, so without the
 * guard a double tap would open the page in the app *and* fall through to
 * Safari behind it. A press made while a page is opening is dropped as `busy`.
 */
export type WebPageOpeners = {
	inApp: (url: string) => Promise<unknown>;
	external: (url: string) => Promise<unknown>;
};

export type OpenWebPageOutcome =
	| { kind: "in-app" }
	| { kind: "external" }
	| { kind: "busy" }
	| { kind: "failed"; url: string };

export function createWebPageOpener(openers: WebPageOpeners): (url: string) => Promise<OpenWebPageOutcome> {
	let isOpening = false;

	return async (url) => {
		if (isOpening) return { kind: "busy" };
		isOpening = true;

		try {
			await openers.inApp(url);
			return { kind: "in-app" };
		} catch {
			try {
				await openers.external(url);
				return { kind: "external" };
			} catch {
				return { kind: "failed", url };
			}
		} finally {
			isOpening = false;
		}
	};
}
