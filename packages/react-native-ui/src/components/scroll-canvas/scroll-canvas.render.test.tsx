import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useScrollSource } from "../../hooks/use-scroll-source";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { DelacourProvider } from "../provider";
import { ScrollCanvas } from "./scroll-canvas";

const FRAME_A = { uri: "https://example.test/a.jpg" };
const FRAME_B = { uri: "https://example.test/b.jpg" };
const FRAME_C = { uri: "https://example.test/c.jpg" };

type HarnessProps = { canvas: (source: ReturnType<typeof useScrollSource>["source"]) => ReactElement };

/** A real scroll source on a real `Animated.ScrollView`, the canvas inside it. */
function Harness({ canvas }: HarnessProps): ReactElement {
	const { source, scrollProps } = useScrollSource();
	return (
		<Animated.ScrollView testID="scroller" {...scrollProps}>
			{canvas(source)}
		</Animated.ScrollView>
	);
}

/** A canvas driven by a `progress` value, so no scroller is needed anywhere. */
function Driven(props: { label?: string }): ReactElement {
	const progress = useSharedValue(0);
	return <ScrollCanvas accessibilityLabel={props.label} progress={progress} source={FRAME_A} />;
}

/** The mounted picture hosts — nothing else on a canvas is reachable by role, label or text. */
function pictures() {
	return screen.container.queryAll((node) => node.type === "Image");
}

describe("ScrollCanvas", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("a labelled canvas is one image to assistive tech", async () => {
		await renderWithProviders(<Driven label="Fog over a ridge" />);
		expect(screen.getByRole("image", { name: "Fog over a ridge" })).toBeOnTheScreen();
		expect(screen.getByLabelText("Fog over a ridge")).toBeOnTheScreen();
	});

	test("an unlabelled canvas is decorative and hidden from assistive tech", async () => {
		await renderWithProviders(<Driven />);
		expect(screen.queryByRole("image")).not.toBeOnTheScreen();
		const [picture] = pictures();
		expect(picture?.parent).toHaveProp("importantForAccessibility", "no-hide-descendants");
		expect(picture?.parent).toHaveProp("accessible", false);
	});

	test("an empty label counts as none", async () => {
		await renderWithProviders(<Driven label="" />);
		expect(screen.queryByRole("image")).not.toBeOnTheScreen();
	});

	test.each(["parallax", "zoom"] as const)("%s draws one image", async (effect) => {
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return <ScrollCanvas accessibilityLabel="Ridge" effect={effect} progress={progress} source={FRAME_A} />;
		};
		await renderWithProviders(<Canvas />);
		expect(pictures()).toHaveLength(1);
	});

	test("reveal draws the image and its cover", async () => {
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return <ScrollCanvas accessibilityLabel="Ridge" effect="reveal" progress={progress} source={FRAME_A} />;
		};
		await renderWithProviders(<Canvas />);
		expect(pictures()).toHaveLength(1);
		const frame = screen.getByRole("image", { name: "Ridge" });
		expect(frame.children).toHaveLength(2);
	});

	test("sequence mounts every frame, in order", async () => {
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return (
				<ScrollCanvas
					accessibilityLabel="Spin"
					effect="sequence"
					progress={progress}
					sources={[FRAME_A, FRAME_B, FRAME_C]}
				/>
			);
		};
		await renderWithProviders(<Canvas />);
		const images = pictures();
		expect(images.map((image) => image.props.source)).toEqual([FRAME_A, FRAME_B, FRAME_C]);
	});

	test("sequence warns in development when it mounts too many frames", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		const many = Array.from({ length: 40 }, (_unused, index) => ({ uri: `https://example.test/${index}.jpg` }));
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return <ScrollCanvas effect="sequence" progress={progress} sources={many} />;
		};
		await renderWithProviders(<Canvas />);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("mounts every one at once"));
	});

	test("forwards onLayout and the frame's own props", async () => {
		const onLayout = jest.fn();
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return (
				<ScrollCanvas
					accessibilityLabel="Ridge"
					onLayout={onLayout}
					progress={progress}
					source={FRAME_A}
					testID="canvas"
				/>
			);
		};
		await renderWithProviders(<Canvas />);
		const frame = screen.getByTestId("canvas");
		expect(frame).toBeOnTheScreen();

		const layout = { x: 0, y: 40, width: 320, height: 200 };
		await fireEvent(frame, "layout", { nativeEvent: { layout } });
		expect(onLayout).toHaveBeenCalledTimes(1);
		expect(onLayout.mock.calls[0]?.[0]).toMatchObject({ nativeEvent: { layout } });
	});

	test("follows an explicit scrollSource and survives a scroll", async () => {
		await renderWithProviders(
			<Harness
				canvas={(source) => <ScrollCanvas accessibilityLabel="Ridge" scrollSource={source} source={FRAME_A} />}
			/>
		);
		const scroller = screen.getByTestId("scroller");
		await fireEvent.scroll(scroller, {
			nativeEvent: {
				contentOffset: { x: 0, y: 120 },
				contentSize: { width: 320, height: 1200 },
				layoutMeasurement: { width: 320, height: 640 },
			},
		});
		expect(screen.getByRole("image", { name: "Ridge" })).toBeOnTheScreen();
	});

	test("enabled={false} needs no scroll source", async () => {
		await renderWithProviders(<ScrollCanvas accessibilityLabel="Ridge" enabled={false} source={FRAME_A} />);
		expect(screen.getByRole("image", { name: "Ridge" })).toBeOnTheScreen();
	});

	test("outside a scroll source, with no progress, it throws its documented error", async () => {
		const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(<ScrollCanvas accessibilityLabel="Ridge" source={FRAME_A} />)).rejects.toThrow(
			"`ScrollCanvas` must be given a `scrollSource` or `progress`"
		);
		error.mockRestore();
	});

	test("Reduce Motion does not waive the scroll source", async () => {
		const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(
			render(
				<DelacourProvider isMotionCalm>
					<ScrollCanvas accessibilityLabel="Ridge" source={FRAME_A} />
				</DelacourProvider>
			)
		).rejects.toThrow("`ScrollCanvas` must be given a `scrollSource` or `progress`");
		error.mockRestore();
	});

	test("a sequence with no frames renders an empty frame", async () => {
		const Canvas = (): ReactElement => {
			const progress = useSharedValue(0);
			return <ScrollCanvas accessibilityLabel="Spin" effect="sequence" progress={progress} sources={[]} />;
		};
		await renderWithProviders(<Canvas />);
		expect(screen.getByRole("image", { name: "Spin" })).toBeOnTheScreen();
		expect(pictures()).toHaveLength(0);
	});
});
