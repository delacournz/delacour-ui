import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { ScrollHeader } from "./scroll-header";
import { useScrollHeader } from "./scroll-header.context";

const LAYOUT = { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 100 } } };

function scrollEvent(y: number) {
	return {
		nativeEvent: {
			contentOffset: { x: 0, y },
			contentSize: { width: 390, height: 2000 },
			layoutMeasurement: { width: 390, height: 800 },
		},
	};
}

function Header({ onCollapsedChange }: { onCollapsedChange?: (isCollapsed: boolean) => void }) {
	return (
		<ScrollHeader onCollapsedChange={onCollapsedChange}>
			<ScrollHeader.Bar>
				<ScrollHeader.BarTitle>Library</ScrollHeader.BarTitle>
			</ScrollHeader.Bar>
			<ScrollHeader.Large testID="large">
				<Text>Library</Text>
			</ScrollHeader.Large>
			<ScrollHeader.ScrollView testID="scroller">
				<Text>Row</Text>
			</ScrollHeader.ScrollView>
		</ScrollHeader>
	);
}

async function collapse() {
	await fireEvent(screen.getByTestId("large"), "layout", LAYOUT);
	await fireEvent.scroll(screen.getByTestId("scroller"), scrollEvent(100));
}

describe("ScrollHeader", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("renders the bar title as a header, the scroller content and the large block", async () => {
		await renderWithProviders(<Header />);
		expect(screen.getByText("Row")).toBeOnTheScreen();
		expect(screen.getByTestId("large")).toBeOnTheScreen();
		expect(screen.getByRole("header", { name: "Library", hidden: true })).toBeOnTheScreen();
	});

	test("open: the bar title is hidden from assistive technology so the title is announced once", async () => {
		await renderWithProviders(<Header />);
		expect(screen.queryByRole("header", { name: "Library" })).not.toBeOnTheScreen();
		expect(screen.getByTestId("large")).toBeVisible();
		expect(screen.getAllByText("Library", { includeHiddenElements: false })).toHaveLength(1);
	});

	test("collapsed: the bar title is announced and the large block is hidden", async () => {
		const onCollapsedChange = jest.fn();
		await renderWithProviders(<Header onCollapsedChange={onCollapsedChange} />);
		await collapse();

		await waitFor(() => expect(onCollapsedChange).toHaveBeenCalledWith(true));
		expect(screen.getByRole("header", { name: "Library" })).toBeOnTheScreen();
		expect(screen.getAllByText("Library", { includeHiddenElements: false })).toHaveLength(1);
	});

	test("onCollapsedChange fires once per crossing", async () => {
		const onCollapsedChange = jest.fn();
		await renderWithProviders(<Header onCollapsedChange={onCollapsedChange} />);
		await collapse();
		await waitFor(() => expect(onCollapsedChange).toHaveBeenCalledTimes(1));

		await fireEvent.scroll(screen.getByTestId("scroller"), scrollEvent(150));
		expect(onCollapsedChange).toHaveBeenCalledTimes(1);

		await fireEvent.scroll(screen.getByTestId("scroller"), scrollEvent(0));
		await waitFor(() => expect(onCollapsedChange).toHaveBeenLastCalledWith(false));
		expect(onCollapsedChange).toHaveBeenCalledTimes(2);
	});

	test("without a large block the bar title is always announced", async () => {
		await renderWithProviders(
			<ScrollHeader>
				<ScrollHeader.Bar>
					<ScrollHeader.BarTitle>Settings</ScrollHeader.BarTitle>
				</ScrollHeader.Bar>
				<ScrollHeader.ScrollView>
					<Text>Row</Text>
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		);
		expect(screen.getByRole("header", { name: "Settings" })).toBeOnTheScreen();
	});

	test("the large block takes no touches", async () => {
		await renderWithProviders(<Header />);
		expect(screen.getByTestId("large").props.pointerEvents).toBe("none");
	});

	test("the caller's plain onScroll still receives the scroll event", async () => {
		const onScroll = jest.fn();
		await renderWithProviders(
			<ScrollHeader>
				<ScrollHeader.ScrollView onScroll={onScroll} testID="scroller">
					<Text>Row</Text>
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		);
		await fireEvent.scroll(screen.getByTestId("scroller"), scrollEvent(40));
		await waitFor(() => expect(onScroll).toHaveBeenCalled());
	});

	test("FlatList renders its rows and the caller's header after the inset", async () => {
		await renderWithProviders(
			<ScrollHeader>
				<ScrollHeader.Bar>
					<ScrollHeader.BarTitle>Inbox</ScrollHeader.BarTitle>
				</ScrollHeader.Bar>
				<ScrollHeader.FlatList
					data={["a", "b"]}
					keyExtractor={(item) => item}
					ListHeaderComponent={<Text>Caller header</Text>}
					renderItem={({ item }) => <Text>{`Item ${item}`}</Text>}
				/>
			</ScrollHeader>
		);
		expect(screen.getByText("Caller header")).toBeOnTheScreen();
		expect(screen.getByText("Item a")).toBeOnTheScreen();
		expect(screen.getByText("Item b")).toBeOnTheScreen();
	});

	test("useScrollHeader inside a header returns the source and scroll props", async () => {
		function Probe() {
			const { progress, scrollProps } = useScrollHeader();
			return <Text>{`${typeof progress.value}:${typeof scrollProps.onScroll}`}</Text>;
		}
		await renderWithProviders(
			<ScrollHeader>
				<Probe />
			</ScrollHeader>
		);
		expect(screen.getByText("number:object")).toBeOnTheScreen();
	});

	test.each([
		["Bar", <ScrollHeader.Bar key="p" />],
		["BarTitle", <ScrollHeader.BarTitle key="p">T</ScrollHeader.BarTitle>],
		["Large", <ScrollHeader.Large key="p" />],
		["Inset", <ScrollHeader.Inset key="p" />],
		["ScrollView", <ScrollHeader.ScrollView key="p" />],
	])("ScrollHeader.%s outside a ScrollHeader throws", async (_name, element) => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(element)).rejects.toThrow(/must be rendered inside a <ScrollHeader>/);
		spy.mockRestore();
	});

	test("useScrollHeader outside a ScrollHeader throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		function Probe() {
			useScrollHeader();
			return null;
		}
		await expect(renderWithProviders(<Probe />)).rejects.toThrow(/useScrollHeader/);
		spy.mockRestore();
	});
});
