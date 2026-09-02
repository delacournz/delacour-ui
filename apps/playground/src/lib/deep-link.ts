/**
 * The path prefix the documentation site serves playground links under, and the
 * one `applinks` is scoped to in `apple-app-site-association`. Changing it
 * means changing that file, the Android intent filters, and the QR the docs
 * render — `apps/web/src/lib/native-app.ts` owns the other end.
 */
const PLAYGROUND_PATH_PREFIX = "/playground/components";

/**
 * A base for parsing, not a link we ever build. Only its *scheme* is load
 * bearing, and only in that it is not `https:` — a bare in-app path like
 * `/button` has to come back out unrewritten. The literal mirrors
 * `app.config.ts`'s `scheme` for readability alone.
 */
const RELATIVE_BASE = "dlc-ui-playground://";

/** Where anything we cannot resolve to a screen goes. */
const HOME_ROUTE = "/";

/**
 * Rewrite an incoming universal link into the in-app route it names.
 *
 * `https://ui.delacour.co.nz/playground/components/tabs/variants` → `/tabs/variants`
 *
 * Everything else is returned exactly as it arrived. That is the important
 * half: the preview capture pipeline drives
 * `dlc-ui-playground://preview?component=…&demo=…&theme=…` through this same
 * function on every run, and Expo Router resolves it natively. Rewriting only
 * `https:` is what keeps `bun run previews` working.
 *
 * A slug with no screen — `provider`, a typo, a truncated scan — opens the home
 * screen rather than an unmatched route, which in a release build is a blank
 * screen and a console warning.
 *
 * @param path The system path, which Expo warns may be neither a path nor a
 *   valid URL. This function never throws for any input.
 * @param isKnownRoute Does the app have this route? `+native-intent.ts` answers
 *   from the generated demo registry; the parameter exists so this module can
 *   be tested without importing it.
 */
export function deepLinkToRoute(path: string, isKnownRoute: (route: string) => boolean): string {
	let url: URL;
	try {
		url = new URL(path, RELATIVE_BASE);
	} catch {
		return path;
	}

	if (url.protocol !== "https:") return path;

	const { pathname } = url;
	if (pathname !== PLAYGROUND_PATH_PREFIX && !pathname.startsWith(`${PLAYGROUND_PATH_PREFIX}/`)) return path;

	let route: string;
	try {
		route = decodeURIComponent(pathname.slice(PLAYGROUND_PATH_PREFIX.length)).replace(/^\/+|\/+$/g, "");
	} catch {
		return HOME_ROUTE;
	}

	return route && isKnownRoute(route) ? `/${route}` : HOME_ROUTE;
}
