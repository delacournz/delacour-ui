import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text } from "react-native";
import { resetScreenReaderStore } from "../../hooks/use-looping-motion";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
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

let readerListener: ((enabled: boolean) => void) | null = null;
let isReaderOn = false;

beforeEach(() => {
	resetScreenReaderStore();
	readerListener = null;
	isReaderOn = false;
	jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockImplementation(() => Promise.resolve(isReaderOn));
	jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(((
		event: string,
		listener: (v: boolean) => void
	) => {
		if (event === "screenReaderChanged") readerListener = listener;
		return { remove: jest.fn() };
	}) as unknown as typeof AccessibilityInfo.addEventListener);
});

afterEach(() => {
	jest.restoreAllMocks();
});

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
	test("a screen reader swaps the moving track for one still, hand-scrollable copy", async () => {
		isReaderOn = true;
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		await act(async () => {});
		await fireEvent(screen.getByTestId("strip"), "layout", { nativeEvent: { layout: { width: 300, height: 40 } } });
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true })).toHaveLength(1);
	});

	test("a screen reader turned on mid-loop rests the strip", async () => {
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		await measure(300, 100);
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true }).length).toBeGreaterThan(1);
		await act(async () => {
			readerListener?.(true);
		});
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true })).toHaveLength(1);
	});

	test("a user pause freezes the track in place rather than swapping it for the still strip", async () => {
		await renderWithProviders(
			<Marquee isPaused testID="strip">
				<Words />
			</Marquee>
		);
		await measure(300, 100);
		expect(screen.getAllByText("Alpha", { includeHiddenElements: true }).length).toBeGreaterThan(1);
	});

	test("a labelled strip offers pause, and its action reports the change", async () => {
		const onPausedChange = jest.fn();
		await renderWithProviders(
			<Marquee accessibilityLabel="Our partners" onPausedChange={onPausedChange} testID="strip">
				<Words />
			</Marquee>
		);
		const strip = screen.getByTestId("strip");
		expect(strip.props.accessibilityActions).toEqual([{ name: "pause", label: "Pause animation" }]);
		await act(async () => {
			strip.props.onAccessibilityAction({ nativeEvent: { actionName: "pause" } });
		});
		expect(onPausedChange).toHaveBeenCalledWith(true);
	});

	test("an unlabelled strip carries no accessibility actions", async () => {
		await renderWithProviders(
			<Marquee testID="strip">
				<Words />
			</Marquee>
		);
		expect(screen.getByTestId("strip").props.accessibilityActions).toBeUndefined();
	});

	test("a Group's pause applies to its strips and wins over their own", async () => {
		const onPausedChange = jest.fn();
		await renderWithProviders(
			<Marquee.Group defaultPaused onPausedChange={onPausedChange}>
				<Marquee accessibilityLabel="Row" isPaused={false} testID="row">
					<Words />
				</Marquee>
			</Marquee.Group>
		);
		expect(screen.getByTestId("row").props.accessibilityActions).toEqual([
			{ name: "resume", label: "Resume animation" },
		]);
		await act(async () => {
			screen.getByTestId("row").props.onAccessibilityAction({ nativeEvent: { actionName: "resume" } });
		});
		expect(onPausedChange).toHaveBeenCalledWith(false);
		expect(screen.getByTestId("row").props.accessibilityActions).toEqual([{ name: "pause", label: "Pause animation" }]);
	});
});
