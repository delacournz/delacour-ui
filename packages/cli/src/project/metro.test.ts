import { describe, expect, test } from "bun:test";
import { patchMetroConfig } from "./metro";

const OPTIONS = {
	metroConfigPath: "/app/metro.config.js",
	cssPath: "/app/src/styles/global.css",
	typesPath: "/app/src/uniwind-types.d.ts",
};

describe("patchMetroConfig", () => {
	test("writes a config when the app has none", () => {
		const result = patchMetroConfig(null, OPTIONS);

		expect(result.status).toBe("created");
		expect(result).toHaveProperty("content", expect.stringContaining("withUniwindConfig(config,"));
		expect(result).toHaveProperty("content", expect.stringContaining('cssEntryFile: "./src/styles/global.css"'));
	});

	test("wraps the export of the standard Expo template", () => {
		const existing = `const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
`;
		const result = patchMetroConfig(existing, OPTIONS);

		expect(result.status).toBe("patched");
		if (result.status !== "patched") return;

		expect(result.content).toContain('const { withUniwindConfig } = require("uniwind/metro");');
		expect(result.content).toContain("module.exports = withUniwindConfig(config, {");
		expect(result.content).toContain("const config = getDefaultConfig(__dirname);");
	});

	test("wraps an inline export too", () => {
		const result = patchMetroConfig("module.exports = getDefaultConfig(__dirname);\n", OPTIONS);

		expect(result.status).toBe("patched");
		if (result.status !== "patched") return;
		expect(result.content).toContain("module.exports = withUniwindConfig(getDefaultConfig(__dirname), {");
	});

	test("wraps an ESM default export with an ESM import", () => {
		const existing = `import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(import.meta.dirname);

export default config;
`;
		const result = patchMetroConfig(existing, OPTIONS);

		expect(result.status).toBe("patched");
		if (result.status !== "patched") return;
		expect(result.content).toContain('import { withUniwindConfig } from "uniwind/metro";');
		expect(result.content).toContain("export default withUniwindConfig(config, {");
	});

	test("does nothing to a config that is already wired", () => {
		const existing = "module.exports = withUniwindConfig(config, {});\n";
		expect(patchMetroConfig(existing, OPTIONS).status).toBe("already-wired");
	});

	test("asks rather than guesses when the export is not a shape it can rewrite", () => {
		const result = patchMetroConfig("const config = getDefaultConfig(__dirname);\n", OPTIONS);

		expect(result.status).toBe("manual");
		if (result.status !== "manual") return;
		expect(result.snippet).toContain("withUniwindConfig");
		expect(result.snippet).toContain("outermost");
	});

	test("points at the configured entry, not a guessed one", () => {
		const result = patchMetroConfig(null, {
			metroConfigPath: "/repo/apps/mobile/metro.config.js",
			cssPath: "/repo/apps/mobile/src/app.css",
			typesPath: "/repo/apps/mobile/types/uniwind.d.ts",
		});

		expect(result).toHaveProperty("content", expect.stringContaining('cssEntryFile: "./src/app.css"'));
		expect(result).toHaveProperty("content", expect.stringContaining('dtsFile: "./types/uniwind.d.ts"'));
	});
});

describe("monorepo resolver wiring", () => {
	const MONOREPO = { ...OPTIONS, metroConfigPath: "/repo/apps/mobile/metro.config.js", workspaceRoot: "/repo" };

	test("is absent when the components live in the app", () => {
		const result = patchMetroConfig(null, OPTIONS);

		expect(result).toHaveProperty("content", expect.not.stringContaining("watchFolders"));
	});

	test("watches and resolves the workspace when they do not", () => {
		const result = patchMetroConfig(null, MONOREPO);
		if (result.status !== "created") throw new Error("expected created");

		expect(result.content).toContain('const workspaceRoot = path.resolve(__dirname, "../..");');
		expect(result.content).toContain("config.watchFolders = [workspaceRoot];");
		expect(result.content).toContain("config.resolver.nodeModulesPaths");
		expect(result.content).toContain("config.resolver.disableHierarchicalLookup = true;");
	});

	/** Two registrations of one native module break at runtime. */
	test("pins one copy of each native module", () => {
		const result = patchMetroConfig(null, MONOREPO);
		if (result.status !== "created") throw new Error("expected created");

		expect(result.content).toContain('"react-native": path.resolve(workspaceRoot, "node_modules/react-native")');
		expect(result.content).toContain("react-native-reanimated");
	});

	test("keeps withUniwindConfig outermost, after the resolver block", () => {
		const result = patchMetroConfig(null, MONOREPO);
		if (result.status !== "created") throw new Error("expected created");

		expect(result.content.indexOf("extraNodeModules")).toBeLessThan(
			result.content.indexOf("module.exports = withUniwindConfig")
		);
	});

	test("adds the block to an app that already has a Metro config", () => {
		const existing = `const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
`;
		const result = patchMetroConfig(existing, MONOREPO);
		if (result.status !== "patched") throw new Error("expected patched");

		expect(result.content).toContain("config.watchFolders = [workspaceRoot];");
		expect(result.content).toContain("module.exports = withUniwindConfig(config, {");
		expect(result.content.indexOf("watchFolders")).toBeLessThan(result.content.indexOf("withUniwindConfig(config"));
	});
});
