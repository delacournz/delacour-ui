import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { DEFAULT_REGISTRY_URL, filePath, indexPath, itemPath, resolveRegistrySource, sourceFilePath } from "./source";

const CWD = "/work/app";

describe("resolveRegistrySource", () => {
	test("defaults to this repository at the ref the CLI was published from", () => {
		expect(resolveRegistrySource({ cwd: CWD, ref: "v0.1.0" })).toEqual({
			kind: "remote",
			base: `${DEFAULT_REGISTRY_URL}/v0.1.0/registry`,
			root: `${DEFAULT_REGISTRY_URL}/v0.1.0`,
		});
	});

	test("takes the ref from the caller, so --ref main opts into unreleased components", () => {
		expect(resolveRegistrySource({ cwd: CWD, ref: "main" }).base).toContain("/main/registry");
	});

	test("expands the github: shorthand", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "github:acme/ui", ref: "v2" })).toEqual({
			kind: "remote",
			base: "https://raw.githubusercontent.com/acme/ui/v2/registry",
			root: "https://raw.githubusercontent.com/acme/ui/v2",
		});
	});

	test("a ref in the shorthand wins over the configured one", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "github:acme/ui#next", ref: "v2" }).base).toContain("/next/registry");
	});

	test("appends the ref to a bare raw.githubusercontent repository URL", () => {
		expect(
			resolveRegistrySource({ cwd: CWD, url: "https://raw.githubusercontent.com/acme/ui", ref: "main" }).base
		).toBe("https://raw.githubusercontent.com/acme/ui/main/registry");
	});

	test("uses any other URL exactly as given — a hosted registry owns its own layout", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "https://ui.acme.com/r", ref: "main" })).toEqual({
			kind: "remote",
			base: "https://ui.acme.com/r",
			root: "https://ui.acme.com",
		});
	});

	test("trims a trailing slash so paths do not double up", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "https://ui.acme.com/r/" }).base).toBe("https://ui.acme.com/r");
	});

	test("reads a local directory, which is how the tests and the playground run offline", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "./registry" })).toEqual({
			kind: "local",
			base: "/work/app/registry",
			root: "/work/app",
		});
		expect(resolveRegistrySource({ cwd: CWD, url: "/abs/registry" })).toEqual({
			kind: "local",
			base: "/abs/registry",
			root: "/abs",
		});
	});

	test("accepts a file: URL", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "file:///abs/registry" })).toEqual({
			kind: "local",
			base: "/abs/registry",
			root: "/abs",
		});
	});
});

describe("the registry layout", () => {
	const remote = resolveRegistrySource({ cwd: CWD, ref: "v0.1.0" });
	const local = resolveRegistrySource({ cwd: CWD, url: "./registry" });

	test("names a file where the library actually keeps it", () => {
		expect(sourceFilePath("packages/native-ui", "components/button/button.tsx")).toBe(
			"packages/native-ui/src/components/button/button.tsx"
		);
		expect(sourceFilePath("packages/native-ui", "lib/cn.ts")).toBe("packages/native-ui/src/lib/cn.ts");
	});

	// The index and the items live in `registry/`; a file lives wherever the
	// library keeps it, so it resolves against the ref rather than the registry.
	test("resolves every document against a remote source", () => {
		const base = `${DEFAULT_REGISTRY_URL}/v0.1.0/registry`;

		expect(indexPath(remote)).toBe(`${base}/registry.json`);
		expect(itemPath(remote, "button")).toBe(`${base}/r/button.json`);
		expect(filePath(remote, "packages/native-ui/src/components/button/button.tsx")).toBe(
			`${DEFAULT_REGISTRY_URL}/v0.1.0/packages/native-ui/src/components/button/button.tsx`
		);
	});

	// The same layout on disk is what lets the end-to-end tests point `--registry`
	// at the committed directory and exercise the real read path offline.
	test("resolves the same documents against a local source", () => {
		expect(itemPath(local, "button")).toBe("/work/app/registry/r/button.json");
		expect(filePath(local, "packages/native-ui/src/lib/cn.ts")).toBe(
			join("/work/app/packages/native-ui/src/lib/cn.ts")
		);
	});

	test("a hosted registry keeps its own base, and reads files from the directory above it", () => {
		const hosted = resolveRegistrySource({ cwd: CWD, url: "https://ui.acme.com/r" });

		expect(indexPath(hosted)).toBe("https://ui.acme.com/r/registry.json");
		expect(filePath(hosted, "src/card/card.tsx")).toBe("https://ui.acme.com/src/card/card.tsx");
	});
});
