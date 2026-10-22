import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Pagination } from "@delacour/react-native-ui/pagination";
import { SearchBar } from "@delacour/react-native-ui/search-bar";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import { Table } from "@delacour/react-native-ui/table";
import { Text } from "@delacour/react-native-ui/text";

import { type ReactElement, useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import type { DemoMeta } from "@/demos/types";
import {
	beginDataExplorerRequest,
	completeDataExplorerBulkAction,
	createDataExplorerQuery,
	createInitialDataExplorerRequestState,
	DATA_EXPLORER_FIXTURE,
	type DataExplorerQuery,
	type DataExplorerRecord,
	type DataExplorerSortKey,
	type DataExplorerStatus,
	filterAndPageDataExplorer,
	REQUEST_DELAY_MS,
	resolveDataExplorerRequestFailure,
	resolveDataExplorerRequestSuccess,
	selectDataExplorerPage,
	toggleDataExplorerSort,
	updateDataExplorerQuery,
} from "./data-explorer.model";

export const meta: DemoMeta = {
	title: "Data explorer",
	caption:
		"Search, filter, sort and page ten thousand invoices. Selection stays with record IDs while the visible rows change.",
	keyboardAware: true,
};

function formatAmount(amount: number): string {
	return `$${(amount / 100).toFixed(2)}`;
}

function statusLabel(status: DataExplorerStatus): string {
	return status === "open" ? "Open" : status === "paid" ? "Paid" : "Overdue";
}

export function Demo(): ReactElement {
	const [records, setRecords] = useState<readonly DataExplorerRecord[]>(DATA_EXPLORER_FIXTURE);
	const [query, setQuery] = useState(() => createDataExplorerQuery());
	const [searchText, setSearchText] = useState("");
	const [selected, setSelected] = useState<readonly string[]>([]);
	const [response, setResponse] = useState(() => createInitialDataExplorerRequestState());
	const [reloadToken, setReloadToken] = useState(0);
	const [bulkPending, setBulkPending] = useState(false);
	const [bulkError, setBulkError] = useState<string | undefined>();
	const requestId = useRef(0);
	const failNextRequest = useRef(false);
	const archiveAttempts = useRef(0);
	const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

	useEffect(() => {
		const id = ++requestId.current;
		const shouldFail = failNextRequest.current;
		failNextRequest.current = false;
		setResponse((current) => beginDataExplorerRequest(current, id));

		const timer = setTimeout(
			() => {
				timers.current.delete(timer);
				if (id !== requestId.current) return;
				if (shouldFail) {
					setResponse((current) =>
						resolveDataExplorerRequestFailure(current, id, "The request failed. Retry to load these invoices.")
					);
					return;
				}
				const page = filterAndPageDataExplorer(records, query);
				setResponse((current) => resolveDataExplorerRequestSuccess(current, id, page));
				if (page.page !== query.page) setQuery((current) => ({ ...current, page: page.page }));
			},
			REQUEST_DELAY_MS + (id % 2 === 0 ? 90 : 0)
		);
		timers.current.add(timer);
		return () => {
			clearTimeout(timer);
			timers.current.delete(timer);
		};
	}, [query, records, reloadToken]);

	useEffect(
		() => () => {
			for (const timer of timers.current) clearTimeout(timer);
		},
		[]
	);

	const updateQuery = (patch: Partial<DataExplorerQuery>) =>
		setQuery((current) => updateDataExplorerQuery(current, patch));
	const pageIds = response.rows.map((record) => record.id);
	const isPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
	const pageCount = Math.max(1, Math.ceil(response.total / query.pageSize));
	const sortFor = (key: DataExplorerSortKey) => ({
		direction: query.sort.key === key ? query.sort.direction : undefined,
		onPress: () => updateQuery({ sort: toggleDataExplorerSort(query.sort, key) }),
	});

	const handleArchive = (ids: string[]) => {
		if (bulkPending || ids.length === 0) return;
		setBulkPending(true);
		setBulkError(undefined);
		const shouldFail = archiveAttempts.current === 0;
		archiveAttempts.current += 1;
		const timer = setTimeout(() => {
			timers.current.delete(timer);
			const result = completeDataExplorerBulkAction(records, selected, ids, !shouldFail);
			setRecords(result.records);
			setSelected(result.selected);
			setBulkError(result.error);
			setBulkPending(false);
		}, 320);
		timers.current.add(timer);
	};

	const retryQuery = () => setReloadToken((current) => current + 1);
	const simulateQueryFailure = () => {
		failNextRequest.current = true;
		setReloadToken((current) => current + 1);
	};
	const resetSearch = () => {
		setSearchText("");
		updateQuery({ search: "", status: "all" });
	};
	const resetDemo = () => {
		for (const timer of timers.current) clearTimeout(timer);
		timers.current.clear();
		requestId.current += 1;
		setReloadToken((current) => current + 1);
		setRecords(DATA_EXPLORER_FIXTURE);
		setQuery(createDataExplorerQuery());
		setSearchText("");
		setSelected([]);
		setBulkPending(false);
		setBulkError(undefined);
		archiveAttempts.current = 0;
		failNextRequest.current = false;
	};
	const requestLabel = response.error
		? response.isStale
			? "The request failed. Previous results are stale."
			: response.error
		: response.isLoading
			? response.isStale
				? "Refreshing results. Previous results are stale."
				: "Loading invoices."
			: undefined;

	const renderEmpty = (): ReactElement => {
		if (requestLabel) {
			return (
				<EmptyState size="sm">
					<EmptyState.Header>
						<EmptyState.Title>{requestLabel}</EmptyState.Title>
					</EmptyState.Header>
					{response.error ? (
						<EmptyState.Content>
							<Button onPress={retryQuery} testID="data-explorer-retry-query" variant="outline">
								Retry
							</Button>
						</EmptyState.Content>
					) : null}
				</EmptyState>
			);
		}
		const hasFilters = query.search.trim() !== "" || query.status !== "all";
		return (
			<EmptyState size="sm">
				<EmptyState.Header>
					<EmptyState.Title>{records.length === 0 ? "No invoices remain" : "No matching invoices"}</EmptyState.Title>
					<EmptyState.Description>
						{records.length === 0 ? "The list is empty." : "Change the search or status filter."}
					</EmptyState.Description>
				</EmptyState.Header>
				{hasFilters ? (
					<EmptyState.Content>
						<Button onPress={resetSearch} testID="data-explorer-reset" variant="outline">
							Reset filters
						</Button>
					</EmptyState.Content>
				) : null}
			</EmptyState>
		);
	};

	return (
		<View className="h-[640px] w-full gap-3">
			<SearchBar
				debounce={300}
				isLoading={response.isLoading}
				onDebouncedChange={(search) => updateQuery({ search })}
				onValueChange={setSearchText}
				placeholder="Search invoices"
				testID="data-explorer-search"
				value={searchText}
			/>
			<View className="flex-row items-center gap-2">
				{(["all", "open", "paid", "overdue"] as const).map((status) => (
					<Button
						accessibilityState={{ selected: query.status === status }}
						key={status}
						onPress={() => updateQuery({ status })}
						size="sm"
						testID={`data-explorer-filter-${status}`}
						variant={query.status === status ? "secondary" : "ghost"}
					>
						{status === "all" ? "All" : statusLabel(status)}
					</Button>
				))}
			</View>
			<View className="flex-row flex-wrap items-center gap-2">
				<Button
					isDisabled={bulkPending || response.isLoading || response.isStale || pageIds.length === 0}
					onPress={() => setSelected((current) => selectDataExplorerPage(current, pageIds, !isPageSelected))}
					size="sm"
					testID="data-explorer-select-page"
					variant="outline"
				>
					{isPageSelected ? "Clear page" : "Select page"}
				</Button>
				<Button onPress={simulateQueryFailure} size="sm" testID="data-explorer-simulate-error" variant="ghost">
					Test request error
				</Button>
				<Button onPress={resetDemo} size="sm" testID="data-explorer-reset-demo" variant="ghost">
					Reset example
				</Button>
			</View>
			{requestLabel && response.rows.length > 0 ? (
				<View accessibilityLiveRegion="polite" className="rounded-md bg-muted px-3 py-2">
					<Text.Caption
						accessibilityLiveRegion="polite"
						accessibilityRole={response.error ? "alert" : undefined}
						color={response.error ? "destructive" : "muted"}
					>
						{requestLabel}
					</Text.Caption>
					{response.error ? (
						<Button onPress={retryQuery} size="sm" testID="data-explorer-retry-query" variant="ghost">
							Retry
						</Button>
					) : null}
				</View>
			) : null}
			{bulkError ? (
				<Text.Caption
					accessibilityLiveRegion="polite"
					accessibilityRole="alert"
					color="destructive"
					testID="data-explorer-bulk-error"
				>
					{bulkError}
				</Text.Caption>
			) : null}
			<SelectionMode
				className="min-h-0 flex-1"
				defaultActive
				onSelectedChange={bulkPending ? undefined : setSelected}
				selected={selected}
			>
				<SelectionMode.Header title="Invoices" />
				<Table
					className="flex-1"
					columns={[{ width: 112 }, { flex: 1 }, { width: 88 }, { width: 106, align: "end" }]}
					minWidth={500}
					striped
					variant="outline"
				>
					<Table.Header>
						<Table.Row>
							<Table.Head sort={sortFor("invoice")} testID="data-explorer-sort-invoice">
								Invoice
							</Table.Head>
							<Table.Head sort={sortFor("customer")} testID="data-explorer-sort-customer">
								Customer
							</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head sort={sortFor("amount")} testID="data-explorer-sort-amount">
								Amount
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<FlatList
						contentContainerStyle={{ paddingBottom: 88, flexGrow: 1 }}
						data={response.rows}
						keyExtractor={(record) => record.id}
						ListEmptyComponent={renderEmpty}
						renderItem={({ item, index }) => {
							const rowLabel = `${item.invoice}, ${item.customer}, ${statusLabel(item.status)}, ${formatAmount(item.amount)}`;
							return (
								<SelectionMode.Item
									accessibilityLabel={rowLabel}
									indicator="none"
									isDisabled={bulkPending || response.isStale}
									key={item.id}
									testID={`data-explorer-row-${item.id}`}
									value={item.id}
								>
									<Table.Row
										index={index}
										isDisabled={bulkPending || response.isStale}
										isLast={index === response.rows.length - 1}
										isSelected={selected.includes(item.id)}
									>
										<Table.Cell>{item.invoice}</Table.Cell>
										<Table.Cell>{item.customer}</Table.Cell>
										<Table.Cell>{statusLabel(item.status)}</Table.Cell>
										<Table.Cell>{formatAmount(item.amount)}</Table.Cell>
									</Table.Row>
								</SelectionMode.Item>
							);
						}}
						style={{ flex: 1 }}
						testID="data-explorer-list"
					/>
				</Table>
				<SelectionMode.Bar>
					<SelectionMode.Action isDisabled={bulkPending || response.isStale} onPress={handleArchive}>
						{bulkPending ? "Archiving" : bulkError ? "Retry archive" : "Archive"}
					</SelectionMode.Action>
				</SelectionMode.Bar>
			</SelectionMode>
			<Pagination
				count={pageCount}
				onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
				page={query.page}
				size="sm"
				testID="data-explorer-pagination"
				variant="compact"
			>
				<Pagination.Summary>
					<Pagination.Status pageSize={query.pageSize} total={response.total} />
				</Pagination.Summary>
			</Pagination>
		</View>
	);
}
