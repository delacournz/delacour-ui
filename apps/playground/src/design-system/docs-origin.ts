import Constants from "expo-constants";
import { DEFAULT_DOCS_SITE_URL, devOriginFrom } from "@/design-system/preset-url";

/**
 * Which documentation site this build should link at.
 *
 * Three sources, in falling precedence, and each is there for a case the one
 * below it cannot cover:
 *
 * 1. **`EXPO_PUBLIC_THEME_SITE_URL`**, when it is set. The escape hatch — point
 *    a dev build at staging, or at production, without editing anything.
 * 2. **The local dev server**, in a dev build. Working on the page itself means
 *    the button has to open the page you are working on, not the deployed one.
 *    The host comes from Metro rather than being assumed, so it is right on a
 *    simulator, a tethered device and an Android emulator alike — see
 *    `devOriginFrom`.
 * 3. **Production.** A release build, and the fallback whenever Expo publishes
 *    no host to derive from.
 *
 * This is the only file in `design-system/` that reads the Expo runtime, which
 * is why the derivation itself lives in `preset-url.ts` where `bun test` can
 * reach it. There is nothing here to test but the wiring.
 *
 * A dev build whose web server is not running gets a browser error rather than
 * the deployed site. That is the right failure: silently opening production
 * while you are editing the page is how you convince yourself a change did not
 * work.
 */
export function docsOrigin(): string {
	const configured = process.env.EXPO_PUBLIC_THEME_SITE_URL;
	if (configured) return configured;

	if (__DEV__) {
		// `hostUri` is on `expoConfig` for a dev-client launch and on
		// `expoGoConfig` for Expo Go; this app never runs the latter, but reading
		// both costs nothing and means a wrong launch degrades to production
		// instead of to a broken link.
		const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
		const local = devOriginFrom(hostUri);
		if (local) return local;
	}

	return DEFAULT_DOCS_SITE_URL;
}
