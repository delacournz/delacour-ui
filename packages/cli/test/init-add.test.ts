import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { add } from "../src/commands/add";
import { init } from "../src/commands/init";
import { readConfig } from "../src/config/resolve";

/**
 * End to end, against the registry this repository actually builds.
 *
 * No network: the registry is read from `registry/` on disk, which is the same
 * JSON that ships. Nothing is installed either — `--no-install` — because what
 * is being tested is the copying and the wiring, and a real `expo install`
 * would take a minute and need a network.
 *
 * The assertion that matters most is the last one in each block: no
 * `@registry/` placeholder and no `@delacour/react-native-ui` import survives into a
 * consumer's file. Either would be a component that does not resolve.
 */

const FIXTURES = join(import.meta.dirname, "fixtures");
const REGISTRY = join(import.meta.dirname, "../../../registry");

const SHARED = { registry: REGISTRY, install: false, defaults: true, silent: true, yes: true } as const;

const workspaces: string[] = [];

async function scaffold(fixture: string): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "delacour-test-"));
	await cp(join(FIXTURES, fixture), directory, { recursive: true });
	workspaces.push(directory);
	return directory;
}

afterAll(async () => {
	await Promise.all(workspaces.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("init and add, in a plain Expo app", () => {
	let root: string;

	beforeAll(async () => {
		root = await scaffold("expo-app");
		await init([], { ...SHARED, cwd: root });
		await add(["button"], { ...SHARED, cwd: root });
	});

	test("writes a config that records both the paths and the aliases it found", async () => {
		const config = await readConfig(join(root, "native-components.json"));

		expect(config.paths.ui).toBe("src/components/ui");
		expect(config.aliases.ui).toBe("@/components/ui");
		expect(config.app.root).toBe(".");
	});

	test("copies the component and everything it needs", async () => {
		await expect(exists(root, "src/components/ui/button/button.tsx")).resolves.toBe(true);
		await expect(exists(root, "src/components/ui/icon/icon.tsx")).resolves.toBe(true);
		await expect(exists(root, "src/components/ui/spinner/spinner.tsx")).resolves.toBe(true);
		await expect(exists(root, "src/lib/cn.ts")).resolves.toBe(true);
		await expect(exists(root, "src/styles/tokens.css")).resolves.toBe(true);
	});

	test("copies the root provider in without being asked", async () => {
		await expect(exists(root, "src/components/ui/provider/provider.tsx")).resolves.toBe(true);
		await expect(exists(root, "src/hooks/use-keyboard-state-sync.tsx")).resolves.toBe(true);
	});

	// `expo/types` declares `*.css`; a template with no router ships no
	// `expo-env.d.ts`, and the CSS import init asks for then fails `tsc`.
	test("writes expo-env.d.ts so the CSS import typechecks before the first start", async () => {
		await expect(exists(root, "expo-env.d.ts")).resolves.toBe(true);
		expect(await read(root, "expo-env.d.ts")).toContain('reference types="expo/types"');
	});

	test("does not copy the library's tests", async () => {
		await expect(exists(root, "src/components/ui/button/button.variants.test.ts")).resolves.toBe(false);
	});

	test("rewrites imports to the project's own aliases", async () => {
		const button = await read(root, "src/components/ui/button/button.tsx");

		expect(button).toContain('from "@/components/ui/icon"');
		expect(button).toContain('from "@/components/ui/pressable"');
		expect(button).toContain('from "./button.variants"');
	});

	test("leaves no placeholder and no reference to the source package anywhere", async () => {
		for (const path of await written(root)) {
			const content = await read(root, path);
			expect(`${path}: ${content}`).not.toContain("@registry/");
			expect(`${path}: ${content}`).not.toContain("@delacour/react-native-ui");
		}
	});

	test("wraps Metro with Uniwind, outermost", async () => {
		const metro = await read(root, "metro.config.js");

		expect(metro).toContain('require("uniwind/metro")');
		expect(metro).toMatch(/module\.exports = withUniwindConfig\(config, \{/);
		expect(metro).toContain('cssEntryFile: "./src/styles/global.css"');
	});

	test("points Tailwind at every directory it copied code into", async () => {
		const css = await read(root, "src/styles/global.css");

		expect(css).toContain('@import "./index.css";');
		expect(css).toContain('@source "../components/ui";');
		expect(css).toContain('@source "../lib";');
	});

	test("is safe to run twice", async () => {
		const before = await read(root, "src/styles/global.css");
		await add(["button"], { ...SHARED, cwd: root });

		expect(await read(root, "src/styles/global.css")).toBe(before);
		expect((before.match(/delacour:start/g) ?? []).length).toBe(1);
	});
});

describe("a shared package in a monorepo", () => {
	let root: string;
	let packageRoot: string;

	beforeAll(async () => {
		root = await scaffold("expo-monorepo");
		packageRoot = join(root, "packages/ui");
		await init(["separator"], { ...SHARED, cwd: root, packageName: "@fixture/ui", packagePath: "packages/ui" });
	});

	test("writes the config beside the components, pointing back at the app", async () => {
		const config = await readConfig(join(packageRoot, "native-components.json"));

		expect(config.app.root).toBe("../../apps/mobile");
		expect(config.directories.ui).toBe(join(packageRoot, "src/components/ui"));
	});

	test("copies into the package, not the app", async () => {
		await expect(exists(packageRoot, "src/components/ui/separator/separator.tsx")).resolves.toBe(true);
		await expect(exists(root, "apps/mobile/src/components/ui/separator/separator.tsx")).resolves.toBe(false);
	});

	test("wires the app's Metro config, which is where Metro actually runs", async () => {
		const metro = await read(root, "apps/mobile/metro.config.js");

		expect(metro).toContain("withUniwindConfig");
		expect(metro).toContain('cssEntryFile: "./src/styles/global.css"');
	});

	/**
	 * The failure this whole check exists for: Tailwind's scanner does not follow
	 * symlinks, so a `@source` pointing into `node_modules` would contribute
	 * nothing and the components would render unstyled in a release build.
	 */
	test("scans the package by its real path, not through node_modules", async () => {
		const css = await read(root, "apps/mobile/src/styles/global.css");

		expect(css).toContain("../../../../packages/ui/src/components/ui");
		expect(css).not.toContain("node_modules");
	});

	test("creates a package the app can actually import from", async () => {
		const pkg = JSON.parse(await read(packageRoot, "package.json")) as {
			name: string;
			exports: Record<string, string>;
			dependencies?: Record<string, string>;
			peerDependencies?: Record<string, string>;
		};

		expect(pkg.name).toBe("@fixture/ui");
		expect(pkg.exports["./separator"]).toBe("./src/components/ui/separator/index.ts");
		// A root barrel would make every app resolve every optional peer.
		expect(pkg.exports["."]).toBeUndefined();
		// Native modules are peers, never dependencies: two copies register twice.
		expect(pkg.dependencies).toBeUndefined();
		expect(Object.keys(pkg.peerDependencies ?? {})).toContain("tailwind-variants");
	});

	test("adds itself to the app's dependencies", async () => {
		const app = JSON.parse(await read(root, "apps/mobile/package.json")) as {
			dependencies?: Record<string, string>;
		};

		expect(app.dependencies?.["@fixture/ui"]).toBe("workspace:*");
	});

	test("wires Metro to resolve across the workspace", async () => {
		const metro = await read(root, "apps/mobile/metro.config.js");

		expect(metro).toContain("config.watchFolders = [workspaceRoot];");
		expect(metro).toContain("config.resolver.disableHierarchicalLookup = true;");
		// The Uniwind wrapper has to stay outermost, after the resolver block.
		expect(metro.indexOf("extraNodeModules")).toBeLessThan(metro.indexOf("withUniwindConfig(config"));
	});

	/**
	 * The augmentation is one triple-slash reference, so it is loadable only from
	 * inside the app's own `tsconfig` include — a copy in the package never joins
	 * the app's program, and every `className` becomes a type error.
	 */
	test("gives the app the Uniwind type augmentation, not just the package", async () => {
		await expect(exists(root, "apps/mobile/uniwind-env.d.ts")).resolves.toBe(true);
		expect(await read(root, "apps/mobile/uniwind-env.d.ts")).toContain('reference types="uniwind/types"');
	});

	test("extends the exports map on a second add rather than replacing it", async () => {
		await add(["badge"], { ...SHARED, cwd: packageRoot });

		const pkg = JSON.parse(await read(packageRoot, "package.json")) as { exports: Record<string, string> };

		expect(pkg.exports["./separator"]).toBeDefined();
		expect(pkg.exports["./badge"]).toBe("./src/components/ui/badge/index.ts");
	});

	test("falls back to relative imports when the package has no path aliases", async () => {
		const config = await readConfig(join(packageRoot, "native-components.json"));
		expect(config.aliases).toEqual({});

		const separator = await read(packageRoot, "src/components/ui/separator/separator.tsx");
		expect(separator).toContain('from "../../../lib/tv"');
		expect(separator).not.toContain("@registry/");
	});
});

async function read(root: string, path: string): Promise<string> {
	return readFile(join(root, path), "utf-8");
}

async function exists(root: string, path: string): Promise<boolean> {
	return Bun.file(join(root, path)).exists();
}

/** Every file the CLI wrote into the project's source directories. */
async function written(root: string): Promise<string[]> {
	const { readdir } = await import("node:fs/promises");
	const entries = await readdir(join(root, "src"), { recursive: true, withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name).slice(root.length + 1))
		.filter((path) => !path.includes("/app/"));
}

/**
 * `add` in a project that has never been set up.
 *
 * This used to be an error everywhere except an interactive terminal, which
 * meant a script, a CI job and every MCP call hit `MissingConfigError` while a
 * human at a prompt sailed through. One command is the whole promise, so `add`
 * now sets the project up itself — and `--no-init` is how a caller says it
 * would rather be told.
 */
describe("add in an uninitialised app", () => {
	test("sets the project up, then copies what was asked for", async () => {
		const root = await scaffold("expo-app");
		const result = await add(["button"], { ...SHARED, cwd: root });

		await expect(exists(root, "native-components.json")).resolves.toBe(true);
		await expect(exists(root, "src/components/ui/button/button.tsx")).resolves.toBe(true);
		// The two `init` always adds, so a fresh project renders and responds to touch.
		await expect(exists(root, "src/styles/theme.css")).resolves.toBe(true);
		await expect(exists(root, "src/components/ui/provider/provider.tsx")).resolves.toBe(true);

		// The caller has to learn what the components now need from npm; before
		// this returned `null` and an agent copied a component blind.
		expect(result?.items).toContain("button");
		expect(result?.items).toContain("provider");
		expect(result?.installed).toBe(false);
	});

	test("wires Metro and the CSS entry, the same as a bare init would", async () => {
		const root = await scaffold("expo-app");
		await add(["separator"], { ...SHARED, cwd: root });

		expect(await read(root, "metro.config.js")).toContain("withUniwindConfig");
		expect(await read(root, "src/styles/global.css")).toContain("delacour:start");
	});

	test("refuses rather than setting up when --no-init is passed", async () => {
		const root = await scaffold("expo-app");

		await expect(add(["button"], { ...SHARED, cwd: root, init: false })).rejects.toThrow(/native-components\.json/);
		await expect(exists(root, "native-components.json")).resolves.toBe(false);
	});

	test("does not set up again on the next add", async () => {
		const root = await scaffold("expo-app");
		await add(["separator"], { ...SHARED, cwd: root });

		const before = await read(root, "native-components.json");
		const result = await add(["badge"], { ...SHARED, cwd: root });

		expect(await read(root, "native-components.json")).toBe(before);
		expect(result?.items).toContain("badge");
		// `init`'s own two are not re-added, so this was a plain `add`.
		expect(result?.items).not.toContain("provider");
	});
});

/**
 * A project that already has Uniwind, from Expo's `with-router-uniwind`
 * example — the scaffold the Quick start sends people to.
 *
 * Metro is already wrapped there, and it names a CSS entry of the template's
 * own choosing: `src/global.css`, not the `src/styles/global.css` this CLI
 * would have picked. `init` used to write its `@source` block into the path it
 * preferred and leave Metro pointing at the other one, so Tailwind compiled a
 * file with no globs in it and every component rendered unstyled — silently,
 * which is the failure mode this whole library keeps warning about.
 */
describe("an app that already has Uniwind wired", () => {
	let root: string;

	beforeAll(async () => {
		root = await scaffold("uniwind-app");
		await add(["button"], { ...SHARED, cwd: root });
	});

	test("records the CSS entry Metro actually compiles", async () => {
		const config = await readConfig(join(root, "native-components.json"));
		expect(config.app.css).toBe("src/global.css");
	});

	test("adds its block to that file, and creates no second one", async () => {
		expect(await read(root, "src/global.css")).toContain("delacour:start");
		await expect(exists(root, "src/styles/global.css")).resolves.toBe(false);
	});

	test("keeps the template's own imports above the block", async () => {
		const css = await read(root, "src/global.css");

		expect(css).toContain('@import "tailwindcss";');
		expect(css).toContain('@import "uniwind";');
		expect(css.indexOf('@import "tailwindcss"')).toBeLessThan(css.indexOf("delacour:start"));
	});

	test("scans where the components landed", async () => {
		const css = await read(root, "src/global.css");
		expect(css).toContain('@source "./components/ui";');
	});

	test("leaves the wrapped Metro config alone", async () => {
		const metro = await read(root, "metro.config.js");

		expect(metro).toContain('cssEntryFile: "./src/global.css"');
		// One wrapper, not two.
		expect(metro.match(/withUniwindConfig/g)?.length).toBe(2);
	});

	test("records the type shim Metro generates, not one of its own", async () => {
		const config = await readConfig(join(root, "native-components.json"));
		expect(config.app.uniwindTypes).toBe("src/uniwind-types.d.ts");
	});

	test("writes relative imports, since the template has no path aliases", async () => {
		const config = await readConfig(join(root, "native-components.json"));
		expect(config.aliases).toEqual({});

		const separator = await read(root, "src/components/ui/separator/separator.tsx");
		expect(separator).toContain('from "../../../lib/tv"');
		expect(separator).not.toContain("@registry/");
	});
});

/**
 * Uniwind installed, Metro not yet wired, and a Tailwind entry already on disk.
 *
 * Every app that ran `bun add uniwind tailwindcss`, made a `global.css` and
 * stopped is in this state. `init` used to write a *second* entry at its own
 * default path and wire Metro to that, leaving the layout importing the first
 * one — so Tailwind compiled the file with the `@source` globs while the app
 * loaded the file without them, and every component rendered unstyled.
 */
describe("an app with a Tailwind entry but no Metro wrapper", () => {
	let root: string;

	beforeAll(async () => {
		root = await scaffold("uniwind-app");
		// Uniwind installed and `src/global.css` present, but Metro untouched.
		await write(root, "metro.config.js", UNWIRED_METRO);
		await add(["button"], { ...SHARED, cwd: root });
	});

	test("adopts the entry the app already has", async () => {
		const config = await readConfig(join(root, "native-components.json"));
		expect(config.app.css).toBe("src/global.css");
	});

	test("writes no second entry", async () => {
		await expect(exists(root, "src/styles/global.css")).resolves.toBe(false);
	});

	test("wires Metro to that same file", async () => {
		const metro = await read(root, "metro.config.js");

		expect(metro).toContain("withUniwindConfig");
		expect(metro).toContain('cssEntryFile: "./src/global.css"');
	});

	test("leaves the block where the layout's import already points", async () => {
		expect(await read(root, "src/global.css")).toContain("delacour:start");
		expect(await read(root, "src/app/_layout.tsx")).toContain('import "../global.css"');
	});
});

const UNWIRED_METRO = `const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
`;

async function write(root: string, path: string, content: string): Promise<void> {
	const { writeFile } = await import("node:fs/promises");
	await writeFile(join(root, path), content, "utf-8");
}
