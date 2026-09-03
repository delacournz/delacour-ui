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
 * `@registry/` placeholder and no `delacour-react-native-ui` import survives into a
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
			expect(`${path}: ${content}`).not.toContain("delacour-react-native-ui");
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
