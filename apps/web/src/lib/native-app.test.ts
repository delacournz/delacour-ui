import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_ID, appleAppSiteAssociation, assetLinks, NATIVE_APP, playgroundUrl, schemeUrl } from "./native-app";
import { siteUrl } from "./shared";

/**
 * The deep-link contract spans two apps that cannot import each other.
 *
 * `native-app.ts` restates the playground's scheme, bundle identifier, Apple
 * team id and playground prefix, because importing an Expo config here would pull
 * React Native into a browser bundle. Every one of those values is load
 * bearing: a stale bundle id in `apple-app-site-association` is an app that
 * silently stops intercepting links, with nothing failing anywhere to say so.
 *
 * So the config is read as **text**, the way `content.test.ts` and
 * `packages/native-ui/src/docs.test.ts` do — no import, no transpile, no
 * React Native.
 */

const REPO = join(import.meta.dirname, "..", "..", "..", "..");
const PLAYGROUND = join(REPO, "apps", "playground");

const APP_CONFIG = readFileSync(join(PLAYGROUND, "app.config.ts"), "utf-8");
const EAS_JSON = readFileSync(join(PLAYGROUND, "eas.json"), "utf-8");
const DEEP_LINK = readFileSync(join(PLAYGROUND, "src", "lib", "deep-link.ts"), "utf-8");

/** The first capture of `pattern` in `source`, or `undefined`. */
function capture(source: string, pattern: RegExp): string | undefined {
	return pattern.exec(source)?.[1];
}

describe("native-app config", () => {
	test("the scheme matches app.config.ts", () => {
		expect(capture(APP_CONFIG, /\bscheme:\s*"([^"]+)"/)).toBe(NATIVE_APP.SCHEME);
	});

	test("the bundle identifier matches app.config.ts", () => {
		expect(capture(APP_CONFIG, /\bbundleIdentifier:\s*"([^"]+)"/)).toBe(NATIVE_APP.BUNDLE_ID);
	});

	// iOS and Android share one identifier here, which is what lets the two
	// association files be built from a single constant.
	test("the android package matches app.config.ts", () => {
		expect(capture(APP_CONFIG, /\bpackage:\s*"([^"]+)"/)).toBe(NATIVE_APP.BUNDLE_ID);
	});

	test("the apple team id matches eas.json", () => {
		expect(capture(EAS_JSON, /"appleTeamId":\s*"([^"]+)"/)).toBe(NATIVE_APP.APPLE_TEAM_ID);
	});

	// The app's own copy of the prefix decides which incoming links it rewrites.
	// Disagree with it and the OS opens the app on the wrong screen.
	test("the playground prefix matches the app's rewrite", () => {
		expect(capture(DEEP_LINK, /PLAYGROUND_PATH_PREFIX = "([^"]+)"/)).toBe(NATIVE_APP.PLAYGROUND_PATH_PREFIX);
	});

	// A leading slash and no trailing one: every URL builder here appends.
	test("the playground prefix is a rooted path", () => {
		expect(NATIVE_APP.PLAYGROUND_PATH_PREFIX).toMatch(/^\/[^\s]*[^/]$/);
	});

	// The prefix must not sit under /docs, or Apple's glob would claim real
	// documentation URLs and the app would swallow them.
	test("the playground prefix does not overlap the docs tree", () => {
		expect(NATIVE_APP.PLAYGROUND_PATH_PREFIX.startsWith("/docs")).toBe(false);
	});
});

describe("associated domains", () => {
	const domains = [...APP_CONFIG.matchAll(/"applinks:([^"]+)"/g)].map(([, host]) => host as string);
	const hosts = [...APP_CONFIG.matchAll(/host:\s*"([^"]+)"/g)].map(([, host]) => host as string);
	const prefixes = [...APP_CONFIG.matchAll(/pathPrefix:\s*"([^"]+)"/g)].map(([, path]) => path as string);

	test("iOS is associated with at least the production host", () => {
		expect(domains).toContain(new URL(siteUrl).host);
	});

	// Android verifies an intent filter as a unit, so every host it names has to
	// serve `/.well-known/assetlinks.json` — which means the same set as iOS.
	test("both platforms name the same hosts", () => {
		expect([...hosts].sort()).toEqual([...domains].sort());
	});

	test("every intent filter is scoped to the playground prefix", () => {
		expect(prefixes.length).toBeGreaterThan(0);
		expect(new Set(prefixes)).toEqual(new Set([NATIVE_APP.PLAYGROUND_PATH_PREFIX]));
	});

	// Without it Android never verifies the filter and the link opens a browser.
	test("every intent filter auto-verifies", () => {
		const filters = APP_CONFIG.match(/action:\s*"VIEW"/g) ?? [];
		const verified = APP_CONFIG.match(/autoVerify:\s*true/g) ?? [];
		expect(verified.length).toBe(filters.length);
	});
});

describe("apple-app-site-association", () => {
	const aasa = appleAppSiteAssociation();
	const [detail] = aasa.applinks.details;

	test("the appID is the team id and the bundle id", () => {
		expect(APP_ID).toBe(`${NATIVE_APP.APPLE_TEAM_ID}.${NATIVE_APP.BUNDLE_ID}`);
		expect(detail?.appID).toBe(APP_ID);
	});

	// `paths`'s wildcard does not cross a slash, so a single glob would leave
	// `/playground/components/tabs/variants` — a real screen — unmatched.
	test("paths cover a nested facet as well as a component", () => {
		expect(detail?.paths).toEqual([
			`${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*`,
			`${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*/*`,
		]);
	});

	test("the modern components form is served alongside the legacy paths", () => {
		expect(detail?.components).toEqual([{ "/": `${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/*` }]);
	});

	test("it serialises to JSON", () => {
		expect(() => JSON.stringify(aasa)).not.toThrow();
	});
});

describe("assetlinks", () => {
	const [statement] = assetLinks();

	test("the package name matches the config", () => {
		expect(statement?.target.package_name).toBe(NATIVE_APP.BUNDLE_ID);
	});

	test("it delegates URL handling", () => {
		expect(statement?.relation).toContain("delegate_permission/common.handle_all_urls");
	});

	// Google rejects anything but uppercase, colon-separated hex. An empty list
	// is the honest unfinished state; a malformed one fails verification with no
	// obvious cause.
	test("every fingerprint is well formed", () => {
		for (const fingerprint of statement?.target.sha256_cert_fingerprints ?? []) {
			expect(fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
		}
	});
});

describe("link builders", () => {
	test("a playground URL is absolute and under the prefix", () => {
		expect(playgroundUrl("button")).toBe(`${siteUrl}${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/button`);
	});

	// Apple's `*` glob needs something after the prefix; the trailing slash is
	// what makes the home target a URL the association file actually claims.
	test("a playground URL with no slug keeps the trailing slash", () => {
		expect(playgroundUrl()).toBe(`${siteUrl}${NATIVE_APP.PLAYGROUND_PATH_PREFIX}/`);
	});

	// The scheme URL carries the in-app route directly — `+native-intent`
	// rewrites `https:` only and passes this through to the router untouched.
	test("a scheme URL is the in-app route", () => {
		expect(schemeUrl("tabs/variants")).toBe(`${NATIVE_APP.SCHEME}://tabs/variants`);
		expect(schemeUrl()).toBe(`${NATIVE_APP.SCHEME}://`);
	});
});
