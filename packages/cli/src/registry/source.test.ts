import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { DEFAULT_REGISTRY_URL, filePath, indexPath, itemPath, registryFilePath, resolveRegistrySource } from "./source";

const CWD = "/work/app";

describe("resolveRegistrySource", () => {
	test("defaults to this repository at the ref the CLI was published from", () => {
		expect(resolveRegistrySource({ cwd: CWD, ref: "v0.1.0" })).toEqual({
			kind: "remote",
			base: `${DEFAULT_REGISTRY_URL}/v0.1.0/registry`,
		});
	});

	test("takes the ref from the caller, so --ref main opts into unreleased components", () => {
		expect(resolveRegistrySource({ cwd: CWD, ref: "main" }).base).toContain("/main/registry");
	});

	test("expands the github: shorthand", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "github:acme/ui", ref: "v2" })).toEqual({
			kind: "remote",
			base: "https://raw.githubusercontent.com/acme/ui/v2/registry",
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
		});
	});

	test("trims a trailing slash so paths do not double up", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "https://ui.acme.com/r/" }).base).toBe("https://ui.acme.com/r");
	});

	test("reads a local directory, which is how the tests and the playground run offline", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "./registry" })).toEqual({
			kind: "local",
			base: "/work/app/registry",
		});
		expect(resolveRegistrySource({ cwd: CWD, url: "/abs/registry" })).toEqual({ kind: "local", base: "/abs/registry" });
	});

	test("accepts a file: URL", () => {
		expect(resolveRegistrySource({ cwd: CWD, url: "file:///abs/registry" })).toEqual({
			kind: "local",
			base: "/abs/registry",
		});
	});
});

describe("the registry layout", () => {
	const remote = resolveRegistrySource({ cwd: CWD, ref: "v0.1.0" });
	const local = resolveRegistrySource({ cwd: CWD, url: "./registry" });

	test("puts a file where it will land in a project", () => {
		expect(registryFilePath("ui", "button/button.tsx")).toBe("files/ui/button/button.tsx");
		expect(registryFilePath("lib", "cn.ts")).toBe("files/lib/cn.ts");
	});

	test("resolves every document against a remote base", () => {
		const base = `${DEFAULT_REGISTRY_URL}/v0.1.0/registry`;

		expect(indexPath(remote)).toBe(`${base}/registry.json`);
		expect(itemPath(remote, "button")).toBe(`${base}/r/button.json`);
		expect(filePath(remote, "files/ui/button/button.tsx")).toBe(`${base}/files/ui/button/button.tsx`);
	});

	// The same layout on disk is what lets the end-to-end tests point `--registry`
	// at the committed directory and exercise the real read path offline.
	test("resolves the same documents against a local base", () => {
		expect(itemPath(local, "button")).toBe("/work/app/registry/r/button.json");
		expect(filePath(local, "files/ui/button/button.tsx")).toBe(join("/work/app/registry/files/ui/button/button.tsx"));
	});

	test("a hosted registry keeps its own base", () => {
		const hosted = resolveRegistrySource({ cwd: CWD, url: "https://ui.acme.com/r" });

		expect(filePath(hosted, "files/ui/card/card.tsx")).toBe("https://ui.acme.com/r/files/ui/card/card.tsx");
	});
});
