import { describe, expect, test } from "bun:test";
import { classifySource, resolveModuleId } from "./classify";

describe("classifySource", () => {
	test("a component folder becomes one ui item named for the folder", () => {
		expect(classifySource("components/button/button.tsx")).toEqual({
			item: "button",
			type: "registry:ui",
			namespace: "ui",
			target: "button/button.tsx",
			moduleId: "button/button.tsx".replace(/\.tsx$/, ""),
		});
	});

	test("a component's index collapses to the folder name", () => {
		const result = classifySource("components/button/index.ts");
		expect(result?.moduleId).toBe("button");
		expect(result?.target).toBe("button/index.ts");
	});

	test("every file in a component folder belongs to that folder's item", () => {
		expect(classifySource("components/list-group/list-group.variants.ts")?.item).toBe("list-group");
		expect(classifySource("components/list-group/list-group-item-title.tsx")?.item).toBe("list-group");
	});

	test("each lib file is its own item, flat in the lib namespace", () => {
		expect(classifySource("lib/cn.ts")).toEqual({
			item: "cn",
			type: "registry:lib",
			namespace: "lib",
			target: "cn.ts",
			moduleId: "cn",
		});
		expect(classifySource("lib/slot.tsx")?.item).toBe("slot");
	});

	test("each hook is its own item", () => {
		expect(classifySource("hooks/use-theme-color.ts")).toEqual({
			item: "use-theme-color",
			type: "registry:hook",
			namespace: "hooks",
			target: "use-theme-color.ts",
			moduleId: "use-theme-color",
		});
	});

	test("the whole styles directory is one item, CSS included", () => {
		expect(classifySource("styles/tokens.ts")?.item).toBe("styles");
		expect(classifySource("styles/theme.css")).toEqual({
			item: "styles",
			type: "registry:style",
			namespace: "styles",
			target: "theme.css",
			moduleId: null,
		});
	});

	test("the uniwind type reference rides along with the styles item", () => {
		expect(classifySource("uniwind-env.d.ts")?.item).toBe("styles");
		expect(classifySource("uniwind-env.d.ts")?.namespace).toBe("styles");
	});

	test("the Central Icons re-export is its own item in its own namespace", () => {
		expect(classifySource("icons/central.ts")).toEqual({
			item: "icons",
			type: "registry:lib",
			namespace: "icons",
			target: "central.ts",
			moduleId: "central",
		});
	});

	test("the expo integration is one item, kept in its own folder under lib", () => {
		expect(classifySource("expo/navigation-theme.tsx")).toEqual({
			item: "expo",
			type: "registry:lib",
			namespace: "lib",
			target: "expo/navigation-theme.tsx",
			moduleId: "expo/navigation-theme",
		});
	});

	test("tests are excluded — they reach into internals a consumer will not have", () => {
		expect(classifySource("components/button/button.variants.test.ts")).toBeNull();
		expect(classifySource("lib/cn.test.ts")).toBeNull();
		expect(classifySource("styles/tokens.test.ts")).toBeNull();
	});

	test("anything outside the known directories is excluded rather than guessed at", () => {
		expect(classifySource("scratch.ts")).toBeNull();
		expect(classifySource("components/button")).toBeNull();
	});
});

describe("resolveModuleId", () => {
	const files = [
		"components/button/index.ts",
		"components/button/button.tsx",
		"components/icon/icon.variants.ts",
		"lib/cn.ts",
		"styles/tokens.ts",
	];

	test("resolves a relative import against the importing file", () => {
		expect(resolveModuleId("components/button/button.tsx", "../icon/icon.variants", files)).toBe(
			"components/icon/icon.variants.ts"
		);
		expect(resolveModuleId("components/button/button.tsx", "../../lib/cn", files)).toBe("lib/cn.ts");
	});

	test("prefers a folder's index when the specifier names the folder", () => {
		expect(resolveModuleId("components/spinner/spinner.tsx", "../button", files)).toBe("components/button/index.ts");
	});

	test("returns null for a specifier that resolves to nothing", () => {
		expect(resolveModuleId("lib/cn.ts", "./missing", files)).toBeNull();
	});
});
