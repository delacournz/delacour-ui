import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { CalmMotionProvider } from "../../hooks/use-calm-motion";
import { act, renderWithProviders, screen } from "../../test/render";
import { TEXT_MAX_FONT_SIZE_MULTIPLIER } from "../text/text.variants";
import { TextAnimation } from "./text-animation";

function Calm({ children }: { children: ReactNode }): ReactElement {
	return <CalmMotionProvider isMotionCalm>{children}</CalmMotionProvider>;
}

afterEach(() => {
	jest.useRealTimers();
});

describe("TextAnimation (reveal)", () => {
	test("announces the whole string once, whatever the split", async () => {
		for (const split of ["word", "character", "line"] as const) {
			const { unmount } = await renderWithProviders(<TextAnimation split={split}>Ship it before lunch</TextAnimation>);
			expect(screen.getByRole("text", { name: "Ship it before lunch" })).toBeOnTheScreen();
			expect(screen.getAllByLabelText("Ship it before lunch")).toHaveLength(1);
			await unmount();
		}
	});

	test("hides the animated pieces from assistive technology", async () => {
		await renderWithProviders(<TextAnimation split="word">Ship it</TextAnimation>);
		expect(screen.queryByText("Ship")).not.toBeOnTheScreen();
		expect(screen.getByText("Ship", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("it", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("a character split still renders every character, hidden", async () => {
		await renderWithProviders(<TextAnimation split="character">Hi</TextAnimation>);
		expect(screen.getByText("H", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("i", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("H")).not.toBeOnTheScreen();
	});

	test("forwards accessibilityHint and testID to the container", async () => {
		await renderWithProviders(
			<TextAnimation accessibilityHint="A headline" testID="headline">
				Hello
			</TextAnimation>
		);
		const container = screen.getByTestId("headline");
		expect(container.props.accessibilityHint).toBe("A headline");
		expect(container.props.accessibilityLabel).toBe("Hello");
	});

	test("a new string is announced as the new string", async () => {
		const { rerender } = await renderWithProviders(<TextAnimation>First line</TextAnimation>);
		await rerender(<TextAnimation>Second line</TextAnimation>);
		expect(screen.getByRole("text", { name: "Second line" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("First line")).not.toBeOnTheScreen();
	});

	test("calm motion reports onFinished once on mount", async () => {
		const onFinished = jest.fn();
		await renderWithProviders(<TextAnimation onFinished={onFinished}>Done</TextAnimation>, { wrapper: Calm });
		expect(onFinished).toHaveBeenCalledTimes(1);
	});

	test("calm motion does not report onFinished while inactive, and does once activated", async () => {
		const onFinished = jest.fn();
		const { rerender } = await renderWithProviders(
			<TextAnimation isActive={false} onFinished={onFinished}>
				Later
			</TextAnimation>,
			{ wrapper: Calm }
		);
		expect(onFinished).not.toHaveBeenCalled();
		await rerender(
			<TextAnimation isActive onFinished={onFinished}>
				Later
			</TextAnimation>
		);
		expect(onFinished).toHaveBeenCalledTimes(1);
	});

	test("calm motion reports onFinished again for a new text", async () => {
		const onFinished = jest.fn();
		const { rerender } = await renderWithProviders(<TextAnimation onFinished={onFinished}>One</TextAnimation>, {
			wrapper: Calm,
		});
		await rerender(<TextAnimation onFinished={onFinished}>Two</TextAnimation>);
		expect(onFinished).toHaveBeenCalledTimes(2);
	});
});

describe("TextAnimation.Typing", () => {
	test("announces a single phrase whole", async () => {
		await renderWithProviders(<TextAnimation.Typing>Design systems</TextAnimation.Typing>);
		expect(screen.getByRole("text", { name: "Design systems" })).toBeOnTheScreen();
		expect(screen.queryByText("D")).not.toBeOnTheScreen();
	});

	test("announces the final phrase of several, never the half-typed one", async () => {
		await renderWithProviders(<TextAnimation.Typing>{["Design systems", "Native apps"]}</TextAnimation.Typing>);
		expect(screen.getByRole("text", { name: "Native apps" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("Design systems")).not.toBeOnTheScreen();
	});

	test("hides the typed cells from assistive technology", async () => {
		await renderWithProviders(<TextAnimation.Typing caret={{ kind: "none" }}>Hi</TextAnimation.Typing>);
		expect(screen.queryByText("H")).not.toBeOnTheScreen();
		expect(screen.getByText("H", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("calm motion shows the resting phrase at once", async () => {
		await renderWithProviders(<TextAnimation.Typing testID="typing">{["One", "Two"]}</TextAnimation.Typing>, {
			wrapper: Calm,
		});
		expect(screen.getByTestId("typing").props.accessibilityLabel).toBe("Two");
		expect(screen.getByText("T", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("does not restart when the phrases array is a fresh literal with the same text", async () => {
		const onPhraseTyped = jest.fn();
		const { rerender } = await renderWithProviders(
			<TextAnimation.Typing onPhraseTyped={onPhraseTyped}>{["A", "B"]}</TextAnimation.Typing>
		);
		await rerender(<TextAnimation.Typing onPhraseTyped={onPhraseTyped}>{["A", "B"]}</TextAnimation.Typing>);
		expect(screen.getByRole("text", { name: "B" })).toBeOnTheScreen();
		expect(onPhraseTyped).not.toHaveBeenCalled();
	});
});

describe("TextAnimation.Rotating", () => {
	test("announces the current phrase", async () => {
		await renderWithProviders(<TextAnimation.Rotating phrases={["fast", "calm", "bold"]} />);
		expect(screen.getByRole("text", { name: "fast" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("caps font scaling at the default every other part uses", async () => {
		await renderWithProviders(<TextAnimation.Rotating phrases={["fast", "calm"]} />);
		const texts = screen.getAllByText(/./, { includeHiddenElements: true });
		for (const text of texts) expect(text.props.maxFontSizeMultiplier).toBe(TEXT_MAX_FONT_SIZE_MULTIPLIER);
	});

	test("hides the layers and probes from assistive technology", async () => {
		await renderWithProviders(<TextAnimation.Rotating phrases={["fast", "calm"]} />);
		expect(screen.queryByText("fast")).not.toBeOnTheScreen();
		expect(screen.getAllByText("fast", { includeHiddenElements: true }).length).toBeGreaterThan(0);
	});

	test("advances to the next phrase each interval and announces it", async () => {
		jest.useFakeTimers();
		await renderWithProviders(<TextAnimation.Rotating intervalMs={1000} phrases={["fast", "calm", "bold"]} />);
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
		expect(screen.getByRole("text", { name: "calm" })).toBeOnTheScreen();
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
		expect(screen.getByRole("text", { name: "bold" })).toBeOnTheScreen();
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
		expect(screen.getByRole("text", { name: "fast" })).toBeOnTheScreen();
	});

	test("holds the phrase while inactive", async () => {
		jest.useFakeTimers();
		await renderWithProviders(<TextAnimation.Rotating intervalMs={500} isActive={false} phrases={["fast", "calm"]} />);
		await act(async () => {
			jest.advanceTimersByTime(5000);
		});
		expect(screen.getByRole("text", { name: "fast" })).toBeOnTheScreen();
	});

	test("a single phrase never moves", async () => {
		jest.useFakeTimers();
		await renderWithProviders(<TextAnimation.Rotating intervalMs={500} phrases={["only"]} />);
		await act(async () => {
			jest.advanceTimersByTime(5000);
		});
		expect(screen.getByRole("text", { name: "only" })).toBeOnTheScreen();
	});

	test("calm motion holds the first phrase", async () => {
		jest.useFakeTimers();
		await renderWithProviders(<TextAnimation.Rotating intervalMs={500} phrases={["fast", "calm"]} />, {
			wrapper: Calm,
		});
		await act(async () => {
			jest.advanceTimersByTime(5000);
		});
		expect(screen.getByRole("text", { name: "fast" })).toBeOnTheScreen();
	});

	test("new phrases restart from the first", async () => {
		jest.useFakeTimers();
		const { rerender } = await renderWithProviders(<TextAnimation.Rotating intervalMs={500} phrases={["a", "b"]} />);
		await act(async () => {
			jest.advanceTimersByTime(500);
		});
		expect(screen.getByRole("text", { name: "b" })).toBeOnTheScreen();
		await rerender(<TextAnimation.Rotating intervalMs={500} phrases={["x", "y"]} />);
		expect(screen.getByRole("text", { name: "x" })).toBeOnTheScreen();
	});
});

describe("TextAnimation.Counting", () => {
	test("announces the final value, not the starting one", async () => {
		await renderWithProviders(<TextAnimation.Counting value={1284} />);
		expect(screen.getByRole("text", { name: "1,284" })).toBeOnTheScreen();
	});

	test("announces prefix, suffix and decimals as part of the value", async () => {
		await renderWithProviders(
			<TextAnimation.Counting format={{ decimals: 2 }} prefix="$" suffix=" USD" value={1284.5} />
		);
		expect(screen.getByRole("text", { name: "$1,284.50 USD" })).toBeOnTheScreen();
	});

	test("format prefix and suffix announce too, and the props win over them", async () => {
		await renderWithProviders(
			<>
				<TextAnimation.Counting format={{ prefix: "$" }} testID="a" value={5} />
				<TextAnimation.Counting format={{ prefix: "$" }} prefix="€" suffix="%" testID="b" value={5} />
			</>
		);
		expect(screen.getByTestId("a").props.accessibilityLabel).toBe("$5");
		expect(screen.getByTestId("b").props.accessibilityLabel).toBe("€5%");
	});

	test("a negative value keeps its sign before the prefix", async () => {
		await renderWithProviders(<TextAnimation.Counting prefix="$" testID="neg" value={-5} />);
		expect(screen.getByTestId("neg").props.accessibilityLabel).toBe("\u2212$5");
	});

	test("a new value is announced at once, while it tweens", async () => {
		const { rerender } = await renderWithProviders(<TextAnimation.Counting value={10} />);
		await rerender(<TextAnimation.Counting value={2500} />);
		expect(screen.getByRole("text", { name: "2,500" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("10")).not.toBeOnTheScreen();
	});

	test("hides the input and the width reserve from assistive technology", async () => {
		await renderWithProviders(<TextAnimation.Counting value={42} />);
		expect(screen.queryByDisplayValue("42")).not.toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("calm motion shows the value on the first frame", async () => {
		await renderWithProviders(<TextAnimation.Counting from={0} value={77} />, { wrapper: Calm });
		expect(screen.getByRole("text", { name: "77" })).toBeOnTheScreen();
		expect(screen.getByDisplayValue("77", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("animateOnMount false shows the value on mount", async () => {
		await renderWithProviders(<TextAnimation.Counting animateOnMount={false} value={900} />);
		expect(screen.getByDisplayValue("900", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "900" })).toBeOnTheScreen();
	});
});

describe("TextAnimation.Rolling", () => {
	test("announces the whole number once", async () => {
		await renderWithProviders(<TextAnimation.Rolling value={1284} />);
		expect(screen.getByRole("text", { name: "1,284" })).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/./)).toHaveLength(1);
	});

	test("announces prefix, suffix and decimals as part of the value", async () => {
		await renderWithProviders(<TextAnimation.Rolling format={{ decimals: 1 }} prefix="$" suffix="k" value={12.5} />);
		expect(screen.getByRole("text", { name: "$12.5k" })).toBeOnTheScreen();
	});

	test("caps font scaling at the default every other part uses", async () => {
		await renderWithProviders(<TextAnimation.Rolling prefix="$" value={1284} />);
		const texts = screen.getAllByText(/./, { includeHiddenElements: true });
		for (const text of texts) expect(text.props.maxFontSizeMultiplier).toBe(TEXT_MAX_FONT_SIZE_MULTIPLIER);
	});

	test("hides every wheel digit from assistive technology", async () => {
		await renderWithProviders(<TextAnimation.Rolling value={42} />);
		expect(screen.queryByText("4")).not.toBeOnTheScreen();
		expect(screen.getAllByText("4", { includeHiddenElements: true }).length).toBeGreaterThan(0);
	});

	test("a new value, including a new leading digit, is announced as the new number", async () => {
		const { rerender } = await renderWithProviders(<TextAnimation.Rolling value={999} />);
		await rerender(<TextAnimation.Rolling value={1000} />);
		expect(screen.getByRole("text", { name: "1,000" })).toBeOnTheScreen();
		expect(screen.queryByLabelText("999")).not.toBeOnTheScreen();
	});

	test("calm motion announces the value", async () => {
		await renderWithProviders(<TextAnimation.Rolling value={31} />, { wrapper: Calm });
		expect(screen.getByRole("text", { name: "31" })).toBeOnTheScreen();
	});
});
