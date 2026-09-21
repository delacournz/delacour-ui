import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import type { ProjectInfo } from "../project/detect";
import { checkGestureHandlerRoot, checkStylingConflict, cssImportSpecifier, isOutermostWrapper } from "./doctor";

/**
 * The gesture-root check, against the layouts an Expo app actually has.
 *
 * `DelacourProvider` wraps `GestureHandlerRootView`, so an app that mounts the
 * provider has the gesture root without ever naming it — and a blank Expo
 * template mounts it from `App.tsx` at the project root, which no `app/` or
 * `src/` walk reaches.
 */

const directories: string[] = [];

async function app(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-doctor-"));
	directories.push(root);

	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content, "utf-8");
	}

	return root;
}

function config(root: string) {
	const parsed = configSchema.parse({
		paths: {
			ui: "src/components/ui",
			lib: "src/lib",
			hooks: "src/hooks",
			styles: "src/styles",
			icons: "src/lib/icons",
		},
	});
	return resolveConfig(parsed, root, join(root, "native-components.json"));
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("checkGestureHandlerRoot", () => {
	test("passes when the root layout mounts DelacourProvider", async () => {
		const root = await app({
			"app/_layout.tsx":
				'import { DelacourProvider } from "@/components/ui/provider";\nexport default () => <DelacourProvider />;',
		});

		const check = await checkGestureHandlerRoot(config(root));

		expect(check.status).toBe("pass");
		expect(check.detail).toContain("DelacourProvider");
	});

	test("passes when a blank-template App.tsx at the project root mounts it", async () => {
		const root = await app({
			"App.tsx":
				'import { DelacourProvider } from "./src/components/ui/provider";\nexport default () => <DelacourProvider />;',
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("pass");
	});

	test("still passes on a hand-mounted GestureHandlerRootView", async () => {
		const root = await app({
			"src/app/_layout.tsx":
				'import { GestureHandlerRootView } from "react-native-gesture-handler";\nexport default () => <GestureHandlerRootView />;',
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("pass");
	});

	test("does not count the copied provider component itself as the app mounting it", async () => {
		const root = await app({
			"src/components/ui/provider/provider.tsx": "export function DelacourProvider() { return null; }",
			"src/app/_layout.tsx": "export default () => null;",
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("warn");
	});

	test("warns, naming DelacourProvider first, when neither is mounted", async () => {
		const root = await app({ "app/_layout.tsx": "export default () => null;" });

		const check = await checkGestureHandlerRoot(config(root));

		expect(check.status).toBe("warn");
		expect(check.fix).toContain("DelacourProvider");
		expect(check.fix).toContain("GestureHandlerRootView");
		expect(check.fix?.indexOf("DelacourProvider")).toBeLessThan(check.fix?.indexOf("GestureHandlerRootView") ?? -1);
	});
});

describe("isOutermostWrapper", () => {
	test("the shape `init` writes", () => {
		expect(isOutermostWrapper('module.exports = withUniwindConfig(config, { cssEntryFile: "./a.css" });')).toBe(true);
	});

	/**
	 * Expo's own `with-router-uniwind` example. It assigns and then exports, and
	 * a check that failed on the official scaffold is a check people ignore.
	 */
	test("a wrapped config assigned to a variable and exported", () => {
		const metro = `const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
});

module.exports = uniwindConfig;`;

		expect(isOutermostWrapper(metro)).toBe(true);
	});

	test("ESM, assigned and exported", () => {
		expect(isOutermostWrapper("const wrapped = withUniwindConfig(config, {});\nexport default wrapped;")).toBe(true);
	});

	// The failure the check exists for: a wrapper that runs after it can replace
	// the transformer, and every component renders unstyled with nothing logged.
	test("another wrapper applied after it", () => {
		expect(isOutermostWrapper("module.exports = withSentry(withUniwindConfig(config, {}));")).toBe(false);
		expect(
			isOutermostWrapper("const wrapped = withSentry(withUniwindConfig(config, {}));\nmodule.exports = wrapped;")
		).toBe(false);
	});

	test("a name it cannot follow is not a pass", () => {
		expect(isOutermostWrapper("module.exports = somethingElse;")).toBe(false);
	});

	/**
	 * A Metro config is edited by hand and by half a dozen tools, so the shape
	 * varies more than a template suggests. Reassigning the same binding is the
	 * common one — `config = withX(config)` reads naturally when several
	 * wrappers are applied in turn — and the check used to call it a failure
	 * because it only looked at declarations.
	 */
	test("a binding reassigned without a declaration keyword", () => {
		const metro = `let config = getDefaultConfig(__dirname);
config = withUniwindConfig(config, { cssEntryFile: "./src/global.css" });

module.exports = config;`;

		expect(isOutermostWrapper(metro)).toBe(true);
	});

	test("the last assignment wins, not the first", () => {
		const wrapped = `const config = getDefaultConfig(__dirname);
config = withUniwindConfig(config, {});
module.exports = config;`;
		const notWrapped = `const config = withUniwindConfig(getDefaultConfig(__dirname), {});
config = withSentry(config);
module.exports = config;`;

		expect(isOutermostWrapper(wrapped)).toBe(true);
		expect(isOutermostWrapper(notWrapped)).toBe(false);
	});

	test("follows an alias more than one hop", () => {
		expect(isOutermostWrapper("const a = withUniwindConfig(config, {});\nconst b = a;\nmodule.exports = b;")).toBe(
			true
		);
	});

	/** An assignment after the export cannot be what was exported. */
	test("ignores an assignment below the export", () => {
		expect(isOutermostWrapper("module.exports = config;\nconfig = withUniwindConfig(config, {});")).toBe(false);
	});

	test("a property assignment is not an assignment to the binding", () => {
		const metro = `const config = getDefaultConfig(__dirname);
config.resolver.sourceExts = ["ts"];
module.exports = withUniwindConfig(config, {});`;

		expect(isOutermostWrapper(metro)).toBe(true);
	});

	test("a comparison is not an assignment", () => {
		expect(
			isOutermostWrapper("const config = withUniwindConfig(c, {});\nif (config === x) {}\nmodule.exports = config;")
		).toBe(true);
	});
});

/**
 * NativeWind and Uniwind are both Tailwind for React Native, and both work by
 * wrapping Metro and compiling `className`. A project holding the two stacks
 * one transform on the other: classes resolve through whichever wrapper ran
 * last, and the build breaks in a way that names neither library.
 *
 * It cannot be fixed automatically — which of the two a project keeps is the
 * owner's call — so the only useful thing is to say so before `init` wires
 * anything, and to keep saying it in `doctor`.
 */
describe("checkStylingConflict", () => {
	const project = (dependencies: Record<string, string>): ProjectInfo =>
		({
			packageJson: { dependencies },
			hasUniwind: "uniwind" in dependencies,
			hasTailwind: "tailwindcss" in dependencies,
		}) as unknown as ProjectInfo;

	test("passes a project with Uniwind and no NativeWind", () => {
		expect(checkStylingConflict(project({ uniwind: "~1.0.0", tailwindcss: "~4.1.16" })).status).toBe("pass");
	});

	test("fails a project holding both", () => {
		const check = checkStylingConflict(project({ uniwind: "~1.0.0", nativewind: "^4.1.0" }));

		expect(check.status).toBe("fail");
		expect(check.detail).toContain("nativewind");
		expect(check.fix).toContain("migration");
	});

	test("fails a project on NativeWind alone, because that is what init is about to wrap", () => {
		expect(checkStylingConflict(project({ nativewind: "^4.1.0" })).status).toBe("fail");
	});

	test("reads devDependencies too — where a styling library often sits", () => {
		const withDev = { packageJson: { devDependencies: { nativewind: "^4.1.0" } } } as unknown as ProjectInfo;
		expect(checkStylingConflict(withDev).status).toBe("fail");
	});

	test("says nothing about a project with neither", () => {
		expect(checkStylingConflict(project({})).status).toBe("pass");
	});
});

/**
 * The specifier a reader is told to paste.
 *
 * It used to be `./` plus the file's basename, which resolves only when the
 * root layout happens to sit in the same directory as the CSS entry. On the
 * ordinary Expo Router layout — `src/app/_layout.tsx` importing
 * `src/styles/global.css` — `./global.css` resolves to nothing, so the
 * instruction for the failure that renders every component unstyled was itself
 * wrong.
 */
describe("cssImportSpecifier", () => {
	test("is relative to the root layout, not to the CSS file", async () => {
		const root = await app({
			"src/app/_layout.tsx": "export default () => null;",
			"src/styles/global.css": "@import 'tailwindcss';",
		});

		expect(cssImportSpecifier(config(root))).toBe("../styles/global.css");
	});

	test("is `./` plus the name when the layout sits beside it", async () => {
		const root = await app({
			"App.tsx": "export default () => null;",
			"src/styles/global.css": "@import 'tailwindcss';",
		});

		expect(cssImportSpecifier(config(root))).toBe("./src/styles/global.css");
	});

	test("prefers the alias when the project has one", async () => {
		const root = await app({ "src/app/_layout.tsx": "export default () => null;" });
		const parsed = configSchema.parse({
			paths: {
				ui: "src/components/ui",
				lib: "src/lib",
				hooks: "src/hooks",
				styles: "src/styles",
				icons: "src/lib/icons",
			},
			aliases: { styles: "@/styles" },
		});

		expect(cssImportSpecifier(resolveConfig(parsed, root, join(root, "native-components.json")))).toBe(
			"@/styles/global.css"
		);
	});

	test("falls back to an app-relative path when there is no layout to anchor on", async () => {
		const root = await app({ "package.json": "{}" });
		expect(cssImportSpecifier(config(root))).toBe("./src/styles/global.css");
	});
});
