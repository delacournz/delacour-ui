import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { COMPONENTS, COMPONENTS_WITHOUT_SCREENS, PLAYGROUND_SLUGS, playgroundSlugForDocsPath } from "./components";

/**
 * `COMPONENTS` is hand-maintained, and until now nothing checked it against
 * anything. It was already the de-duplication of three lists; the playground adds
 * a fourth consumer, and a slug that has drifted from the library or from the
 * playground now means a QR that opens the wrong screen — or an app that opens
 * its home screen and leaves the reader to guess why.
 *
 * Read as text, importing nothing from either app: a playground route imports
 * React Native, whose Flow-typed source Bun's transpiler cannot parse.
 */

const REPO = join(import.meta.dirname, "..", "..", "..", "..");
const LIBRARY = join(REPO, "packages", "native-ui", "src", "components");
const ROUTES = join(REPO, "apps", "playground", "src", "app", "(components)");

/**
 * The playground's component routes.
 *
 * A gallery is either a file (`button.tsx` → `/button`) or a directory with its
 * own index (`tabs/` → `/tabs`), so both shapes count. `delacour-mark` is the
 * one route that is not a component — a development-only readout of the brand
 * geometry.
 */
function playgroundRoutes(): string[] {
	return readdirSync(ROUTES, { withFileTypes: true })
		.map((entry) => (entry.isDirectory() ? entry.name : basename(entry.name, ".tsx")))
		.filter((name) => name !== "delacour-mark")
		.sort();
}

function libraryComponents(): string[] {
	return readdirSync(LIBRARY, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

describe("COMPONENTS", () => {
	test("names every component in the library, and no others", () => {
		expect(COMPONENTS.map((component) => component.slug).sort()).toEqual(libraryComponents());
	});

	test("no slug appears twice", () => {
		expect(new Set(COMPONENTS.map((component) => component.slug)).size).toBe(COMPONENTS.length);
	});
});

describe("PLAYGROUND_SLUGS", () => {
	// The whole point of the list: a slug here is a route the app has, so the
	// QR on that page opens a screen rather than the app's home.
	test("is exactly the playground's component routes", () => {
		expect([...PLAYGROUND_SLUGS].sort()).toEqual(playgroundRoutes());
	});

	// A component excluded here but still shipping a screen would lose its QR
	// for no reason, and nothing else would notice.
	test("every exclusion is a component with no route", () => {
		const routes = new Set(playgroundRoutes());
		expect([...COMPONENTS_WITHOUT_SCREENS].filter((slug) => routes.has(slug))).toEqual([]);
	});

	test("every exclusion is still a real component", () => {
		const library = new Set(libraryComponents());
		expect([...COMPONENTS_WITHOUT_SCREENS].filter((slug) => !library.has(slug))).toEqual([]);
	});
});

describe("playgroundSlugForDocsPath", () => {
	test("finds the slug of a component page", () => {
		expect(playgroundSlugForDocsPath("native/components/button.mdx")).toBe("button");
	});

	test.each([
		["native/components/index.mdx", "the components index"],
		["native/components/provider.mdx", "a component with no screen"],
		["native/getting-started/theming.mdx", "a page outside the components tree"],
		["native/cli/index.mdx", "the CLI docs"],
		["native/components/button", "a path with no extension"],
	])("%s has none", (path) => {
		expect(playgroundSlugForDocsPath(path)).toBeNull();
	});

	test("every component page with a screen resolves", () => {
		const unresolved = PLAYGROUND_SLUGS.filter(
			(slug) => playgroundSlugForDocsPath(`native/components/${slug}.mdx`) === null
		);
		expect(unresolved).toEqual([]);
	});
});
