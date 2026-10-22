export type DataExplorerStatus = "open" | "paid" | "overdue";
export type DataExplorerStatusFilter = "all" | DataExplorerStatus;
export type DataExplorerSortKey = "invoice" | "customer" | "amount";
export type DataExplorerSortDirection = "asc" | "desc";
export type DataExplorerSort = { key: DataExplorerSortKey; direction: DataExplorerSortDirection };

export type DataExplorerRecord = {
	id: string;
	invoice: string;
	customer: string;
	status: DataExplorerStatus;
	amount: number;
};

export type DataExplorerQuery = {
	search: string;
	status: DataExplorerStatusFilter;
	sort: DataExplorerSort;
	page: number;
	pageSize: number;
};

export type DataExplorerPage = {
	rows: readonly DataExplorerRecord[];
	total: number;
	page: number;
};

export type DataExplorerRequestState = {
	latestRequestId: number;
	rows: readonly DataExplorerRecord[];
	total: number;
	isLoading: boolean;
	isStale: boolean;
	error: string | undefined;
};

export type DataExplorerBulkResult = {
	records: readonly DataExplorerRecord[];
	selected: readonly string[];
	error: string | undefined;
};

const CUSTOMERS = ["Aroha Ngata", "Mere Tane", "Caleb Ward", "Lena Varga", "Rawiri Kemp"] as const;
const STATUSES: readonly DataExplorerStatus[] = ["open", "paid", "overdue"];
const PAGE_SIZE = 20;
export const REQUEST_DELAY_MS = 260;

export const DATA_EXPLORER_FIXTURE: readonly DataExplorerRecord[] = Array.from({ length: 10_000 }, (_, index) => {
	const id = `INV-${String(index + 1).padStart(5, "0")}`;
	return {
		id,
		invoice: id,
		customer: CUSTOMERS[index % CUSTOMERS.length] ?? CUSTOMERS[0],
		status: STATUSES[index % STATUSES.length] ?? "open",
		amount: 2_500 + ((index * 1_379) % 250_000),
	};
});

export function createDataExplorerQuery(overrides: Partial<DataExplorerQuery> = {}): DataExplorerQuery {
	return {
		search: "",
		status: "all",
		sort: { direction: "asc", key: "invoice" },
		page: 1,
		pageSize: PAGE_SIZE,
		...overrides,
	};
}

export function updateDataExplorerQuery(
	current: DataExplorerQuery,
	patch: Partial<DataExplorerQuery>
): DataExplorerQuery {
	const next = { ...current, ...patch };
	const hasChanged =
		next.search !== current.search ||
		next.status !== current.status ||
		next.sort.key !== current.sort.key ||
		next.sort.direction !== current.sort.direction ||
		next.page !== current.page ||
		next.pageSize !== current.pageSize;
	if (!hasChanged) return current;
	const queryChanged = next.search !== current.search || next.status !== current.status;
	const sortChanged = next.sort.key !== current.sort.key || next.sort.direction !== current.sort.direction;
	return queryChanged || sortChanged ? { ...next, page: 1 } : next;
}

export function toggleDataExplorerSort(current: DataExplorerSort, key: DataExplorerSortKey): DataExplorerSort {
	return {
		key,
		direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
	};
}

function compareText(left: string, right: string): number {
	const a = left.toLowerCase();
	const b = right.toLowerCase();
	return a < b ? -1 : a > b ? 1 : 0;
}

export function clampDataExplorerPage(page: number, total: number, pageSize: number): number {
	const count = Math.max(1, Math.ceil(total / pageSize));
	return Math.min(Math.max(1, page), count);
}

export function filterAndPageDataExplorer(
	records: readonly DataExplorerRecord[],
	query: DataExplorerQuery
): DataExplorerPage {
	const needle = query.search.trim().toLowerCase();
	const matches = records.filter((record) => {
		if (query.status !== "all" && record.status !== query.status) return false;
		return needle === "" || `${record.invoice} ${record.customer} ${record.status}`.toLowerCase().includes(needle);
	});
	const sorted = [...matches].sort((left, right) => {
		const compared =
			query.sort.key === "amount"
				? left.amount - right.amount
				: compareText(left[query.sort.key], right[query.sort.key]);
		if (compared !== 0) return query.sort.direction === "asc" ? compared : -compared;
		return compareText(left.id, right.id);
	});
	const page = clampDataExplorerPage(query.page, sorted.length, query.pageSize);
	const start = (page - 1) * query.pageSize;
	return { page, rows: sorted.slice(start, start + query.pageSize), total: sorted.length };
}

export function selectDataExplorerPage(
	selected: readonly string[],
	pageIds: readonly string[],
	shouldSelect: boolean
): string[] {
	if (!shouldSelect) {
		const page = new Set(pageIds);
		return selected.filter((id) => !page.has(id));
	}
	const result = [...selected];
	const picked = new Set(selected);
	for (const id of pageIds) {
		if (!picked.has(id)) {
			picked.add(id);
			result.push(id);
		}
	}
	return result;
}

export function createInitialDataExplorerRequestState(): DataExplorerRequestState {
	return { latestRequestId: 0, rows: [], total: 0, isLoading: true, isStale: false, error: undefined };
}

export function beginDataExplorerRequest(state: DataExplorerRequestState, requestId: number): DataExplorerRequestState {
	return {
		...state,
		latestRequestId: requestId,
		isLoading: true,
		isStale: state.rows.length > 0,
		error: undefined,
	};
}

export function resolveDataExplorerRequestSuccess(
	state: DataExplorerRequestState,
	requestId: number,
	page: DataExplorerPage
): DataExplorerRequestState {
	if (requestId !== state.latestRequestId) return state;
	return { ...state, rows: page.rows, total: page.total, isLoading: false, isStale: false, error: undefined };
}

export function resolveDataExplorerRequestFailure(
	state: DataExplorerRequestState,
	requestId: number,
	error: string
): DataExplorerRequestState {
	if (requestId !== state.latestRequestId) return state;
	return { ...state, isLoading: false, isStale: state.rows.length > 0, error };
}

export function completeDataExplorerBulkAction(
	records: readonly DataExplorerRecord[],
	selected: readonly string[],
	ids: readonly string[],
	succeeded: boolean
): DataExplorerBulkResult {
	if (!succeeded) return { records, selected, error: "Archive failed. Retry the action." };
	const removed = new Set(ids);
	return {
		records: records.filter((record) => !removed.has(record.id)),
		selected: [],
		error: undefined,
	};
}
