import { describe, expect, test } from "bun:test";
import type { Namespace } from "./namespaces";
import { transformContent } from "./transform";

const DIRECTORIES: Record<Namespace, string> = {
	ui: "/app/src/components/ui",
	lib: "/app/src/lib",
	hooks: "/app/src/hooks",
	styles: "/app/src/styles",
	icons: "/app/src/lib/icons",
};

const ALIASES = {
	ui: "@/components/ui",
	lib: "@/lib",
	hooks: "@/hooks",
	styles: "@/styles",
	icons: "@/lib/icons",
};

function withAliases(content: string, fileDirectory = "/app/src/components/ui/button") {
	return transformContent(content, { fileDirectory, directories: DIRECTORIES, aliases: ALIASES });
}

function withoutAliases(content: string, fileDirectory = "/app/src/components/ui/button") {
	return transformContent(content, { fileDirectory, directories: DIRECTORIES, aliases: {} });
}

describe("transformContent", () => {
	test("substitutes the configured alias", () => {
		expect(withAliases('import { Icon } from "@registry/ui/icon";')).toBe(
			'import { Icon } from "@/components/ui/icon";'
		);
		expect(withAliases('import { cn } from "@registry/lib/cn";')).toBe('import { cn } from "@/lib/cn";');
	});

	test("keeps a subpath inside a component folder", () => {
		expect(withAliases('import { ICON_SIZES } from "@registry/ui/icon/icon.variants";')).toBe(
			'import { ICON_SIZES } from "@/components/ui/icon/icon.variants";'
		);
	});

	test("falls back to a relative path when the project has no alias for that namespace", () => {
		expect(withoutAliases('import { cn } from "@registry/lib/cn";')).toBe('import { cn } from "../../../lib/cn";');
		expect(withoutAliases('import { Icon } from "@registry/ui/icon";')).toBe('import { Icon } from "../icon";');
	});

	test("a relative path to a sibling in the same directory keeps its ./ prefix", () => {
		const content = 'import { cn } from "@registry/lib/cn";';
		expect(transformContent(content, { fileDirectory: "/app/src/lib", directories: DIRECTORIES, aliases: {} })).toBe(
			'import { cn } from "./cn";'
		);
	});

	test("mixes aliased and relative namespaces from one config", () => {
		const content = ['import { cn } from "@registry/lib/cn";', 'import { Icon } from "@registry/ui/icon";'].join("\n");
		const result = transformContent(content, {
			fileDirectory: "/app/src/components/ui/button",
			directories: DIRECTORIES,
			aliases: { ui: "@/components/ui" },
		});

		expect(result).toBe(
			['import { cn } from "../../../lib/cn";', 'import { Icon } from "@/components/ui/icon";'].join("\n")
		);
	});

	test("rewrites a placeholder cited in a doc comment", () => {
		expect(withAliases("/** An icon from `@registry/icons/central`. */")).toBe(
			"/** An icon from `@/lib/icons/central`. */"
		);
	});

	test("handles single-quoted specifiers", () => {
		expect(withAliases("import { cn } from '@registry/lib/cn';")).toBe("import { cn } from '@/lib/cn';");
	});

	test("leaves ordinary imports and prose alone", () => {
		const content = ['import { useMemo } from "react";', "// registry, but not a placeholder"].join("\n");
		expect(withAliases(content)).toBe(content);
	});

	test("trims a trailing slash off an alias rather than emitting a doubled one", () => {
		const result = transformContent('import { cn } from "@registry/lib/cn";', {
			fileDirectory: "/app/src/components/ui/button",
			directories: DIRECTORIES,
			aliases: { lib: "@/lib/" },
		});

		expect(result).toBe('import { cn } from "@/lib/cn";');
	});

	test("rewrites every placeholder in a file, not only the first", () => {
		const content = [
			'import { Icon } from "@registry/ui/icon";',
			'import { Spinner } from "@registry/ui/spinner";',
			'import { tv } from "@registry/lib/tv";',
		].join("\n");

		expect(withAliases(content)).toBe(
			[
				'import { Icon } from "@/components/ui/icon";',
				'import { Spinner } from "@/components/ui/spinner";',
				'import { tv } from "@/lib/tv";',
			].join("\n")
		);
	});

	test("leaves no placeholder behind", () => {
		const content = 'import { cn } from "@registry/lib/cn";\nimport { Icon } from "@registry/ui/icon";';
		expect(withAliases(content)).not.toContain("@registry/");
		expect(withoutAliases(content)).not.toContain("@registry/");
	});
});
