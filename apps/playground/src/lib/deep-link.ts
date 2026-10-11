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
 * The engine galleries, which the demo registry cannot vouch for.
 *
 * Their demos are keyed `bottom-sheet-engine/…` and `charts/…` so the captures
 * stay apart from the skinned component's, but their routes sit inside that
 * component's folder — `(components)/bottom-sheet/engine.tsx`. No demo id
 * starts with either, so each is named here. The documentation site's engine
 * pages link to these; `apps/web/src/lib/components.ts` owns the other end.
 */
const ENGINE_ROUTES: readonly string[] = ["bottom-sheet/engine", "chart/engine"];

/**
 * Does the app have this route?
 *
 * A demo id is `{component}/{demo}` or `{component}/{facet}/{demo}`, and every
 * gallery route is a proper prefix of one — so a prefix test accepts `tabs` and
 * `tabs/variants` alike, and rejects `provider`, which has no screen, with
 * nothing left to keep in sync. The engine galleries are the exception, above.
 *
 * @param demoIds The generated registry's `DEMO_IDS`. A parameter so this
 *   module never imports the registry, which imports React Native.
 */
export function isKnownRoute(route: string, demoIds: readonly string[]): boolean {
	if (route === "") return false;
	return ENGINE_ROUTES.includes(route) || demoIds.some((id) => id === route || id.startsWith(`${route}/`));
}

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
