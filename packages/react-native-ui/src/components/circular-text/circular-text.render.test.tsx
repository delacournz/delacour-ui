import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Pressable, Text } from "react-native";
import { resetScreenReaderStore } from "../../hooks/use-looping-motion";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { DelacourProvider } from "../provider";
import { CircularText } from "./circular-text";

let isReaderOn = false;

beforeEach(() => {
	resetScreenReaderStore();
	isReaderOn = false;
	jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockImplementation(() => Promise.resolve(isReaderOn));
	jest
		.spyOn(AccessibilityInfo, "addEventListener")
		.mockImplementation((() => ({ remove: jest.fn() })) as unknown as typeof AccessibilityInfo.addEventListener);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("CircularText", () => {
	test("announces the whole string once as text", async () => {
		await renderWithProviders(<CircularText radius={60}>Handmade in Wellington</CircularText>);
		expect(screen.getByRole("text", { name: "Handmade in Wellington" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("hides the glyphs from assistive technology", async () => {
		await renderWithProviders(<CircularText radius={60}>Handmade</CircularText>);
		expect(screen.queryByText("Handmade")).not.toBeOnTheScreen();
		expect(screen.getAllByText("Handmade", { includeHiddenElements: true }).length).toBeGreaterThan(0);
	});

	test("a repeated ring is still announced once, without its separators", async () => {
		await renderWithProviders(
			<CircularText radius={60} repeat={3} separator=" • ">
				Scroll down
			</CircularText>
		);
		expect(screen.getByRole("text", { name: "Scroll down" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("a filled ring is announced as one copy", async () => {
		await renderWithProviders(
			<CircularText radius={72} repeat="fill">
				DELACOUR UI
			</CircularText>
		);
		expect(screen.getByRole("text", { name: "DELACOUR UI" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("a spanned arc is announced whole", async () => {
		await renderWithProviders(
			<CircularText radius={60} span={{ kind: "arc", sweep: 140 }}>
				Over the mark
			</CircularText>
		);
		expect(screen.getByRole("text", { name: "Over the mark" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("accessibilityLabel overrides the spoken text", async () => {
		await renderWithProviders(
			<CircularText accessibilityLabel="Official seal" radius={60}>
				DELACOUR UI
			</CircularText>
		);
		expect(screen.getByRole("text", { name: "Official seal" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("DELACOUR UI")).not.toBeOnTheScreen();
	});

	test("a new string is announced as the new string", async () => {
		const { rerender } = await renderWithProviders(<CircularText radius={60}>First</CircularText>);
		await rerender(<CircularText radius={60}>Second</CircularText>);
		expect(screen.getByRole("text", { name: "Second" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("First")).not.toBeOnTheScreen();
	});

	test("forwards testID and accessibilityHint-free View props to the root", async () => {
		await renderWithProviders(
			<CircularText radius={50} testID="seal">
				Seal
			</CircularText>
		);
		expect(screen.getByTestId("seal")).toBeOnTheScreen();
	});

	test("the ring text is not announced when centerContent is present, and the content stays reachable", async () => {
		await renderWithProviders(
			<CircularText
				centerContent={
					<Pressable accessibilityLabel="Open menu" accessibilityRole="button">
						<Text>Go</Text>
					</Pressable>
				}
				radius={60}
			>
				Handmade
			</CircularText>
		);
		expect(screen.getByRole("button", { name: "Open menu" })).toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "Handmade" })).toBeOnTheScreen();
		expect(screen.getByText("Go")).toBeOnTheScreen();
	});

	test("centerContent is not nested inside the labelled ring", async () => {
		await renderWithProviders(
			<CircularText centerContent={<Text>Centre</Text>} radius={60}>
				Handmade
			</CircularText>
		);
		expect(screen.getByRole("text", { name: "Handmade" })).not.toHaveTextContent("Centre");
		expect(screen.getByText("Centre")).toBeOnTheScreen();
	});

	test("no centerContent renders nothing extra", async () => {
		await renderWithProviders(<CircularText radius={60}>Handmade</CircularText>);
		expect(screen.queryByText("Go")).not.toBeOnTheScreen();
	});

	test("direction, side, spin and pause variants keep the same announcement", async () => {
		await renderWithProviders(
			<>
				<CircularText direction="counterclockwise" radius={60} side="inside" spin={{ kind: "loop" }} testID="a">
					Loop
				</CircularText>
				<CircularText pause={{ kind: "press" }} radius={60} spin={{ kind: "loop", speed: 30 }} testID="b">
					Hold
				</CircularText>
				<CircularText pause={{ kind: "controlled", isPaused: true }} radius={60} spin={{ kind: "loop" }} testID="c">
					Stop
				</CircularText>
			</>
		);
		expect(screen.getByRole("text", { name: "Loop" })).toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "Hold" })).toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "Stop" })).toBeOnTheScreen();
	});

	test("an invalid radius renders nothing and warns once", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(
			<CircularText radius={0} testID="bad">
				Nope
			</CircularText>
		);
		expect(screen.queryByTestId("bad")).not.toBeOnTheScreen();
		expect(screen.queryByLabelText("Nope")).not.toBeOnTheScreen();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain("positive radius");
	});

	test("empty text renders nothing", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(
			<CircularText radius={60} testID="empty">
				{"   "}
			</CircularText>
		);
		expect(screen.queryByTestId("empty")).not.toBeOnTheScreen();
		expect(warn).toHaveBeenCalled();
	});

	describe("looping motion", () => {
		const ring = () => screen.getByRole("text", { name: "Spin" });

		test("a spinning ring offers pause, then resume after the user pauses", async () => {
			await renderWithProviders(
				<CircularText radius={60} spin={{ kind: "loop" }}>
					Spin
				</CircularText>
			);
			expect(ring().props.accessibilityActions).toEqual([{ name: "pause", label: "Pause animation" }]);
			await act(() => {
				fireEvent(ring(), "accessibilityAction", { nativeEvent: { actionName: "pause" } });
			});
			expect(ring().props.accessibilityActions).toEqual([{ name: "resume", label: "Resume animation" }]);
			await act(() => {
				fireEvent(ring(), "accessibilityAction", { nativeEvent: { actionName: "resume" } });
			});
			expect(ring().props.accessibilityActions).toEqual([{ name: "pause", label: "Pause animation" }]);
		});

		test("a ring that does not spin offers no actions", async () => {
			await renderWithProviders(<CircularText radius={60}>Spin</CircularText>);
			expect(ring().props.accessibilityActions).toBeUndefined();
		});

		test("a controlled angle offers no actions: the caller owns that motion", async () => {
			const { useSharedValue } =
				jest.requireActual<typeof import("react-native-reanimated")>("react-native-reanimated");
			function Controlled() {
				const rotation = useSharedValue(0);
				return (
					<CircularText radius={60} spin={{ kind: "controlled", rotation }}>
						Spin
					</CircularText>
				);
			}
			await renderWithProviders(<Controlled />);
			expect(ring().props.accessibilityActions).toBeUndefined();
		});

		test("a screen reader holds the ring at rest and leaves it nothing to resume", async () => {
			isReaderOn = true;
			await renderWithProviders(
				<CircularText radius={60} spin={{ kind: "loop" }}>
					Spin
				</CircularText>
			);
			await act(async () => {});
			expect(ring().props.accessibilityActions).toEqual([]);
		});

		test("calm motion holds the ring at rest", async () => {
			await renderWithProviders(
				<DelacourProvider isMotionCalm>
					<CircularText radius={60} spin={{ kind: "loop" }}>
						Spin
					</CircularText>
				</DelacourProvider>
			);
			expect(ring().props.accessibilityActions).toEqual([]);
		});

		test("isPaused freezes the ring and the pause action reports through onPausedChange", async () => {
			const onPausedChange = jest.fn();
			await renderWithProviders(
				<CircularText isPaused onPausedChange={onPausedChange} radius={60} spin={{ kind: "loop" }}>
					Spin
				</CircularText>
			);
			expect(ring().props.accessibilityActions).toEqual([{ name: "resume", label: "Resume animation" }]);
			await act(() => {
				fireEvent(ring(), "accessibilityAction", { nativeEvent: { actionName: "resume" } });
			});
			expect(onPausedChange).toHaveBeenCalledWith(false);
		});

		test("defaultPaused starts the ring frozen", async () => {
			await renderWithProviders(
				<CircularText defaultPaused radius={60} spin={{ kind: "loop" }}>
					Spin
				</CircularText>
			);
			expect(ring().props.accessibilityActions).toEqual([{ name: "resume", label: "Resume animation" }]);
		});
	});
});
