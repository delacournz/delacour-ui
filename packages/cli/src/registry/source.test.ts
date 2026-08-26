import { describe, expect, test } from "bun:test";
import { DEFAULT_REGISTRY_URL, resolveRegistrySource } from "./source";

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
