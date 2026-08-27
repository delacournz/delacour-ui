import { describe, expect, test } from "bun:test";
import type { Namespace } from "../registry/namespaces";
import { aliasesForDirectories, aliasFor, parsePathMappings } from "./aliases";

describe("parsePathMappings", () => {
	test("reads the alias every Expo template ships with", () => {
		expect(parsePathMappings({ "@/*": ["./src/*"] }, "/app")).toEqual([{ prefix: "@/", directory: "/app/src" }]);
	});

	test("resolves through baseUrl", () => {
		expect(parsePathMappings({ "~/*": ["lib/*"] }, "/app", "./packages/ui")).toEqual([
			{ prefix: "~/", directory: "/app/packages/ui/lib" },
		]);
	});

	test("skips an exact module pin, which names a file rather than a directory", () => {
		const paths = { "@/*": ["./src/*"], "react-native": ["../../node_modules/react-native"] };
		expect(parsePathMappings(paths, "/app")).toEqual([{ prefix: "@/", directory: "/app/src" }]);
	});

	test("tolerates a project with no paths at all", () => {
		expect(parsePathMappings(undefined, "/app")).toEqual([]);
	});
});

describe("aliasFor", () => {
	const mappings = [
		{ prefix: "@/", directory: "/app/src" },
		{ prefix: "@ui/", directory: "/app/src/components/ui" },
	];

	test("returns the most specific alias covering a directory", () => {
		expect(aliasFor("/app/src/components/ui", mappings)).toBe("@ui");
		expect(aliasFor("/app/src/lib", mappings)).toBe("@/lib");
	});

	test("returns null for a directory outside every mapping", () => {
		expect(aliasFor("/app/packages/ui/src", mappings)).toBeNull();
	});
});

describe("aliasesForDirectories", () => {
	const directories: Record<Namespace, string> = {
		ui: "/app/src/components/ui",
		lib: "/app/src/lib",
		hooks: "/app/src/hooks",
		styles: "/app/src/styles",
		icons: "/app/src/lib/icons",
	};

	test("derives every namespace from one wildcard alias", () => {
		expect(aliasesForDirectories(directories, [{ prefix: "@/", directory: "/app/src" }])).toEqual({
			ui: "@/components/ui",
			lib: "@/lib",
			hooks: "@/hooks",
			styles: "@/styles",
			icons: "@/lib/icons",
		});
	});

	test("returns nothing when the project has no aliases, so imports fall back to relative", () => {
		expect(aliasesForDirectories(directories, [])).toEqual({});
	});

	test("covers only the namespaces a partial alias reaches", () => {
		const mappings = [{ prefix: "@ui/", directory: "/app/src/components/ui" }];
		expect(aliasesForDirectories(directories, mappings)).toEqual({ ui: "@ui" });
	});
});
