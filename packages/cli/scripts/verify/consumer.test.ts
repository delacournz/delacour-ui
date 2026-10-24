import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	assertNoCheckoutFallback,
	isPathInside,
	parseConsumerOptions,
	resolveOptionalEngines,
	UI_PACKAGE,
	validateConsumerTarball,
	writeConsumerStyles,
} from "./consumer";
import { BUNDLE_PLATFORMS, writeConsumerScreen } from "./render";

describe("consumer verification", () => {
	test("supports both layouts and rejects incompatible flags", () => {
		expect(parseConsumerOptions(["--consumer"])).toEqual({ consumer: true, install: true, layout: "standalone" });
		expect(parseConsumerOptions(["--consumer", "--layout", "monorepo"]).layout).toBe("monorepo");
		expect(parseConsumerOptions(["--consumer", "--monorepo"]).layout).toBe("monorepo");
		for (const flag of ["--no-install", "--tests", "--only", "--simulator"]) {
			expect(() => parseConsumerOptions(["--consumer", flag])).toThrow();
		}
		expect(BUNDLE_PLATFORMS).toEqual(["ios", "android"]);
		expect(isPathInside("/repo", "/repo/.verify/app")).toBe(true);
		expect(isPathInside("/repo", "/tmp/consumer")).toBe(false);
	});

	test("finds an installed optional engine that the app manifest does not declare", async () => {
		const root = await mkdtemp(join(tmpdir(), "consumer-resolve-test-"));
		try {
			await Bun.write(join(root, "package.json"), "{}");
			expect(await resolveOptionalEngines(root)).toEqual([]);
			const engine = join(root, "node_modules/@delacour/react-native-charts");
			await mkdir(engine, { recursive: true });
			await Bun.write(join(engine, "package.json"), '{"main":"index.js"}');
			await Bun.write(join(engine, "index.js"), "module.exports = {};");
			expect((await resolveOptionalEngines(root))[0]).toContain("@delacour/react-native-charts at");
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("rejects a dependency that resolves through a symlink into the checkout", async () => {
		const root = await mkdtemp(join(tmpdir(), "consumer-fallback-test-"));
		const app = join(root, "app");
		const checkout = join(root, "checkout");
		try {
			await mkdir(join(app, "node_modules"), { recursive: true });
			await mkdir(join(checkout, "node_modules/example"), { recursive: true });
			await Bun.write(join(app, "package.json"), "{}");
			await Bun.write(join(checkout, "node_modules/example/package.json"), '{"main":"index.js"}');
			await Bun.write(join(checkout, "node_modules/example/index.js"), "module.exports = {};");
			await symlink(join(checkout, "node_modules/example"), join(app, "node_modules/example"));
			await expect(assertNoCheckoutFallback(app, checkout, { dependencies: { example: "1.0.0" } })).rejects.toThrow(
				"resolves from the checkout"
			);
			const types = join(app, "node_modules/@types/example");
			await mkdir(types, { recursive: true });
			await Bun.write(join(types, "package.json"), '{"exports":{"./package.json":"./package.json"}}');
			await assertNoCheckoutFallback(app, checkout, { devDependencies: { "@types/example": "1.0.0" } });
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("writes the actual core and engine screens with the public provider", async () => {
		const root = await mkdtemp(join(tmpdir(), "consumer-screen-test-"));
		try {
			const reporter = { step() {}, pass() {}, fail() {}, detail() {}, verbose: false };
			for (const testCase of ["core", "engines"] as const) {
				await writeConsumerScreen(root, "./styles", testCase, reporter);
				const source = await readFile(join(root, "src/app.tsx"), "utf-8");
				expect(source).toContain('from "@delacour/react-native-ui/button"');
				expect(source).toContain('from "@delacour/react-native-ui/input"');
				expect(source).toContain("<DelacourProvider>");
				expect(source.includes('from "@delacour/react-native-ui/chart"')).toBe(testCase === "engines");
				expect(source.includes('from "@delacour/react-native-ui/bottom-sheet"')).toBe(testCase === "engines");
			}
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("scans the installed UI source in the app CSS entry", async () => {
		const root = await mkdtemp(join(tmpdir(), "consumer-styles-test-"));
		try {
			const library = join(root, "node_modules/@delacour/react-native-ui");
			await mkdir(join(library, "src/components/button"), { recursive: true });
			await Bun.write(join(root, "package.json"), "{}");
			await Bun.write(
				join(library, "package.json"),
				JSON.stringify({ exports: { "./button": "./src/components/button/index.js" } })
			);
			await Bun.write(join(library, "src/components/button/index.js"), "module.exports = {};");
			const cssPath = join(root, "src/styles/global.css");
			await writeConsumerStyles(root, cssPath);
			const css = await readFile(cssPath, "utf-8");
			expect(css).toContain('@import "@delacour/react-native-ui/styles"');
			expect(css).toContain('@source "../../node_modules/@delacour/react-native-ui/src"');
			expect(css).toContain('@source ".."');
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

describe("UI tarball", () => {
	const manifest = {
		name: UI_PACKAGE,
		files: ["src"],
		exports: {
			"./button": "./src/components/button/index.ts",
			"./input": "./src/components/input/index.ts",
			"./chart": "./src/components/chart/index.ts",
			"./bottom-sheet": "./src/components/bottom-sheet/index.ts",
		},
	};
	const files = Object.values(manifest.exports).map((entry) => `package/${entry.slice(2)}`);
	test("accepts exported source files in the packed archive", () => {
		expect(
			validateConsumerTarball(manifest, files, {
				"package/src/components/button/index.ts": 'export { Button } from "./button";',
			})
		).toEqual([]);
	});
	test("rejects missing targets and workspace-only source imports", () => {
		const problems = validateConsumerTarball(
			manifest,
			files.filter((entry) => !entry.endsWith("input/index.ts")),
			{
				"package/src/components/button/index.ts": 'export { Button } from "@/button";',
				"package/src/components/input/index.ts": 'export { Input } from "workspace:input";',
			}
		);
		expect(problems.some((problem) => problem.includes("missing tarball file"))).toBe(true);
		expect(problems.filter((problem) => problem.includes("workspace-only import"))).toHaveLength(2);
	});
});
