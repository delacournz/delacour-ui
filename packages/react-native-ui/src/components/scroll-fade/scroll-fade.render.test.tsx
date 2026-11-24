import { describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import Animated from "react-native-reanimated";
import { useScrollSource } from "../../hooks/use-scroll-source";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { ScrollFade } from "./scroll-fade";

type RowProps = {
	orientation?: "vertical" | "horizontal";
	fade?: Omit<React.ComponentProps<typeof ScrollFade>, "children" | "scrollSource">;
};

function Row({ orientation = "vertical", fade }: RowProps) {
	const { source, scrollProps } = useScrollSource({ orientation });
	return (
		<ScrollFade color="#ffffff" scrollSource={source} {...fade}>
			<Animated.ScrollView horizontal={orientation === "horizontal"} testID="scroller" {...scrollProps}>
				<Text>Content</Text>
			</Animated.ScrollView>
		</ScrollFade>
	);
}

const hidden = { includeHiddenElements: true } as const;

describe("ScrollFade", () => {
	test("renders its content, reachable by assistive tech", async () => {
		await renderWithProviders(<Row />);
		expect(screen.getByText("Content")).toBeOnTheScreen();
	});

	test("draws both edges by default, hidden from assistive tech", async () => {
		await renderWithProviders(<Row />);
		const start = screen.getByTestId("scroll-fade-start", hidden);
		const end = screen.getByTestId("scroll-fade-end", hidden);
		expect(start).toHaveProp("accessible", false);
		expect(end).toHaveProp("importantForAccessibility", "no-hide-descendants");
		expect(screen.queryByTestId("scroll-fade-start")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("scroll-fade-end")).not.toBeOnTheScreen();
	});

	test.each([
		["start", true, false],
		["end", false, true],
		["both", true, true],
		["none", false, false],
	] as const)("edges=%s draws start=%s end=%s", async (edges, start, end) => {
		await renderWithProviders(<Row fade={{ edges }} />);
		expect(screen.queryByTestId("scroll-fade-start", hidden) !== null).toBe(start);
		expect(screen.queryByTestId("scroll-fade-end", hidden) !== null).toBe(end);
	});

	test("enabled=false draws nothing but keeps the content", async () => {
		await renderWithProviders(<Row fade={{ enabled: false }} />);
		expect(screen.queryByTestId("scroll-fade-start", hidden)).toBeNull();
		expect(screen.queryByTestId("scroll-fade-end", hidden)).toBeNull();
		expect(screen.getByText("Content")).toBeOnTheScreen();
	});

	test("a colour whose alpha cannot be taken off draws no fade", async () => {
		await renderWithProviders(<Row fade={{ color: "not-a-colour" }} />);
		expect(screen.queryByTestId("scroll-fade-start", hidden)).toBeNull();
		expect(screen.queryByTestId("scroll-fade-end", hidden)).toBeNull();
		expect(screen.getByText("Content")).toBeOnTheScreen();
	});

	test("a literal colour and a horizontal source still mount both edges", async () => {
		await renderWithProviders(<Row fade={{ color: "#112233" }} orientation="horizontal" />);
		expect(screen.getByTestId("scroll-fade-start", hidden)).toBeTruthy();
		expect(screen.getByTestId("scroll-fade-end", hidden)).toBeTruthy();
	});

	test("keyboardAware mounts the end edge", async () => {
		await renderWithProviders(<Row fade={{ keyboardAware: true }} />);
		expect(screen.getByTestId("scroll-fade-end", hidden)).toBeTruthy();
	});

	test("forwards root props such as testID and onLayout", async () => {
		const onLayout = jest.fn();
		await renderWithProviders(<Row fade={{ onLayout, testID: "fade-root" }} />);
		await fireEvent(screen.getByTestId("fade-root"), "layout", { nativeEvent: { layout: { width: 10, height: 10 } } });
		expect(onLayout).toHaveBeenCalledTimes(1);
	});

	test("a scrollable's own scroll callback still fires through the source's props", async () => {
		const onScroll = jest.fn();
		function Wired() {
			const { source, scrollProps } = useScrollSource();
			return (
				<ScrollFade color="#ffffff" scrollSource={source}>
					<Animated.ScrollView testID="scroller" {...scrollProps} onScroll={onScroll}>
						<Text>Content</Text>
					</Animated.ScrollView>
				</ScrollFade>
			);
		}
		await renderWithProviders(<Wired />);
		await fireEvent.scroll(screen.getByTestId("scroller"), {
			nativeEvent: {
				contentOffset: { x: 0, y: 40 },
				contentSize: { width: 100, height: 600 },
				layoutMeasurement: { width: 100, height: 200 },
			},
		});
		expect(onScroll).toHaveBeenCalledTimes(1);
	});

	test("without a scroll source it throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(
				renderWithProviders(
					<ScrollFade color="#ffffff">
						<Text>Content</Text>
					</ScrollFade>
				)
			).rejects.toThrow(/ScrollFade.*scrollSource/);
		} finally {
			spy.mockRestore();
		}
	});
});
