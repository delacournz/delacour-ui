import { siteUrl } from "./shared";

/**
 * Everything the documentation site knows about the playground app, in one
 * place: the QR on every component page, the "Open in Delacour UI" fallback,
 * and the two association files iOS and Android fetch all read from here.
 *
 * The values are duplicated from `apps/playground` — `app.config.ts` and
 * `eas.json` — because this app cannot import an Expo config without pulling
 * React Native into a browser bundle. `native-app.test.ts` reads those two
 * files as text and fails if any of them drift, which is what makes the copy
 * safe.
 */
export const NATIVE_APP = {
	NAME: "Delacour UI",
	/** `app.config.ts` → `scheme`. */
	SCHEME: "dlc-ui-playground",
	/** `app.config.ts` → `ios.bundleIdentifier`, and `android.package`. */
	BUNDLE_ID: "nz.co.delacour.ui.playground",
	/** `eas.json` → `submit.base.ios.appleTeamId`. */
	APPLE_TEAM_ID: "LN69P7N673",
	/**
	 * The path playground links live under. Scoped in `apple-app-site-association`
	 * and in the Android intent filters, and deliberately outside `/docs` so the
	 * glob cannot swallow a real documentation URL. The app's other end is
	 * `apps/playground/src/lib/deep-link.ts`.
	 */
	PLAYGROUND_PATH_PREFIX: "/playground/components",
	/**
	 * TestFlight public join link. The `PLACEHOLDER` segment is a sentinel —
	 * {@link isInstallable} reads it as "not set yet" and the button renders
	 * disabled, because a live link to a 404 is worse than no link. Pasting the
	 * real URL here is the whole activation step.
	 */
	IOS_TESTFLIGHT_URL: "https://testflight.apple.com/join/PLACEHOLDER",
	/** No Android distribution yet. `null` renders "Coming soon". */
	ANDROID_INSTALL_URL: null,
	/**
	 * From `eas credentials -p android`, plus Play App Signing's own fingerprint
	 * once the app is submitted. Until one is here Android App Links do not
	 * verify and a link opens the browser — which is the fallback page, so the
	 * empty state is safe rather than broken.
	 */
	ANDROID_SHA256_FINGERPRINTS: [],
} as const satisfies {
	NAME: string;
	SCHEME: string;
	BUNDLE_ID: string;
	APPLE_TEAM_ID: string;
	PLAYGROUND_PATH_PREFIX: string;
	IOS_TESTFLIGHT_URL: string | null;
	ANDROID_INSTALL_URL: string | null;
	ANDROID_SHA256_FINGERPRINTS: readonly string[];
};

/** `TEAMID.bundle.id` — the identifier Apple matches an installed app against. */
export const APP_ID = `${NATIVE_APP.APPLE_TEAM_ID}.${NATIVE_APP.BUNDLE_ID}`;

/** Marks a store link that has not been filled in yet. @see NATIVE_APP.IOS_TESTFLIGHT_URL */
const PLACEHOLDER = "PLACEHOLDER";

/** Is this a real install link, or a `null`/placeholder that should render disabled? */
export function isInstallable(url: string | null): url is string {
	return url !== null && !url.includes(PLACEHOLDER);
}

/**
 * The canonical URL a QR encodes, and the one the OS intercepts.
 *
 * Built from `siteUrl` rather than the live origin on purpose. The constant is
 * fixed and staging deliberately serves it, so the QR is identical under SSR
 * and hydration and needs no client-side origin read — and a code scanned off a
 * `localhost` page still points somewhere a phone can reach.
 *
 * @param slug A component slug, or omitted for the app's home screen.
 */
export function playgroundUrl(slug?: string): string {
	return `${siteUrl}${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/${slug ?? ""}`;
}

/**
 * The custom-scheme twin of {@link playgroundUrl}, which is what a phone already
 * on this site has to use: Safari treats a link to the domain it is already on
 * as an in-page navigation and never hands it to the app.
 *
 * The path is the in-app route directly — `dlc-ui-playground://button` — because
 * the app's `+native-intent` rewrites `https:` links only and passes a
 * custom-scheme path through to the router unchanged.
 */
export function schemeUrl(slug?: string): string {
	return `${NATIVE_APP.SCHEME}://${slug ?? ""}`;
}

/**
 * The body served at `/.well-known/apple-app-site-association`.
 *
 * Both key styles, on purpose. `paths` is the legacy form every iOS reads, and
 * its `*` will not cross a `/` — hence the second glob, which is what lets
 * `/playground/components/tabs/variants` through. `components` is the modern form,
 * whose `*` does cross, and which newer iOS prefers when present.
 */
export function appleAppSiteAssociation() {
	return {
		applinks: {
			apps: [],
			details: [
				{
					appID: APP_ID,
					appIDs: [APP_ID],
					paths: [`${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*`, `${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*/*`],
					components: [{ "/": `${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*` }],
				},
			],
		},
	};
}

/** The body served at `/.well-known/assetlinks.json`. */
export function assetLinks() {
	return [
		{
			relation: ["delegate_permission/common.handle_all_urls"],
			target: {
				namespace: "android_app",
				package_name: NATIVE_APP.BUNDLE_ID,
				sha256_cert_fingerprints: NATIVE_APP.ANDROID_SHA256_FINGERPRINTS,
			},
		},
	];
}
