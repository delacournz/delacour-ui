import { describe, expect, test } from "bun:test";
import {
	COMPONENTS_WITHOUT_SCREENS,
	COMPONENTS as WEB_COMPONENTS,
	COMPONENT_GROUPS as WEB_GROUPS,
} from "../../web/src/lib/components";
import {
	COMPONENT_GROUPS,
	COMPONENT_INDEX,
	componentCount,
	componentGroup,
	groupedComponents,
	groupSummary,
} from "./components-index";

/**
 * The home screen's grouping is a copy of the documentation site's, and this is
 * what keeps the copy honest.
 *
 * The eight group names and the slug→group map could not move into
 * `@delacour/design-system` (it must stay app-free) or into `react-native-ui` (it
 * ships to consumers), so they are duplicated here and read back against
 * `apps/web/src/lib/components.ts` by relative path — the same cross-workspace
 * move `global.css` makes with its `@source`. A component added to one index
 * and not the other fails here by name.
 */
describe("the home screen index", () => {
	test("names the same groups as the docs, in the same order", () => {
		expect([...COMPONENT_GROUPS]).toEqual([...WEB_GROUPS]);
	});

	test("lists every component with a playground screen, and nothing else", () => {
		const docs: string[] = WEB_COMPONENTS.filter((entry) => !COMPONENTS_WITHOUT_SCREENS.has(entry.slug))
			.map((entry) => entry.slug)
			.sort();
		const here: string[] = COMPONENT_INDEX.map((entry) => entry.slug).sort();

		expect(here).toEqual(docs);
	});

	test("files each component under the docs' group", () => {
		for (const entry of COMPONENT_INDEX) {
			const docs = WEB_COMPONENTS.find((candidate) => candidate.slug === entry.slug);

			expect(docs?.group).toBe(entry.group);
		}
	});

	test("routes to the slug, so a docs link and a row open the same screen", () => {
		for (const entry of COMPONENT_INDEX) expect(entry.href).toBe(`/${entry.slug}`);
	});

	test("the count is derived, and is every row", () => {
		expect(componentCount()).toBe(COMPONENT_INDEX.length);
		expect(componentCount()).toBeGreaterThan(0);
	});

	test("groups keep the docs' reading order and drop empty groups", () => {
		const groups = groupedComponents();

		expect(groups.map((group) => group.name)).toEqual(
			COMPONENT_GROUPS.filter((name) => COMPONENT_INDEX.some((entry) => entry.group === name))
		);
		expect(groups.flatMap((group) => group.entries).length).toBe(COMPONENT_INDEX.length);
		for (const group of groups) expect(group.entries.length).toBeGreaterThan(0);
	});

	test("titles are alphabetical within a group", () => {
		for (const group of groupedComponents()) {
			const titles = group.entries.map((entry) => entry.title);

			expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
		}
	});

	test("each group has a kebab-case slug and routes under /components", () => {
		const groups = groupedComponents();

		expect(groups.map((group) => group.slug)).toContain("data-display");
		expect(new Set(groups.map((group) => group.slug)).size).toBe(groups.length);
		for (const group of groups) {
			expect(group.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
			expect(group.href).toBe(`/components/${group.slug}`);
		}
	});

	test("a group is found by its slug, and an unknown slug finds nothing", () => {
		for (const group of groupedComponents()) expect(componentGroup(group.slug)).toEqual(group);
		expect(componentGroup("nope")).toBeUndefined();
		expect(componentGroup(undefined)).toBeUndefined();
	});

	test("a group's summary names its first three components and counts the rest", () => {
		const titles = (count: number) => Array.from({ length: count }, (_, index) => ({ title: `C${index + 1}` }));

		expect(groupSummary(titles(1))).toBe("C1");
		expect(groupSummary(titles(3))).toBe("C1, C2, C3");
		expect(groupSummary(titles(4))).toBe("C1, C2, C3 and 1 more");
		expect(groupSummary(titles(11))).toBe("C1, C2, C3 and 8 more");
	});
});
