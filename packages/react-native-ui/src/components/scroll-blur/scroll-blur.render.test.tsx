import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { type ScrollSource, useScrollSource } from "../../hooks/use-scroll-source";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { ScrollBlur } from "./scroll-blur";
import { ScrollBlurLayerProvider } from "./scroll-blur.context";
import type { BlurLayerProps, ScrollBlurProps } from "./scroll-blur.types";

const LAYERS = 3;

/** A blur engine that draws one findable view per strip. */
function TestLayer({ intensity, material }: BlurLayerProps) {
	return <View accessibilityLabel={`${material}:${intensity}`} testID="blur-strip" />;
}

/** Another engine, so a test can tell which one drew. */
function OtherLayer(_props: BlurLayerProps) {
	return <View testID="other-strip" />;
}

type HarnessProps = {
	orientation?: "vertical" | "horizontal";
	onSource?: (source: ScrollSource) => void;
	blurProps?: Partial<ScrollBlurProps>;
};

/** A real scroll source feeding a `ScrollBlur` around a scrollable with one reachable row. */
function Harness({ orientation = "vertical", onSource, blurProps }: HarnessProps) {
	const { source, scrollProps } = useScrollSource({ orientation });
	onSource?.(source);
	return (
		<ScrollBlur layers={LAYERS} scrollSource={source} {...blurProps}>
			<Animated.ScrollView horizontal={orientation === "horizontal"} testID="list" {...scrollProps}>
				<Text>Row one</Text>
			</Animated.ScrollView>
		</ScrollBlur>
	);
}

/** Whether `element` or an ancestor hides its subtree from assistive tech. */
function isHiddenFromAssistiveTech(element: { props: Record<string, unknown>; parent: unknown }): boolean {
	let current = element as { props: Record<string, unknown>; parent: unknown } | null;
	while (current) {
		if (current.props.importantForAccessibility === "no-hide-descendants") return true;
		current = current.parent as typeof current;
	}
	return false;
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("ScrollBlur", () => {
	test("renders its children and keeps them reachable", async () => {
		await renderWithProviders(<Harness blurProps={{ layer: TestLayer }} />);
		expect(screen.getByText("Row one")).toBeOnTheScreen();
		expect(isHiddenFromAssistiveTech(screen.getByText("Row one"))).toBe(false);
	});

	test("every band is hidden from assistive tech and lets touches through", async () => {
		await renderWithProviders(<Harness blurProps={{ layer: TestLayer }} />);
		const strips = screen.getAllByTestId("blur-strip", { includeHiddenElements: true });
		expect(strips).toHaveLength(LAYERS * 2);
		for (const strip of strips) {
			expect(isHiddenFromAssistiveTech(strip)).toBe(true);
		}
		expect(screen.queryByTestId("blur-strip")).not.toBeOnTheScreen();
		expect(screen.getByText("Row one")).toBeOnTheScreen();
	});

	test("passes extra view props to the root", async () => {
		await renderWithProviders(<Harness blurProps={{ layer: TestLayer, testID: "blur-root" }} />);
		expect(screen.getByTestId("blur-root")).toBeOnTheScreen();
	});

	describe("edges", () => {
		const count = async (blurProps: HarnessProps["blurProps"]): Promise<number> => {
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer, ...blurProps }} />);
			return screen.queryAllByTestId("blur-strip", { includeHiddenElements: true }).length;
		};

		test("both draws a band at each end", async () => {
			expect(await count({ edges: "both" })).toBe(LAYERS * 2);
		});

		test("start draws one band", async () => {
			expect(await count({ edges: "start" })).toBe(LAYERS);
		});

		test("end draws one band", async () => {
			expect(await count({ edges: "end" })).toBe(LAYERS);
		});

		test("enabled=false draws no band and keeps the content", async () => {
			expect(await count({ enabled: false })).toBe(0);
			expect(screen.getByText("Row one")).toBeOnTheScreen();
		});

		test("a horizontal source still draws a band at each end", async () => {
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer }} orientation="horizontal" />);
			expect(screen.getAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(LAYERS * 2);
		});
	});

	describe("blur engine", () => {
		test("the layer prop draws the strips with the material it was given", async () => {
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer, material: "dark", edges: "start" }} />);
			const strips = screen.getAllByTestId("blur-strip", { includeHiddenElements: true });
			expect(strips).toHaveLength(LAYERS);
			for (const strip of strips) {
				expect(strip.props.accessibilityLabel).toMatch(/^dark:/);
			}
		});

		test("the layers prop sets the strip count", async () => {
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer, layers: 5, edges: "end" }} />);
			expect(screen.getAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(5);
		});

		test("an ambient provider supplies the engine", async () => {
			await renderWithProviders(
				<ScrollBlurLayerProvider layer={TestLayer}>
					<Harness />
				</ScrollBlurLayerProvider>
			);
			expect(screen.getAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(LAYERS * 2);
		});

		test("the layer prop wins over the provider", async () => {
			await renderWithProviders(
				<ScrollBlurLayerProvider layer={TestLayer}>
					<Harness blurProps={{ layer: OtherLayer, edges: "start" }} />
				</ScrollBlurLayerProvider>
			);
			expect(screen.queryAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(0);
			expect(screen.getAllByTestId("other-strip", { includeHiddenElements: true })).toHaveLength(LAYERS);
		});

		test("a null provider layer falls back to the wash with no strips", async () => {
			await renderWithProviders(
				<ScrollBlurLayerProvider layer={null}>
					<Harness />
				</ScrollBlurLayerProvider>
			);
			expect(screen.queryAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(0);
			expect(screen.getByText("Row one")).toBeOnTheScreen();
		});

		test("no engine at all renders the children without strips", async () => {
			await renderWithProviders(<Harness />);
			expect(screen.queryAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(0);
			expect(screen.getByText("Row one")).toBeOnTheScreen();
		});

		test("Reduce Transparency drops the strips even with an engine", async () => {
			jest.spyOn(AccessibilityInfo, "isReduceTransparencyEnabled").mockResolvedValue(true);
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer }} />);
			await act(async () => {
				await Promise.resolve();
			});
			expect(screen.queryAllByTestId("blur-strip", { includeHiddenElements: true })).toHaveLength(0);
			expect(screen.getByText("Row one")).toBeOnTheScreen();
		});
	});

	describe("scroll source", () => {
		test("a scroll event reaches the source the bands follow", async () => {
			let source: ScrollSource | undefined;
			await renderWithProviders(<Harness blurProps={{ layer: TestLayer }} onSource={(s) => (source = s)} />);
			await fireEvent.scroll(screen.getByTestId("list"), {
				nativeEvent: {
					contentOffset: { x: 0, y: 120 },
					contentSize: { width: 300, height: 900 },
					layoutMeasurement: { width: 300, height: 400 },
				},
			});
			expect(source?.offset.value).toBe(120);
			expect(source?.contentSize.value).toBe(900);
			expect(source?.layoutSize.value).toBe(400);
			expect(screen.getByText("Row one")).toBeOnTheScreen();
		});

		test("without a scrollSource or a provider it throws naming the component", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(
				renderWithProviders(
					<ScrollBlur>
						<Text>Row</Text>
					</ScrollBlur>
				)
			).rejects.toThrow(/ScrollBlur.*scrollSource/);
			spy.mockRestore();
		});
	});
});
