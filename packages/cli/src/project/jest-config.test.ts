import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import {
	ensureJestConfig,
	JEST_RESOLVER,
	MJS_TRANSFORM_PATTERN,
	MJS_TRANSFORMER,
	patchJestJson,
	patchJestSource,
	RENDER_TRANSFORMS,
	renderSetupIssues,
} from "./jest-config";

const SETUP = "<rootDir>/src/lib/test/setup.ts";
const EXPO_IGNORE = "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|react-native-svg)";

describe("patchJestJson", () => {
	test("a bare preset gains the setup file, the resolver and the full transform list", () => {
		const { config, changed, manual } = patchJestJson({ preset: "jest-expo" }, SETUP);

		expect(changed).toBe(true);
		expect(manual).toEqual([]);
		expect(config.preset).toBe("jest-expo");
		expect(config.setupFiles).toEqual([SETUP]);
		expect(config.resolver).toBe(JEST_RESOLVER);
		const [pattern] = config.transformIgnorePatterns as string[];
		for (const transform of RENDER_TRANSFORMS) expect(pattern).toContain(transform);
		expect(pattern).toContain("(jest-)?react-native");
		expect(config.transform).toEqual({ [MJS_TRANSFORM_PATTERN]: MJS_TRANSFORMER });
	});

	test("adds the .mjs transform beside the project's own transforms", () => {
		const { config, changed } = patchJestJson({ transform: { "\\.svg$": "./svg.js" } }, SETUP);

		expect(changed).toBe(true);
		expect(config.transform).toEqual({ "\\.svg$": "./svg.js", [MJS_TRANSFORM_PATTERN]: MJS_TRANSFORMER });
	});

	test("leaves a transform that already compiles .mjs alone", () => {
		const transform = { "^.+\\.(mjs|js)$": "./mine.js" };
		const { config } = patchJestJson({ transform }, SETUP);
		expect(config.transform).toEqual(transform);
	});

	test("a transform that is not an object is left for the user", () => {
		const { manual } = patchJestJson({ transform: "nope" }, SETUP);
		expect(manual.join("\n")).toContain(".mjs");
	});

	test("keeps existing setup files and with ours first", () => {
		const { config } = patchJestJson({ setupFiles: ["./mine.ts"] }, SETUP);
		expect(config.setupFiles).toEqual([SETUP, "./mine.ts"]);
	});

	test("extends the project's own transform pattern instead of replacing it", () => {
		const { config } = patchJestJson({ transformIgnorePatterns: [EXPO_IGNORE, "/dist/"] }, SETUP);
		const [pattern, other] = config.transformIgnorePatterns as string[];

		expect(other).toBe("/dist/");
		expect(pattern).toStartWith("node_modules/(?!@delacour/.*|");
		expect(pattern).toEndWith("((jest-)?react-native|@react-native(-community)?)|expo(nent)?|react-native-svg)");
	});

	test("is idempotent", () => {
		const once = patchJestJson({ preset: "jest-expo" }, SETUP).config;
		const twice = patchJestJson(once, SETUP);

		expect(twice.changed).toBe(false);
		expect(twice.config).toEqual(once);
	});

	test("only adds the transforms that are missing", () => {
		const partial = EXPO_IGNORE.replace("(?!", "(?!@delacour/.*|");
		const { config } = patchJestJson({ transformIgnorePatterns: [partial] }, SETUP);
		const [pattern] = config.transformIgnorePatterns as string[];

		expect(pattern.split("@delacour/.*")).toHaveLength(2);
		expect(pattern).toContain("d3-.*");
	});

	test("leaves a different resolver alone and says what to do", () => {
		const { config, manual } = patchJestJson({ resolver: "./my-resolver.js" }, SETUP);

		expect(config.resolver).toBe("./my-resolver.js");
		expect(manual.join("\n")).toContain(JEST_RESOLVER);
	});

	test("a transform list with no node_modules pattern is left for the user", () => {
		const { config, manual } = patchJestJson({ transformIgnorePatterns: ["/dist/"] }, SETUP);

		expect(config.transformIgnorePatterns).toEqual(["/dist/"]);
		expect(manual.join("\n")).toContain("transformIgnorePatterns");
	});
});

describe("patchJestSource", () => {
	test("adds the three keys after the opening brace of an export default", () => {
		const { text, changed, manual } = patchJestSource('export default {\n\tpreset: "jest-expo",\n};\n', SETUP);

		expect(changed).toBe(true);
		expect(manual).toEqual([]);
		expect(text).toContain(`setupFiles: ["${SETUP}"]`);
		expect(text).toContain(`resolver: "${JEST_RESOLVER}"`);
		expect(text).toContain("transformIgnorePatterns: [");
		expect(text).toContain(`transform: { "${MJS_TRANSFORM_PATTERN.replaceAll("\\", "\\\\")}": "${MJS_TRANSFORMER}" }`);
		expect(text).toContain('preset: "jest-expo"');
	});

	test("a transform key that does not compile .mjs is left for the user", () => {
		const { manual } = patchJestSource('export default {\n\ttransform: { "\\\\.svg$": "./svg.js" },\n};\n', SETUP);
		expect(manual.join("\n")).toContain(".mjs");
	});

	test("handles module.exports and a typed const config", () => {
		expect(patchJestSource("module.exports = {\n};\n", SETUP).changed).toBe(true);
		expect(
			patchJestSource(
				'import type { Config } from "jest";\nconst config: Config = {\n};\nexport default config;\n',
				SETUP
			).changed
		).toBe(true);
	});

	test("appends to an existing setupFiles array and extends an existing transform pattern", () => {
		const source = `export default {\n\tsetupFiles: ["./mine.ts"],\n\ttransformIgnorePatterns: ["${EXPO_IGNORE}"],\n};\n`;
		const { text } = patchJestSource(source, SETUP);

		expect(text).toContain(`setupFiles: ["${SETUP}", "./mine.ts"]`);
		expect(text).toContain('"node_modules/(?!@delacour/.*|');
	});

	test("is idempotent", () => {
		const once = patchJestSource("export default {\n};\n", SETUP).text;
		const twice = patchJestSource(once, SETUP);

		expect(twice.changed).toBe(false);
		expect(twice.text).toBe(once);
	});

	test("a config it cannot find the object of is left alone, with the snippet to add", () => {
		const source = "export default makeConfig();\n";
		const { text, changed, manual } = patchJestSource(source, SETUP);

		expect(changed).toBe(false);
		expect(text).toBe(source);
		expect(manual.join("\n")).toContain("object literal");
	});
});

describe("renderSetupIssues", () => {
	test("names what a Jest config is missing", () => {
		expect(renderSetupIssues("{}", SETUP)).toEqual([
			`setupFiles does not list ${SETUP}`,
			`resolver is not ${JEST_RESOLVER}`,
			expect.stringContaining("transformIgnorePatterns"),
			expect.stringContaining(".mjs"),
		]);
	});

	test("is quiet for a patched config", () => {
		const patched = patchJestJson({ preset: "jest-expo" }, SETUP).config;
		expect(renderSetupIssues(JSON.stringify(patched), SETUP)).toEqual([]);
	});
});

describe("ensureJestConfig", () => {
	let root: string;
	const config = (): ResolvedConfig => {
		const parsed = configSchema.parse({
			paths: { ui: "src/ui", lib: "src/lib", hooks: "src/hooks", styles: "src/styles", icons: "src/icons" },
		});
		return resolveConfig(parsed, root, join(root, "native-components.json"), "jest");
	};

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "jest-config-"));
	});
	afterEach(() => rm(root, { recursive: true, force: true }));

	test("patches package.json#jest and keeps the file's indentation", async () => {
		await writeFile(
			join(root, "package.json"),
			JSON.stringify({ name: "app", jest: { preset: "jest-expo" } }, null, 2)
		);

		const result = await ensureJestConfig(config());

		expect(result).toEqual({ status: "patched", file: "package.json" });
		const text = await readFile(join(root, "package.json"), "utf-8");
		expect(text).toContain('\n  "name": "app"');
		expect(JSON.parse(text).jest.setupFiles).toEqual([SETUP]);
	});

	test("creates package.json#jest when the project has no Jest config at all", async () => {
		await writeFile(join(root, "package.json"), JSON.stringify({ name: "app" }));

		expect((await ensureJestConfig(config())).status).toBe("patched");
		expect(JSON.parse(await readFile(join(root, "package.json"), "utf-8")).jest.preset).toBe("jest-expo");
	});

	test("patches a jest.config.js in preference to package.json", async () => {
		await writeFile(join(root, "package.json"), JSON.stringify({ name: "app" }));
		await writeFile(join(root, "jest.config.js"), 'module.exports = { preset: "jest-expo" };\n');

		expect(await ensureJestConfig(config())).toEqual({ status: "patched", file: "jest.config.js" });
		expect(await readFile(join(root, "jest.config.js"), "utf-8")).toContain(SETUP);
	});

	test("reports unchanged on the second run", async () => {
		await writeFile(join(root, "package.json"), JSON.stringify({ name: "app" }));
		await ensureJestConfig(config());

		expect(await ensureJestConfig(config())).toEqual({ status: "unchanged", file: "package.json" });
	});

	test("hands back the snippet when the config cannot be edited safely", async () => {
		await mkdir(root, { recursive: true });
		await writeFile(join(root, "package.json"), JSON.stringify({ name: "app" }));
		await writeFile(join(root, "jest.config.js"), "module.exports = makeConfig();\n");

		const result = await ensureJestConfig(config());

		expect(result.status).toBe("manual");
		if (result.status === "manual") {
			expect(result.file).toBe("jest.config.js");
			expect(result.snippet).toContain(SETUP);
			expect(result.snippet).toContain(JEST_RESOLVER);
		}
		expect(await readFile(join(root, "jest.config.js"), "utf-8")).toBe("module.exports = makeConfig();\n");
	});
});
