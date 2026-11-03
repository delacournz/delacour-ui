import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Pressable, Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Skeleton } from "./skeleton";

const HIDDEN = { includeHiddenElements: true } as const;

// Reanimated's `measure()` warns under Jest every time the shimmer's style runs; that is not what these tests are about.
beforeEach(() => {
	jest.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
	jest.restoreAllMocks();
});

describe("Skeleton", () => {
	test("an unlabelled skeleton is hidden from assistive technology", async () => {
		await renderWithProviders(<Skeleton animation="none" testID="sk" />);
		const root = screen.getByTestId("sk", HIDDEN);
		expect(root).toHaveProp("accessibilityElementsHidden", true);
		expect(root).toHaveProp("importantForAccessibility", "no-hide-descendants");
		expect(screen.queryByTestId("sk")).not.toBeOnTheScreen();
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
	});

	test("a label makes it one busy progressbar with that name", async () => {
		await renderWithProviders(<Skeleton animation="none" label="Loading profile" />);
		const bar = screen.getByRole("progressbar", { name: "Loading profile" });
		expect(bar).toBeOnTheScreen();
		expect(bar).toBeBusy();
	});

	test("once loaded it adds no accessibility props and the content speaks", async () => {
		await renderWithProviders(
			<Skeleton animation="none" isLoading={false} label="Loading profile" testID="sk">
				<Text>Ada Lovelace</Text>
			</Skeleton>
		);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		const root = screen.getByTestId("sk");
		expect(root).not.toHaveProp("accessibilityElementsHidden");
		expect(root).not.toHaveProp("accessibilityLabel");
		expect(screen.getByText("Ada Lovelace")).toBeOnTheScreen();
	});

	test("children stay mounted while loading but are hidden from a screen reader", async () => {
		await renderWithProviders(
			<Skeleton animation="none">
				<Text>Ada Lovelace</Text>
			</Skeleton>
		);
		expect(screen.getByText("Ada Lovelace", HIDDEN)).toBeOnTheScreen();
		expect(screen.queryByText("Ada Lovelace")).not.toBeOnTheScreen();
	});

	test("children are not unmounted when loading flips, and become visible", async () => {
		const { rerender } = await renderWithProviders(
			<Skeleton animation="none">
				<Text>Ada Lovelace</Text>
			</Skeleton>
		);
		expect(screen.queryByText("Ada Lovelace")).not.toBeOnTheScreen();
		await rerender(
			<Skeleton animation="none" isLoading={false}>
				<Text>Ada Lovelace</Text>
			</Skeleton>
		);
		expect(screen.getByText("Ada Lovelace")).toBeOnTheScreen();
	});

	test("children take no touches while loading and do once loaded", async () => {
		const { rerender } = await renderWithProviders(
			<Skeleton animation="none">
				<Pressable testID="inner">
					<Text>Open</Text>
				</Pressable>
			</Skeleton>
		);
		const wrapper = () => screen.getByTestId("inner", HIDDEN).parent;
		expect(wrapper()).toHaveProp("pointerEvents", "none");
		await rerender(
			<Skeleton animation="none" isLoading={false}>
				<Pressable testID="inner">
					<Text>Open</Text>
				</Pressable>
			</Skeleton>
		);
		expect(wrapper()).toHaveProp("pointerEvents", "auto");
	});

	test("forwards testID and other View props", async () => {
		await renderWithProviders(<Skeleton animation="none" nativeID="sk-id" testID="sk" />);
		expect(screen.getByTestId("sk", HIDDEN)).toHaveProp("nativeID", "sk-id");
	});

	test.each(["shimmer", "pulse", "none"] as const)(
		"animation=%s mounts without changing what is announced",
		async (animation) => {
			await renderWithProviders(<Skeleton animation={animation} label="Loading" />);
			expect(screen.getByRole("progressbar", { name: "Loading" })).toBeBusy();
		}
	);
});

describe("Skeleton.Group", () => {
	test("a labelled group is one busy progressbar", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="none" label="Loading inbox">
				<Skeleton animation="none" testID="a" />
				<Skeleton animation="none" testID="b" />
			</Skeleton.Group>
		);
		const bar = screen.getByRole("progressbar", { name: "Loading inbox" });
		expect(bar).toBeBusy();
	});

	test("an unlabelled group takes no role and does not hide real content beside the placeholders", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="none" testID="group">
				<Text>Inbox</Text>
				<Skeleton animation="none" testID="a" />
			</Skeleton.Group>
		);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		expect(screen.getByTestId("group")).not.toHaveProp("accessibilityElementsHidden");
		expect(screen.getByText("Inbox")).toBeOnTheScreen();
		expect(screen.queryByTestId("a")).not.toBeOnTheScreen();
	});

	test("isLoading on the group reveals every skeleton inside", async () => {
		const tree = (isLoading: boolean) => (
			<Skeleton.Group animation="none" isLoading={isLoading} label="Loading inbox">
				<Skeleton testID="a">
					<Text>First</Text>
				</Skeleton>
				<Skeleton testID="b">
					<Text>Second</Text>
				</Skeleton>
			</Skeleton.Group>
		);
		const { rerender } = await renderWithProviders(tree(true));
		expect(screen.queryByText("First")).not.toBeOnTheScreen();
		expect(screen.queryByText("Second")).not.toBeOnTheScreen();
		await rerender(tree(false));
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		expect(screen.getByText("First")).toBeOnTheScreen();
		expect(screen.getByText("Second")).toBeOnTheScreen();
	});

	test("a skeleton's own isLoading wins over the group's", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="none" isLoading>
				<Skeleton isLoading={false} label="Own" testID="own">
					<Text>Done</Text>
				</Skeleton>
				<Skeleton testID="inherited">
					<Text>Pending</Text>
				</Skeleton>
			</Skeleton.Group>
		);
		expect(screen.getByText("Done")).toBeOnTheScreen();
		expect(screen.queryByText("Pending")).not.toBeOnTheScreen();
		expect(screen.queryByRole("progressbar", { name: "Own" })).not.toBeOnTheScreen();
		expect(screen.getByText("Pending", HIDDEN)).toBeOnTheScreen();
	});

	test("a group with a running animation mounts its skeletons", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="pulse">
				<Skeleton label="One" />
			</Skeleton.Group>
		);
		expect(screen.getByRole("progressbar", { name: "One" })).toBeBusy();
	});
});

describe("Skeleton.Lines", () => {
	test("renders `lines` placeholder lines, hidden when unlabelled", async () => {
		await renderWithProviders(<Skeleton.Lines animation="none" lines={4} testID="lines" />);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		expect(screen.getByTestId("lines", { includeHiddenElements: true }).children).toHaveLength(4);
	});

	test("the label goes on the paragraph once, as one busy progressbar", async () => {
		await renderWithProviders(<Skeleton.Lines animation="none" label="Loading bio" lines={3} />);
		expect(screen.getAllByRole("progressbar")).toHaveLength(1);
		expect(screen.getByRole("progressbar", { name: "Loading bio" })).toBeBusy();
	});

	test("inside a group the paragraph still announces its own label once", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="none">
				<Skeleton.Lines animation="none" label="Loading bio" lines={2} />
			</Skeleton.Group>
		);
		expect(screen.getAllByRole("progressbar")).toHaveLength(1);
		expect(screen.getByRole("progressbar", { name: "Loading bio" })).toBeBusy();
	});

	test("once loaded it shows its children and no placeholder", async () => {
		await renderWithProviders(
			<Skeleton.Lines animation="none" isLoading={false} label="Loading bio" testID="lines">
				<Text>Real paragraph</Text>
			</Skeleton.Lines>
		);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		expect(screen.getByText("Real paragraph")).toBeOnTheScreen();
		expect(screen.getByTestId("lines")).toBeOnTheScreen();
	});

	test("follows an enclosing group's isLoading", async () => {
		await renderWithProviders(
			<Skeleton.Group animation="none" isLoading={false}>
				<Skeleton.Lines label="Loading bio">
					<Text>Real paragraph</Text>
				</Skeleton.Lines>
			</Skeleton.Group>
		);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		expect(screen.getByText("Real paragraph")).toBeOnTheScreen();
	});
});
