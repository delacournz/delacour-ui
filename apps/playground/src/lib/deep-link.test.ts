import { describe, expect, test } from "bun:test";
import { deepLinkToRoute } from "./deep-link";

/**
 * The rewrite is the whole contract between the documentation site and this
 * app, and it runs before the router exists — a wrong answer here is a link
 * that opens the app on the wrong screen, or an app that will not open at all.
 *
 * It is a pure function precisely so this file can exist. `+native-intent.ts`
 * supplies the route predicate from the generated demo registry, which imports
 * every demo module and therefore React Native, whose Flow-typed source Bun's
 * transpiler cannot parse. Splitting the logic out is what keeps it testable.
 */

/** Stands in for the generated registry: the routes the app actually has. */
const known = (route: string): boolean => ["button", "tabs", "tabs/variants", "bottom-sheet"].includes(route);

describe("deepLinkToRoute", () => {
	test("a universal link becomes the component's route", () => {
		expect(deepLinkToRoute("https://ui.delacour.co.nz/playground/components/button", known)).toBe("/button");
	});

	test("staging is rewritten the same way", () => {
		expect(deepLinkToRoute("https://ui.staging.delacour.co.nz/playground/components/button", known)).toBe("/button");
	});

	// The gallery facets are real routes — `(components)/tabs/variants.tsx` —
	// and the legacy `paths` glob in the association file is doubled up to let
	// them through, so the rewrite has to carry both segments.
	test("a nested facet keeps both segments", () => {
		expect(deepLinkToRoute("https://ui.delacour.co.nz/playground/components/tabs/variants", known)).toBe(
			"/tabs/variants"
		);
	});

	test("a trailing slash is not a different route", () => {
		expect(deepLinkToRoute("https://ui.delacour.co.nz/playground/components/button/", known)).toBe("/button");
	});

	test("a query string is dropped", () => {
		expect(deepLinkToRoute("https://ui.delacour.co.nz/playground/components/button?utm=qr", known)).toBe("/button");
	});

	// Apple's glob matches the bare prefix too, and `provider` is a component
	// with no screen. Both land on the app's home rather than an unmatched
	// route, which in a release build is a blank screen with a console warning.
	test.each([
		["https://ui.delacour.co.nz/playground/components", "the bare prefix"],
		["https://ui.delacour.co.nz/playground/components/", "the prefix with a slash"],
		["https://ui.delacour.co.nz/playground/components/provider", "a component with no screen"],
		["https://ui.delacour.co.nz/playground/components/not-a-component", "an unknown slug"],
		["https://ui.delacour.co.nz/playground/components/tabs/not-a-facet", "an unknown facet"],
	])("%s opens the home screen", (url) => {
		expect(deepLinkToRoute(url, known)).toBe("/");
	});

	// The capture pipeline drives `dlc-ui-playground://preview?component=…`
	// through this same function on every run. Rewriting only `https:` is what
	// keeps `bun run previews` working.
	test("a custom-scheme link is passed through untouched", () => {
		const url = "dlc-ui-playground://preview?component=switch&demo=colours&theme=dark";
		expect(deepLinkToRoute(url, known)).toBe(url);
	});

	test("a custom-scheme component link is passed through untouched", () => {
		expect(deepLinkToRoute("dlc-ui-playground://button", known)).toBe("dlc-ui-playground://button");
	});

	test("a bare in-app path is passed through untouched", () => {
		expect(deepLinkToRoute("/tabs/variants", known)).toBe("/tabs/variants");
	});

	// Every other page on the site is a link the app was never associated with,
	// but a stray one must not be swallowed.
	test("an https link outside the prefix is passed through untouched", () => {
		const url = "https://ui.delacour.co.nz/docs/native/components/button";
		expect(deepLinkToRoute(url, known)).toBe(url);
	});

	// Expo's own guidance: `path` carries no guarantee of being a path or a URL,
	// and throwing here crashes the launch rather than failing a navigation.
	test.each(["::::", "", "https://", "%%%"])("%p does not throw", (path) => {
		expect(() => deepLinkToRoute(path, known)).not.toThrow();
	});
});
