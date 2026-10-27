import { describe, expect, test } from "bun:test";
import { chartRows, LIST_ROWS, OVERLAY_STEPS, overlayStep, PERFORMANCE_PROTOCOL } from "./protocol";

describe("performance workloads", () => {
	test("keeps ten thousand stable list IDs", () => {
		expect(LIST_ROWS).toHaveLength(10_000);
		expect(new Set(LIST_ROWS.map((row) => row.id)).size).toBe(10_000);
		expect(LIST_ROWS[0]).toMatchObject({ id: "row-1", index: 1 });
		expect(LIST_ROWS[9999]).toMatchObject({ id: "row-10000", index: 10_000 });
	});

	test("updates three series without changing their thousand x positions", () => {
		const first = chartRows(0);
		const next = chartRows(1);
		expect(first).toHaveLength(1000);
		expect(first).toEqual(chartRows(0));
		expect(first.map((row) => row.x)).toEqual(next.map((row) => row.x));
		for (const key of ["alpha", "beta", "gamma"] as const) {
			expect(first.every((row) => Number.isFinite(row[key]))).toBe(true);
			expect(first.map((row) => row[key])).not.toEqual(next.map((row) => row[key]));
		}
	});

	test("closes both overlays one hundred times and idles after every batch", () => {
		const steps = Array.from({ length: OVERLAY_STEPS }, (_, index) => overlayStep(index));
		for (const kind of ["dialog", "sheet"] as const) {
			expect(steps.filter((step) => step.kind === kind && !step.isOpen)).toHaveLength(100);
		}
		expect(steps.slice(0, 4).map(({ kind, isOpen }) => ({ kind, isOpen }))).toEqual([
			{ kind: "dialog", isOpen: true },
			{ kind: "dialog", isOpen: false },
			{ kind: "sheet", isOpen: true },
			{ kind: "sheet", isOpen: false },
		]);
		expect(steps.filter((step) => step.waitMs === PERFORMANCE_PROTOCOL.idleMs)).toHaveLength(10);
		expect(steps.at(-1)).toMatchObject({ cycle: 100, isOpen: false, waitMs: 5000 });
	});

	test("rejects steps outside the fixed overlay protocol", () => {
		for (const step of [-1, 0.5, OVERLAY_STEPS, Number.NaN]) {
			expect(() => overlayStep(step)).toThrow();
		}
	});
});
