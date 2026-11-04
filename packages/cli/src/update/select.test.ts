import { describe, expect, test } from "bun:test";
import type { Decision } from "./decide";
import type { UpdateFile } from "./plan";
import { componentChanges, describeChange, onlySelected } from "./select";

const file = (item: string, path: string, texts: Partial<Pick<UpdateFile, "local" | "base" | "next">>): UpdateFile =>
	({
		item,
		key: `ui/${path}`,
		path: `/app/src/components/ui/${path}`,
		displayPath: `src/components/ui/${path}`,
		local: texts.local ?? null,
		next: texts.next ?? null,
		base: texts.base ?? null,
		entry: undefined,
		result: { state: "current" },
	}) as UpdateFile;

const decided = (f: UpdateFile, decision: Decision) => ({ file: f, decision });

const ICON_TSX = file("icon", "icon/icon.tsx", { local: "a\nb\n", base: "a\nb\n", next: "a\nB\nc\n" });
const ICON_TYPES = file("icon", "icon/icon.types.ts", { next: "x\ny\n" });
const ICON_VARIANTS = file("icon", "icon/icon.variants.ts", { local: "mine\n", base: "old\n", next: "new\n" });
const BUTTON = file("button", "button/button.tsx", { local: "b\n", base: "b\n", next: "b\n" });
const SPINNER = file("spinner", "spinner/spinner.tsx", { next: "s\n" });

const PLAN = [
	decided(ICON_TSX, { action: "updated", write: "a\nB\nc\n", record: true }),
	decided(ICON_TYPES, { action: "added", write: "x\ny\n", record: true }),
	decided(ICON_VARIANTS, { action: "merged", write: "merged\n", record: true }),
	decided(BUTTON, { action: "current" }),
	decided(SPINNER, { action: "added", write: "s\n", record: true }),
];

const ITEMS = [
	{ name: "icon", registryDependencies: [] },
	{ name: "button", registryDependencies: ["icon", "spinner"] },
	{ name: "spinner", registryDependencies: [] },
];

describe("componentChanges", () => {
	const changes = componentChanges(PLAN, ITEMS, new Set(["icon", "button"]));

	test("lists only components with something to write, in plan order", () => {
		expect(changes.map((change) => change.item)).toEqual(["icon", "spinner"]);
	});

	test("names each file, what happens to it and how many lines the registry moved", () => {
		expect(changes[0]?.files).toEqual([
			{ path: "src/components/ui/icon/icon.tsx", action: "updated", added: 2, removed: 1 },
			{ path: "src/components/ui/icon/icon.types.ts", action: "added", added: 2, removed: 0 },
			{ path: "src/components/ui/icon/icon.variants.ts", action: "merged", added: 1, removed: 1 },
		]);
	});

	test("marks a component the project edited", () => {
		expect(changes[0]?.edited).toBe(true);
		expect(changes[1]?.edited).toBe(false);
	});

	test("marks a component new to the project, and which components need it", () => {
		expect(changes[1]).toMatchObject({ isNew: true, neededBy: ["button"] });
		expect(changes[0]?.isNew).toBe(false);
	});
});

describe("describeChange", () => {
	test("summarises the files, and says when edits are merged", () => {
		const [icon] = componentChanges(PLAN, ITEMS, new Set(["icon"]));
		if (!icon) throw new Error("no icon");

		expect(describeChange(icon)).toBe("1 updated, 1 added, 1 merged with your edits · +5 −2");
	});

	test("says a new component is new, and what needs it", () => {
		const [, spinner] = componentChanges(PLAN, ITEMS, new Set(["icon"]));
		if (!spinner) throw new Error("no spinner");

		expect(describeChange(spinner)).toBe("new · 1 added · needed by button · +1 −0");
	});

	test("warns about a conflict", () => {
		const conflicting = componentChanges(
			[decided(ICON_VARIANTS, { action: "conflict", write: "<<<<<<<\n", record: true })],
			ITEMS,
			new Set(["icon"])
		);
		const [icon] = conflicting;
		if (!icon) throw new Error("no icon");

		expect(describeChange(icon)).toBe("1 conflict to resolve · +1 −1");
	});
});

describe("onlySelected", () => {
	test("leaves a component that was not chosen untouched, and says why", () => {
		const narrowed = onlySelected(PLAN, new Set(["spinner"]));

		expect(narrowed.map(({ decision }) => decision.action)).toEqual([
			"skipped",
			"skipped",
			"skipped",
			"current",
			"added",
		]);
		expect(narrowed[0]?.decision).toEqual({ action: "skipped", note: "not selected" });
	});

	test("never records a component that was not chosen, so the next update offers it again", () => {
		const narrowed = onlySelected(PLAN, new Set());

		expect(narrowed.some(({ decision }) => decision.record || decision.write !== undefined)).toBe(false);
	});
});
