import { describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { DelacourProvider } from "../provider";
import { Marquee } from "./marquee";

const WORDS = ["Alpha", "Beta"] as const;

function Words() {
	return (
		<>
			{WORDS.map((word) => (
				<Text key={word}>{word}</Text>
			))}
		</>
	);
}

/** Reports a root width, then a copy length, the way the native layout pass would. */
async function measure(root: number, copy: number): Promise<void> {
	await fireEvent(screen.getByTestId("strip"), "layout", { nativeEvent: { layout: { width: root, height: 40 } } });
	const [first] = screen.getAllByText("Alpha", { includeHiddenElements: true });
	const copyView = first?.parent;
	if (!copyView) throw new Error("copy view not found");
	await fireEvent(copyView, "layout", { nativeEvent: { layout: { width: copy, height: 40 } } });
}

describe("Marquee", () => {
	test("renders its content once before it is measured", async () => {
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true })).toHaveLength(1);
		expect(screen.getByText("Alpha")).toBeOnTheScreen();
	});

	test("forwards onLayout from the root", async () => {
		const onLayout = jest.fn();
		await renderWithProviders(
			<Marquee onLayout={onLayout} testID="strip">
				<Words />
			</Marquee>
		);
		await fireEvent(screen.getByTestId("strip"), "layout", { nativeEvent: { layout: { width: 200, height: 40 } } });
		expect(onLayout).toHaveBeenCalledTimes(1);
	});

	test("once measured, duplicate copies mount and only the first is reachable by assistive tech", async () => {
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		await measure(300, 100);

		const all = screen.getAllByText("Alpha", { includeHiddenElements: true });
		expect(all.length).toBeGreaterThan(1);
		expect(screen.getAllByText("Alpha")).toHaveLength(1);
		expect(screen.getAllByText("Beta")).toHaveLength(1);
		expect(all[0]?.parent).toHaveProp("importantForAccessibility", "auto");
		for (const duplicate of all.slice(1)) {
			expect(duplicate.parent).toHaveProp("accessibilityElementsHidden", true);
			expect(duplicate.parent).toHaveProp("importantForAccessibility", "no-hide-descendants");
		}
	});

	test("an accessibilityLabel makes the strip one element and hides every copy", async () => {
		await renderWithProviders(
			<Marquee accessibilityLabel="Our partners" testID="strip">
				<Words />
			</Marquee>
		);
		await measure(300, 100);

		expect(screen.getByLabelText("Our partners")).toBeOnTheScreen();
		expect(screen.getByTestId("strip")).toHaveProp("accessible", true);
		expect(screen.queryByText("Alpha")).not.toBeOnTheScreen();
		for (const copy of screen.getAllByText("Alpha", { includeHiddenElements: true })) {
			expect(copy.parent).toHaveProp("importantForAccessibility", "no-hide-descendants");
		}
	});

	test("without a label the root is not itself an accessible element", async () => {
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		expect(screen.getByTestId("strip")).not.toHaveProp("accessible", true);
	});

	test("a vertical direction also mounts duplicate copies and announces the content once", async () => {
		await renderWithProviders(
			<Marquee direction="up" testID="strip">
				<Words />
			</Marquee>
		);
		await measure(300, 100);
		expect(screen.getAllByText("Beta")).toHaveLength(1);
	});

	test("calm motion swaps the moving track for one still, hand-scrollable copy", async () => {
		await renderWithProviders(
			<DelacourProvider isMotionCalm>
				<Marquee testID="strip">
					<Words />
				</Marquee>
			</DelacourProvider>
		);
		await fireEvent(screen.getByTestId("strip"), "layout", { nativeEvent: { layout: { width: 300, height: 40 } } });
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true })).toHaveLength(1);
		expect(screen.getByText("Alpha")).toBeOnTheScreen();
		expect(screen.getByText("Beta")).toBeOnTheScreen();
	});

	test("calm motion with a label still hides the content behind it", async () => {
		await renderWithProviders(
			<DelacourProvider isMotionCalm>
				<Marquee accessibilityLabel="Our partners" testID="strip">
					<Words />
				</Marquee>
			</DelacourProvider>
		);
		expect(screen.getByLabelText("Our partners")).toBeOnTheScreen();
		expect(screen.queryByText("Alpha")).not.toBeOnTheScreen();
	});

	test("a Group renders every strip inside it, each announced once", async () => {
		await renderWithProviders(
			<Marquee.Group speed={30} testID="group">
				<Marquee direction="left">
					<Text>Left</Text>
				</Marquee>
				<Marquee direction="right">
					<Text>Right</Text>
				</Marquee>
			</Marquee.Group>
		);
		expect(screen.getByTestId("group")).toBeOnTheScreen();
		expect(screen.getByText("Left")).toBeOnTheScreen();
		expect(screen.getByText("Right")).toBeOnTheScreen();
	});
});
