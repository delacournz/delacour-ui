import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import expoConfig from "./app.config";

/**
 * The config, the assets it names and the generator that writes them must agree.
 *
 * `ios/` and `android/` are gitignored and EAS prebuilds on its own builder, so
 * a config that cannot prebuild is invisible here and fails five minutes into a
 * release build. This is the cheapest place to catch that: the config imports
 * nothing but plain objects, so unlike the demo tree it can be imported rather
 * than read as text.
 *
 * What each assertion is actually protecting:
 *
 * - A path in the config with no file behind it. Expo resolves asset paths at
 *   prebuild, on the builder, long after the pull request went green.
 * - A colour-only `expo-splash-screen` config, which cannot link on Android —
 *   see the splash block below for why.
 * - The icon generator deleting an asset the config depends on, which is how
 *   this file came to exist.
 */

const PLAYGROUND = import.meta.dirname;
const GENERATOR = join(PLAYGROUND, "scripts", "generate-icons.ts");

/**
 * `expo-splash-screen`'s Android plugin writes
 * `windowSplashScreenAnimatedIcon → @drawable/splashscreen_logo` into
 * `styles.xml` unconditionally, but writes that drawable only when it is given
 * an `image` — and `MainActivity` carries the theme, so the dangling reference
 * is compiled rather than dropped. A splash configured with colours alone
 * therefore fails `:app:processReleaseResources` with "resource
 * drawable/splashscreen_logo not found", which is exactly how the 1.0.0 release
 * build died.
 *
 * `imageWidth` is capped because the plugin composites the image onto a
 * `288 * density` canvas at `(canvas - size) / 2`; past 288 that offset is
 * negative.
 */
type SplashConfig = {
	image?: string;
	imageWidth?: number;
	backgroundColor?: string;
	dark?: { image?: string; backgroundColor?: string };
};

const SPLASH_CANVAS = 288;

function pluginEntry(name: string): unknown {
	const entry = expoConfig.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === name);

	if (!Array.isArray(entry)) throw new Error(`app.config.ts declares no "${name}" plugin entry`);

	return entry[1];
}

const splash = pluginEntry("expo-splash-screen") as SplashConfig;

/**
 * Every relative path anywhere in the config, found by walking it rather than by
 * listing the keys. Listing them means the next asset added is the one nobody
 * checks — and the 97 embedded font faces, whose paths reach out of this
 * workspace into the hoisted root, are worth the walk on their own.
 */
function relativePaths(value: unknown, found: Set<string> = new Set()): Set<string> {
	if (typeof value === "string") {
		if (value.startsWith("./") || value.startsWith("../")) found.add(value);
		return found;
	}

	if (Array.isArray(value)) {
		for (const item of value) relativePaths(item, found);
		return found;
	}

	if (typeof value === "object" && value !== null) {
		for (const item of Object.values(value)) relativePaths(item, found);
	}

	return found;
}

/** The `./assets/*` subset — the files `bun run icons` is responsible for. */
function assetPaths(): string[] {
	return [...relativePaths(expoConfig)].filter((path) => path.startsWith("./assets/"));
}

describe("app.config.ts assets", () => {
	test("every path it names exists on disk", () => {
		const missing = [...relativePaths(expoConfig)].filter((path) => !existsSync(resolve(PLAYGROUND, path)));

		expect(missing).toEqual([]);
	});

	test("it names some, so the walk is not passing on an empty set", () => {
		expect(assetPaths().length).toBeGreaterThan(0);
	});
});

describe("expo-splash-screen", () => {
	test("declares an image, because the Android style item is unconditional", () => {
		expect(splash.image).toBeString();
	});

	test("declares a dark image, rather than leaning on resource fallback", () => {
		expect(splash.dark?.image).toBeString();
	});

	test("keeps both background colours", () => {
		expect(splash.backgroundColor).toBeString();
		expect(splash.dark?.backgroundColor).toBeString();
	});

	test("sizes the image inside the canvas the plugin composites onto", () => {
		expect(splash.imageWidth).toBeNumber();
		expect(splash.imageWidth).toBeLessThanOrEqual(SPLASH_CANVAS);
	});
});

describe("generate-icons.ts", () => {
	const source = readFileSync(GENERATOR, "utf8");

	/**
	 * The generator deletes a list of unreferenced Expo template defaults on
	 * every run. An asset that graduates from that list into the config and is
	 * left in it is deleted by the next `bun run icons`, and the build breaks
	 * with no edit to blame.
	 */
	test("does not delete an asset the config depends on", () => {
		const stale = source.match(/const STALE = \[([^\]]*)\]/)?.[1];

		expect(stale).toBeString();

		const deleted = (stale as string).match(/"([^"]+)"/g)?.map((quoted) => quoted.slice(1, -1)) ?? [];
		const referenced = assetPaths().map((path) => path.replace("./assets/", ""));

		expect(deleted.filter((file) => referenced.includes(file))).toEqual([]);
	});

	test("writes every asset the config names", () => {
		const unwritten = assetPaths()
			.map((path) => path.replace("./assets/", ""))
			.filter((file) => !source.includes(`"${file}"`));

		expect(unwritten).toEqual([]);
	});
});
