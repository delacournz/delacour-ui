import { expect, test } from "bun:test";
import { join } from "node:path";
import { readDemoSource } from "./demo-source";

test("the data explorer source contains its pure model without a local import", async () => {
	const { code } = await readDemoSource(join(import.meta.dirname, "../../src/demos/table/data-explorer.tsx"));
	expect(code).not.toContain('from "./data-explorer.model"');
	expect(code).toContain("export function filterAndPageDataExplorer(");
	expect(code).toContain("export const REQUEST_DELAY_MS = 260;");
	expect(code).toContain("export function Demo()");
	expect(code).not.toContain("export const meta");
});
