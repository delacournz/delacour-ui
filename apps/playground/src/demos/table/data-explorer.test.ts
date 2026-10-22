import { describe, expect, test } from "bun:test";
import {
	beginDataExplorerRequest,
	completeDataExplorerBulkAction,
	createDataExplorerQuery,
	DATA_EXPLORER_FIXTURE,
	filterAndPageDataExplorer,
	resolveDataExplorerRequestFailure,
	resolveDataExplorerRequestSuccess,
	selectDataExplorerPage,
	toggleDataExplorerSort,
	updateDataExplorerQuery,
} from "./data-explorer.model";

describe("data explorer fixture and query", () => {
	test("builds ten thousand records with unique stable IDs", () => {
		expect(DATA_EXPLORER_FIXTURE).toHaveLength(10_000);
		expect(new Set(DATA_EXPLORER_FIXTURE.map((record) => record.id)).size).toBe(10_000);
		expect(DATA_EXPLORER_FIXTURE[0]?.id).toBe("INV-00001");
	});

	test("filters by query and status, then returns one page", () => {
		const result = filterAndPageDataExplorer(DATA_EXPLORER_FIXTURE, {
			...createDataExplorerQuery(),
			page: 2,
			pageSize: 10,
			search: "Aroha",
			status: "overdue",
		});

		expect(result.total).toBeGreaterThan(10);
		expect(result.rows).toHaveLength(10);
		expect(result.rows.every((record) => record.status === "overdue" && record.customer.includes("Aroha"))).toBe(true);
	});

	test("sorts equal values by stable record ID", () => {
		const rows = [
			{ id: "INV-00003", invoice: "INV-00003", customer: "Aroha", status: "open" as const, amount: 10 },
			{ id: "INV-00001", invoice: "INV-00001", customer: "Aroha", status: "paid" as const, amount: 10 },
			{ id: "INV-00002", invoice: "INV-00002", customer: "Aroha", status: "overdue" as const, amount: 10 },
		];
		const result = filterAndPageDataExplorer(rows, {
			...createDataExplorerQuery(),
			sort: { direction: "asc", key: "customer" },
		});

		expect(result.rows.map((record) => record.id)).toEqual(["INV-00001", "INV-00002", "INV-00003"]);
	});

	test("resets to page one for a new query and clamps after the result count shrinks", () => {
		const query = createDataExplorerQuery({ page: 8 });
		expect(updateDataExplorerQuery(query, { search: "new query" }).page).toBe(1);
		expect(filterAndPageDataExplorer(DATA_EXPLORER_FIXTURE.slice(0, 12), { ...query, pageSize: 5 }).page).toBe(3);
	});

	test("selects only the current page and preserves IDs from other pages", () => {
		expect(selectDataExplorerPage(["INV-00001", "INV-00008"], ["INV-00002", "INV-00003"], true)).toEqual([
			"INV-00001",
			"INV-00008",
			"INV-00002",
			"INV-00003",
		]);
		expect(selectDataExplorerPage(["INV-00001", "INV-00008", "INV-00002"], ["INV-00002", "INV-00003"], false)).toEqual([
			"INV-00001",
			"INV-00008",
		]);
	});

	test("toggles sort direction for the same key and starts a new key ascending", () => {
		const sorted = toggleDataExplorerSort({ key: "customer", direction: "asc" }, "customer");
		expect(sorted).toEqual({ key: "customer", direction: "desc" });
		expect(toggleDataExplorerSort(sorted, "amount")).toEqual({ key: "amount", direction: "asc" });
	});
});

describe("latest data explorer request wins", () => {
	const initial = {
		latestRequestId: 0,
		rows: DATA_EXPLORER_FIXTURE.slice(0, 2),
		total: 2,
		isLoading: false,
		isStale: false,
		error: undefined,
	};

	test("ignores A when it succeeds while newer request B is still loading", () => {
		const requestA = beginDataExplorerRequest(initial, 1);
		const requestB = beginDataExplorerRequest(requestA, 2);
		const resultA = resolveDataExplorerRequestSuccess(requestB, 1, { rows: [], total: 0 });

		expect(resultA).toBe(requestB);
		expect(resultA.isLoading).toBe(true);
		expect(resultA.rows).toBe(initial.rows);
	});

	test("ignores A when B succeeds first, including a later A failure", () => {
		const requestA = beginDataExplorerRequest(initial, 1);
		const requestB = beginDataExplorerRequest(requestA, 2);
		const resultB = resolveDataExplorerRequestSuccess(requestB, 2, { rows: [], total: 0 });
		const lateSuccessA = resolveDataExplorerRequestSuccess(resultB, 1, { rows: initial.rows, total: 2 });
		const lateFailureA = resolveDataExplorerRequestFailure(lateSuccessA, 1, "old request failed");

		expect(lateSuccessA).toBe(resultB);
		expect(lateFailureA).toBe(resultB);
		expect(lateFailureA.error).toBeUndefined();
	});

	test("ignores A's failure while B is loading and after B fails", () => {
		const requestA = beginDataExplorerRequest(initial, 1);
		const requestB = beginDataExplorerRequest(requestA, 2);
		const whileBLoads = resolveDataExplorerRequestFailure(requestB, 1, "old request failed");
		const resultB = resolveDataExplorerRequestFailure(whileBLoads, 2, "current request failed");
		const lateFailureA = resolveDataExplorerRequestFailure(resultB, 1, "old request failed again");

		expect(whileBLoads).toBe(requestB);
		expect(whileBLoads.isLoading).toBe(true);
		expect(resultB.error).toBe("current request failed");
		expect(lateFailureA).toBe(resultB);
	});
});

describe("bulk archive", () => {
	test("keeps records and selection after failure, then clears both after success", () => {
		const records = DATA_EXPLORER_FIXTURE.slice(0, 3);
		const selected = records.slice(0, 2).map((record) => record.id);
		const failed = completeDataExplorerBulkAction(records, selected, [selected[0] ?? ""], false);

		expect(failed.records).toBe(records);
		expect(failed.selected).toEqual(selected);
		expect(failed.error).toBe("Archive failed. Retry the action.");

		const retried = completeDataExplorerBulkAction(records, selected, [selected[0] ?? ""], true);
		expect(retried.records.map((record) => record.id)).not.toContain(selected[0]);
		expect(retried.selected).toEqual([]);
		expect(retried.error).toBeUndefined();
	});
});
