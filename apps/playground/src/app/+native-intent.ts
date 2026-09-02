import { DEMO_IDS } from "@/demos/registry";
import { deepLinkToRoute } from "@/lib/deep-link";

/**
 * Does the app have this route?
 *
 * Answered from the generated demo registry rather than a second hand-written
 * list. A demo id is `{component}/{demo}` or `{component}/{facet}/{demo}`, and
 * every gallery route is a proper prefix of one — so a prefix test accepts
 * `tabs` and `tabs/variants` alike, and rejects `provider`, which has no
 * screen, with nothing left to keep in sync.
 */
function isKnownRoute(route: string): boolean {
	return DEMO_IDS.some((id) => id === route || id.startsWith(`${route}/`));
}

/**
 * Turn an incoming universal link from the documentation site into the screen
 * it names, before Expo Router sees it.
 *
 * `https://ui.delacour.co.nz/playground/components/button` → `/button`, which is
 * what the QR on every component page encodes. Custom-scheme links and bare
 * paths are returned untouched, so the preview capture pipeline is unaffected.
 *
 * The whole rewrite lives in `@/lib/deep-link` so `bun test` can cover it:
 * this module imports the registry, which imports every demo, which imports
 * React Native — Flow-typed source Bun's transpiler cannot parse.
 *
 * `initial` is deliberately unused. A playground link means the same screen
 * whether the app was cold or already running.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
	return deepLinkToRoute(path, isKnownRoute);
}
