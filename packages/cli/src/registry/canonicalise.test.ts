import { describe, expect, test } from "bun:test";
import { canonicaliseFile, canonicaliseMarkdown } from "./canonicalise";
import { scanImports } from "./scan-imports";

const SOURCE_PATHS = [
	"components/button/index.ts",
	"components/button/button.tsx",
	"components/button/button.types.ts",
	"components/button/button.variants.ts",
	"components/icon/index.ts",
	"components/icon/icon.variants.ts",
	"components/pressable/index.ts",
	"components/spinner/index.ts",
	"components/spinner/spinner.variants.ts",
	"hooks/use-theme-color.ts",
	"icons/central.ts",
	"lib/cn.ts",
	"lib/color.ts",
	"lib/merge-props.ts",
	"styles/tokens.ts",
];

const PACKAGE_SUBPATHS = new Map([
	["@delacour/native-ui/button", "components/button/index.ts"],
	["@delacour/native-ui/icons/central", "icons/central.ts"],
]);

function run(path: string, content: string) {
	return canonicaliseFile({ path, content, sourcePaths: SOURCE_PATHS, packageSubpaths: PACKAGE_SUBPATHS });
}

describe("scanImports", () => {
	test("sees type-only imports and re-exports, which a transpiler-based scan drops", () => {
		const content = [
			'import type { Ref } from "react";',
			'export type { ButtonSlotProps } from "./button.types";',
			'export * from "@central-icons-react-native/set";',
			'import { ICON_SIZES, type IconSize } from "../icon/icon.variants";',
		].join("\n");

		expect(scanImports(content).map((entry) => entry.specifier)).toEqual([
			"react",
			"./button.types",
			"@central-icons-react-native/set",
			"../icon/icon.variants",
		]);
	});

	test("ignores a specifier-shaped string in a comment or a literal", () => {
		const content = ['// see: from "not-a-real-import"', "const label = 'from \"also-not\"';"].join("\n");
		expect(scanImports(content)).toEqual([]);
	});

	test("reports the span of the specifier itself, quotes excluded", () => {
		const content = 'import { cn } from "../../lib/cn";';
		const [entry] = scanImports(content);
		expect(content.slice(entry?.start, entry?.end)).toBe("../../lib/cn");
	});
});

describe("canonicaliseFile", () => {
	test("leaves an import that lands in the same directory alone", () => {
		const content = 'import { buttonVariants } from "./button.variants";';
		const result = run("components/button/button.tsx", content);

		expect(result.content).toBe(content);
		expect(result.registryDependencies).toEqual([]);
	});

	test("rewrites a sibling component to a placeholder and records the dependency", () => {
		const result = run("components/button/button.tsx", 'import { Icon } from "../icon";');

		expect(result.content).toBe('import { Icon } from "@registry/ui/icon";');
		expect(result.registryDependencies).toEqual(["icon"]);
	});

	test("keeps the subpath when reaching a leaf inside another component folder", () => {
		const result = run("components/spinner/spinner.variants.ts", 'import { ICON_SIZES } from "../icon/icon.variants";');

		expect(result.content).toBe('import { ICON_SIZES } from "@registry/ui/icon/icon.variants";');
		expect(result.registryDependencies).toEqual(["icon"]);
	});

	test("rewrites across namespaces", () => {
		const result = run(
			"components/button/button.tsx",
			['import { cn } from "../../lib/cn";', 'import { TW_MERGE_CONFIG } from "../../styles/tokens";'].join("\n")
		);

		expect(result.content).toContain('"@registry/lib/cn"');
		expect(result.content).toContain('"@registry/styles/tokens"');
		expect(result.registryDependencies).toEqual(["cn", "styles"]);
	});

	test("leaves a flat sibling in lib relative, because both land in the same directory", () => {
		const result = run("lib/merge-props.ts", 'import { cn } from "./cn";');

		expect(result.content).toBe('import { cn } from "./cn";');
		expect(result.registryDependencies).toEqual(["cn"]);
	});

	test("routes the Central Icons re-export through its own namespace", () => {
		const result = run("components/list-group/list-group-item-suffix.tsx", 'import { X } from "../../icons/central";');

		expect(result.content).toBe('import { X } from "@registry/icons/central";');
		expect(result.registryDependencies).toEqual(["icons"]);
	});

	test("collects bare specifiers and leaves them untouched", () => {
		const result = run(
			"components/button/button.tsx",
			['import { useMemo } from "react";', 'import Animated from "react-native-reanimated";'].join("\n")
		);

		expect(result.content).toContain('from "react"');
		expect(result.bareImports).toEqual(["react", "react-native-reanimated"]);
		expect(result.registryDependencies).toEqual([]);
	});

	test("rewrites a package subpath named in a doc comment, so copied source cites the copy", () => {
		const result = run("components/icon/icon.tsx", "/** From `@delacour/native-ui/icons/central`. */");

		expect(result.content).toBe("/** From `@registry/icons/central`. */");
	});

	test("does not name itself as a dependency", () => {
		const result = run("components/button/button.tsx", 'import type { ButtonSlotProps } from "./button.types";');

		expect(result.registryDependencies).toEqual([]);
	});

	test("throws on a relative import that resolves to nothing, rather than shipping it broken", () => {
		expect(() => run("lib/cn.ts", 'import { x } from "./gone";')).toThrow(/gone/);
	});

	test("rewrites every specifier when a file holds several", () => {
		const content = [
			'import { Icon } from "../icon";',
			'import { Pressable } from "../pressable";',
			'import { Spinner } from "../spinner";',
			'import { cn } from "../../lib/cn";',
		].join("\n");

		expect(run("components/button/button.tsx", content).content).toBe(
			[
				'import { Icon } from "@registry/ui/icon";',
				'import { Pressable } from "@registry/ui/pressable";',
				'import { Spinner } from "@registry/ui/spinner";',
				'import { cn } from "@registry/lib/cn";',
			].join("\n")
		);
	});
});

describe("canonicaliseMarkdown", () => {
	test("rewrites the package subpaths a component's doc cites", () => {
		const doc = [
			"# Button",
			"",
			'`import { Button } from "@delacour/native-ui/button";`',
			"",
			"| `index.ts` | → `@delacour/native-ui/button` |",
		].join("\n");

		const result = canonicaliseMarkdown(doc, PACKAGE_SUBPATHS);

		expect(result.content).toContain('`import { Button } from "@registry/ui/button";`');
		expect(result.content).toContain("→ `@registry/ui/button`");
		expect(result.content).not.toContain("@delacour/native-ui");
		expect(result.rewrites).toEqual([{ from: "@delacour/native-ui/button", to: "@registry/ui/button" }]);
	});

	test("leaves prose that names no subpath alone", () => {
		const doc = "# Button\n\nA pressable action. Run `bun test` to check the variants.";
		const result = canonicaliseMarkdown(doc, PACKAGE_SUBPATHS);

		expect(result.content).toBe(doc);
		expect(result.rewrites).toEqual([]);
	});

	test("prefers the longest subpath, so a nested one is not half-matched", () => {
		const doc = "See `@delacour/native-ui/icons/central`.";
		expect(canonicaliseMarkdown(doc, PACKAGE_SUBPATHS).content).toBe("See `@registry/icons/central`.");
	});
});
