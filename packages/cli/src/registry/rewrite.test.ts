import { describe, expect, test } from "bun:test";
import { applyRewrites } from "./rewrite";

describe("applyRewrites", () => {
	test("replaces a relative specifier in an import", () => {
		const source = 'import { Icon } from "../icon";\n';

		expect(applyRewrites(source, [{ from: "../icon", to: "@registry/ui/icon" }])).toBe(
			'import { Icon } from "@registry/ui/icon";\n'
		);
	});

	test("replaces every occurrence, including a type-only import", () => {
		const source = ['import { Icon } from "../icon";', 'import type { IconProps } from "../icon";'].join("\n");

		expect(applyRewrites(source, [{ from: "../icon", to: "@registry/ui/icon" }])).toBe(
			['import { Icon } from "@registry/ui/icon";', 'import type { IconProps } from "@registry/ui/icon";'].join("\n")
		);
	});

	test("handles either quote and a backtick citation in a doc comment", () => {
		const source = ["/** See `../icon`. */", "import { Icon } from '../icon';"].join("\n");

		expect(applyRewrites(source, [{ from: "../icon", to: "@registry/ui/icon" }])).toBe(
			["/** See `@registry/ui/icon`. */", "import { Icon } from '@registry/ui/icon';"].join("\n")
		);
	});

	// The reason a relative specifier is anchored on its delimiter rather than
	// replaced everywhere: one is a prefix of the other.
	test("does not half-match a longer sibling", () => {
		const source = 'import { set } from "../icon-set";\n';

		expect(applyRewrites(source, [{ from: "../icon", to: "@registry/ui/icon" }])).toBe(source);
	});

	test("leaves a specifier no rewrite names alone", () => {
		const source = 'import { View } from "react-native";\nimport { cn } from "./cn";\n';

		expect(applyRewrites(source, [{ from: "../icon", to: "@registry/ui/icon" }])).toBe(source);
	});

	// A package subpath is cited in prose as well as imported, so it is replaced
	// everywhere rather than only inside a delimiter.
	test("replaces a package subpath in prose as well as in an import", () => {
		const source = [
			"# Button",
			"",
			"Import it from delacour-react-native-ui/button.",
			'export * from "delacour-react-native-ui/button";',
		].join("\n");

		expect(applyRewrites(source, [{ from: "delacour-react-native-ui/button", to: "@registry/ui/button" }])).toBe(
			["# Button", "", "Import it from @registry/ui/button.", 'export * from "@registry/ui/button";'].join("\n")
		);
	});

	test("prefers the longest subpath, so a nested one is not half-matched", () => {
		const source = "See delacour-react-native-ui/icons/central and delacour-react-native-ui/icons.";
		const rewrites = [
			{ from: "delacour-react-native-ui/icons", to: "@registry/icons/index" },
			{ from: "delacour-react-native-ui/icons/central", to: "@registry/icons/central" },
		];

		expect(applyRewrites(source, rewrites)).toBe("See @registry/icons/central and @registry/icons/index.");
	});

	test("is a no-op with no rewrites", () => {
		const source = 'import { cn } from "./cn";\n';

		expect(applyRewrites(source, [])).toBe(source);
	});

	// `from` is a literal, not a pattern — a specifier full of regex metacharacters
	// must not become one.
	test("treats a specifier with regex metacharacters literally", () => {
		const source = 'import x from "../a.b+c";\nimport y from "../aXbxc";\n';

		expect(applyRewrites(source, [{ from: "../a.b+c", to: "@registry/lib/abc" }])).toBe(
			'import x from "@registry/lib/abc";\nimport y from "../aXbxc";\n'
		);
	});
});
