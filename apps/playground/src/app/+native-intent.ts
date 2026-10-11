import { DEMO_IDS } from "@/demos/registry";
import { deepLinkToRoute, isKnownRoute } from "@/lib/deep-link";

/**
 * Turn an incoming universal link from the documentation site into the screen
 * it names, before Expo Router sees it.
 *
 * `https://ui.delacour.co.nz/playground/components/button` → `/button`, which is
 * what the QR on every component page encodes. Custom-scheme links and bare
 * paths are returned untouched, so the preview capture pipeline is unaffected.
 *
 * The whole rewrite lives in `@/lib/deep-link`, the route predicate included,
 * so `bun test` can cover it: this module imports the registry, which imports
 * every demo, which imports React Native — Flow-typed source Bun's transpiler
 * cannot parse.
 *
 * `initial` is deliberately unused. A playground link means the same screen
 * whether the app was cold or already running. The home screen beneath it on a
 * cold start comes from the root layout's `unstable_settings.anchor`, not here.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
	return deepLinkToRoute(path, (route) => isKnownRoute(route, DEMO_IDS));
}
