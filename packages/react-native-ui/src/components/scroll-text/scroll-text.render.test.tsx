import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { ComponentProps } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { DelacourProvider } from "../provider";
import { ScrollText } from "./scroll-text";

const SENTENCE = "We build interfaces that move";

function layoutEvent(width: number) {
	return { nativeEvent: { layout: { x: 0, y: 0, width, height: 20 } } };
}

function textLayoutEvent(lines: readonly string[]) {
	return {
		nativeEvent: {
			lines: lines.map((text, index) => ({
				text,
				x: 0,
				y: index * 20,
				width: 100,
				height: 20,
				ascender: 16,
				descender: 4,
				capHeight: 12,
				xHeight: 8,
			})),
		},
	};
}

/** The hidden space-glyph probe the block measures its column gap from. */
async function measureSpace(width = 4) {
	const probe = screen.getAllByText(" ", { includeHiddenElements: true })[0];
	await fireEvent(probe, "layout", layoutEvent(width));
}

function ProgressText({
	value = 0.5,
	children = SENTENCE,
	...props
}: { value?: number } & Partial<ComponentProps<typeof ScrollText>>) {
	const progress = useSharedValue(value);
	return (
		<ScrollText source={{ kind: "progress", progress }} testID="scroll-text" {...props}>
			{children}
		</ScrollText>
	);
}

describe("ScrollText", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("warns once, and renders revealed, when the default screen source has no Screen above it", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<ScrollText testID="scroll-text">{SENTENCE}</ScrollText>);
		expect(screen.getByTestId("scroll-text")).toBeOnTheScreen();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain("needs a <Screen>");

		await renderWithProviders(<ScrollText>{SENTENCE}</ScrollText>);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test("is one accessible text element named by its whole string", async () => {
		await renderWithProviders(<ProgressText />);
		const block = screen.getByRole("text", { name: SENTENCE });
		expect(block).toBe(screen.getByTestId("scroll-text"));
		expect(block.props.accessible).toBe(true);
	});

	test("accessibilityLabel overrides the string as the block's name", async () => {
		await renderWithProviders(<ProgressText accessibilityLabel="Our promise" />);
		expect(screen.getByRole("text", { name: "Our promise" })).toBeOnTheScreen();
		expect(screen.queryByRole("text", { name: SENTENCE })).not.toBeOnTheScreen();
	});

	test("before measuring, the plain string stands in and is hidden from assistive technology", async () => {
		await renderWithProviders(<ProgressText />);
		expect(screen.getAllByText(SENTENCE, { includeHiddenElements: true }).length).toBeGreaterThan(0);
		expect(screen.queryByText(SENTENCE)).not.toBeOnTheScreen();
		expect(screen.getAllByRole("text", { name: SENTENCE })).toHaveLength(1);
	});

	test("word split: every word becomes its own piece, all hidden, the block announced once", async () => {
		await renderWithProviders(<ProgressText />);
		await measureSpace();

		for (const word of SENTENCE.split(" ")) {
			expect(screen.getByText(word, { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.queryByText(word)).not.toBeOnTheScreen();
		}
		expect(screen.getAllByRole("text", { name: SENTENCE })).toHaveLength(1);
		expect(screen.queryAllByRole("text", { name: "build" })).toHaveLength(0);
	});

	test("character split: one hidden piece per grapheme, still announced whole once", async () => {
		await renderWithProviders(<ProgressText split="character">Hi you</ProgressText>);
		await measureSpace();

		for (const glyph of ["H", "i", "y", "o", "u"]) {
			expect(screen.getByText(glyph, { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.queryByText(glyph)).not.toBeOnTheScreen();
		}
		expect(screen.getAllByRole("text", { name: "Hi you" })).toHaveLength(1);
	});

	test("line split: pieces are the lines the measurer reports, hidden, the block announced whole", async () => {
		await renderWithProviders(<ProgressText split="line" />);
		const measurer = screen.getAllByText(SENTENCE, { includeHiddenElements: true })[0];
		await fireEvent(measurer, "textLayout", textLayoutEvent(["We build interfaces", "that move"]));

		expect(screen.getByText("We build interfaces", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("that move", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("that move")).not.toBeOnTheScreen();
		expect(screen.getAllByRole("text", { name: SENTENCE })).toHaveLength(1);
	});

	test("line split: re-reporting identical lines does not change what is rendered", async () => {
		await renderWithProviders(<ProgressText split="line" />);
		const measurer = screen.getAllByText(SENTENCE, { includeHiddenElements: true })[0];
		const event = textLayoutEvent(["We build interfaces", "that move"]);
		await fireEvent(measurer, "textLayout", event);
		await fireEvent(measurer, "textLayout", event);
		expect(screen.getAllByText("that move", { includeHiddenElements: true })).toHaveLength(1);
	});

	test("every effect keeps the text present and the block announced once", async () => {
		const effects = [
			{ kind: "colour" },
			{ kind: "fade" },
			{ kind: "rise", distance: 12 },
			{ kind: "highlight" },
		] as const;
		for (const effect of effects) {
			const view = await renderWithProviders(<ProgressText effect={effect} />);
			await measureSpace();
			expect(screen.getByText("interfaces", { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.getAllByRole("text", { name: SENTENCE })).toHaveLength(1);
			await view.unmount();
		}
	});

	test("an offset source renders the block and survives its scroll host scrolling", async () => {
		function Host() {
			const scrollY = useSharedValue(0);
			return (
				<View testID="host" onLayout={() => undefined}>
					<ScrollText source={{ kind: "offset", scrollY }} testID="scroll-text">
						{SENTENCE}
					</ScrollText>
				</View>
			);
		}
		await renderWithProviders(<Host />);
		await fireEvent.scroll(screen.getByTestId("host"), {
			nativeEvent: {
				contentOffset: { x: 0, y: 200 },
				contentSize: { width: 390, height: 2000 },
				layoutMeasurement: { width: 390, height: 800 },
			},
		});
		await act(async () => {
			await fireEvent(screen.getByTestId("scroll-text"), "layout", layoutEvent(300));
		});
		expect(screen.getByRole("text", { name: SENTENCE })).toBeOnTheScreen();
	});

	test("a progress source needs no Screen and does not warn", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<ProgressText />);
		expect(warn.mock.calls.filter(([message]) => String(message).includes("needs a <Screen>"))).toHaveLength(0);
	});

	test("calm motion: pieces are present, hidden, and the block is announced once", async () => {
		await renderWithProviders(
			<DelacourProvider isMotionCalm>
				<ProgressText value={0} />
			</DelacourProvider>
		);
		await measureSpace();
		for (const word of SENTENCE.split(" ")) {
			expect(screen.getByText(word, { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.queryByText(word)).not.toBeOnTheScreen();
		}
		expect(screen.getAllByRole("text", { name: SENTENCE })).toHaveLength(1);
	});
});
