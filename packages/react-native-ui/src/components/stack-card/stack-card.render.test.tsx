import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createRef, type ReactElement } from "react";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Text } from "../text";
import { StackCard, type StackCardHandle, type StackCardProps, useStackCard } from "./index";

const NAMES = ["Ada", "Grace", "Linus"] as const;

type TestProps = Partial<Omit<StackCardProps, "children">>;

function Counter(): ReactElement {
	const { index, count } = useStackCard();
	return <Text testID="counter">{`${index}/${count}`}</Text>;
}

function Deck(props: TestProps): ReactElement {
	return (
		<StackCard haptic={false} {...props}>
			<StackCard.Stamp color="success" direction="right">
				Yes
			</StackCard.Stamp>
			{NAMES.map((name) => (
				<StackCard.Card key={name} testID={`card-${name}`}>
					<Text>{name}</Text>
				</StackCard.Card>
			))}
			<StackCard.Empty>All caught up</StackCard.Empty>
			<StackCard.Actions>
				<StackCard.Action action="left" icon={() => null} label="Skip" />
				<StackCard.Action action="undo" icon={() => null} />
				<StackCard.Action action="right" icon={() => null} label="Save" />
				<Counter />
			</StackCard.Actions>
		</StackCard>
	);
}

const HIDDEN = { includeHiddenElements: true } as const;

function card(name: string) {
	return screen.getByTestId(`card-${name}`, HIDDEN);
}

function pile() {
	let node = card("Ada").parent;
	while (node && typeof node.props.onLayout !== "function") node = node.parent;
	if (!node) throw new Error("the pile was not found");
	return node;
}

async function runAnimations(): Promise<void> {
	await act(async () => {
		jest.advanceTimersByTime(1000);
	});
}

async function press(name: string): Promise<void> {
	await fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
	await runAnimations();
}

async function cardAction(name: string, actionName: string): Promise<void> {
	await fireEvent(card(name), "accessibilityAction", { nativeEvent: { actionName } });
	await runAnimations();
}

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

describe("StackCard", () => {
	test("mounts the cards and offers the deck's actions on the top card only", async () => {
		await renderWithProviders(<Deck />);
		for (const name of NAMES) expect(screen.getByText(name, HIDDEN)).toBeOnTheScreen();
		expect(screen.queryByText("All caught up", HIDDEN)).not.toBeOnTheScreen();
		expect(card("Ada").props.accessible).toBe(true);
		expect(card("Ada").props.accessibilityActions).toEqual([
			{ label: "Swipe left", name: "swipe-left" },
			{ label: "Swipe right", name: "swipe-right" },
		]);
		expect(card("Grace").props.accessible).toBe(false);
		expect(card("Grace").props.accessibilityActions).toBeUndefined();
	});

	test("directionLabels rename the card's actions and the buttons", async () => {
		await renderWithProviders(<Deck directionLabels={{ left: "Pass", right: "Like" }} />);
		expect(card("Ada").props.accessibilityActions).toEqual([
			{ label: "Pass", name: "swipe-left" },
			{ label: "Like", name: "swipe-right" },
		]);
	});

	test("directions decide which actions the card offers", async () => {
		await renderWithProviders(<Deck directions={["up", "down"]} />);
		expect(card("Ada").props.accessibilityActions).toEqual([
			{ label: "Swipe up", name: "swipe-up" },
			{ label: "Swipe down", name: "swipe-down" },
		]);
	});

	test("a card action throws the top card: onSwipe then onIndexChange", async () => {
		const calls: string[] = [];
		const onSwipe = jest.fn((direction: string, index: number) => calls.push(`swipe ${direction} ${index}`));
		const onIndexChange = jest.fn((index: number) => calls.push(`index ${index}`));
		await renderWithProviders(<Deck onIndexChange={onIndexChange} onSwipe={onSwipe} />);

		await cardAction("Ada", "swipe-right");

		expect(calls).toEqual(["swipe right 0", "index 1"]);
		expect(screen.getByTestId("counter")).toHaveTextContent("1/3");
		expect(card("Grace").props.accessible).toBe(true);
	});

	test("an action button throws the top card in its direction", async () => {
		const onSwipe = jest.fn();
		await renderWithProviders(<Deck onSwipe={onSwipe} />);
		await press("Skip");
		expect(onSwipe).toHaveBeenCalledWith("left", 0);
		expect(screen.getByTestId("counter")).toHaveTextContent("1/3");
	});

	test("an action's onPress is called before the deck acts", async () => {
		const calls: string[] = [];
		await renderWithProviders(
			<StackCard haptic={false} onSwipe={() => calls.push("swipe")}>
				<StackCard.Card>
					<Text>Only</Text>
				</StackCard.Card>
				<StackCard.Actions>
					<StackCard.Action action="right" icon={() => null} label="Save" onPress={() => calls.push("press")} />
				</StackCard.Actions>
			</StackCard>
		);
		await press("Save");
		expect(calls).toEqual(["press", "swipe"]);
	});

	test("undo is disabled until a card has been thrown, then brings it back without onSwipe", async () => {
		const onSwipe = jest.fn();
		const onIndexChange = jest.fn();
		await renderWithProviders(<Deck onIndexChange={onIndexChange} onSwipe={onSwipe} />);
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
		expect(card("Ada").props.accessibilityActions).toHaveLength(2);

		await press("Save");
		expect(screen.getByRole("button", { name: "Undo" })).not.toBeDisabled();
		expect(card("Grace").props.accessibilityActions).toContainEqual({ label: "Undo", name: "undo" });

		await press("Undo");
		expect(onIndexChange).toHaveBeenLastCalledWith(0);
		expect(onSwipe).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
	});

	test("the card's undo action brings the last card back", async () => {
		await renderWithProviders(<Deck />);
		await cardAction("Ada", "swipe-left");
		await cardAction("Grace", "undo");
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
		expect(card("Ada").props.accessible).toBe(true);
	});

	test("the ref throws and undoes", async () => {
		const ref = createRef<StackCardHandle>();
		const onSwipe = jest.fn();
		await renderWithProviders(<Deck onSwipe={onSwipe} ref={ref} />);

		await act(async () => {
			ref.current?.swipe("up");
		});
		await runAnimations();
		expect(onSwipe).toHaveBeenCalledWith("up", 0);
		expect(screen.getByTestId("counter")).toHaveTextContent("1/3");

		await act(async () => {
			ref.current?.undo();
		});
		await runAnimations();
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
	});

	test("emptying the deck shows Empty, calls onEmpty once and disables the directions", async () => {
		const onEmpty = jest.fn();
		await renderWithProviders(<Deck defaultIndex={2} onEmpty={onEmpty} />);
		expect(onEmpty).not.toHaveBeenCalled();

		await press("Save");

		expect(onEmpty).toHaveBeenCalledTimes(1);
		expect(screen.getByText("All caught up", HIDDEN)).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
	});

	test("a deck that starts empty does not call onEmpty", async () => {
		const onEmpty = jest.fn();
		await renderWithProviders(<Deck defaultIndex={3} onEmpty={onEmpty} />);
		expect(screen.getByText("All caught up", HIDDEN)).toBeOnTheScreen();
		expect(onEmpty).not.toHaveBeenCalled();
	});

	test("isDisabled disables the buttons and the gesture, and offers no undo", async () => {
		await renderWithProviders(<Deck isDisabled />);
		expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
		expect(getByGestureTestId("stack-card-pan").config.enabled).toBe(false);
	});

	test("the gesture is enabled while there are cards and off once empty", async () => {
		const { rerender } = await renderWithProviders(<Deck index={0} />);
		expect(getByGestureTestId("stack-card-pan").config.enabled).toBe(true);
		await rerender(<Deck index={3} />);
		expect(getByGestureTestId("stack-card-pan").config.enabled).toBe(false);
	});

	test("uncontrolled: defaultIndex seeds the top card", async () => {
		await renderWithProviders(<Deck defaultIndex={1} />);
		expect(screen.getByTestId("counter")).toHaveTextContent("1/3");
		expect(card("Grace").props.accessible).toBe(true);
	});

	test("controlled: a throw reports and the pile waits for the prop", async () => {
		const onIndexChange = jest.fn();
		const { rerender } = await renderWithProviders(<Deck index={0} onIndexChange={onIndexChange} />);

		await cardAction("Ada", "swipe-right");
		expect(onIndexChange).toHaveBeenCalledWith(1);
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
		expect(card("Ada").props.accessible).toBe(true);

		await rerender(<Deck index={1} onIndexChange={onIndexChange} />);
		await runAnimations();
		expect(screen.getByTestId("counter")).toHaveTextContent("1/3");
		expect(card("Grace").props.accessible).toBe(true);
	});

	test("a controlled deck that declines a throw keeps its top card and offers no undo", async () => {
		await renderWithProviders(<Deck index={0} onIndexChange={() => undefined} />);
		await cardAction("Ada", "swipe-left");
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
		expect(card("Ada").props.accessible).toBe(true);
		expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
	});

	test("a drag past the threshold throws the card", async () => {
		const onSwipe = jest.fn();
		await renderWithProviders(<Deck onSwipe={onSwipe} />);
		await act(async () => {
			await fireEvent(pile(), "layout", { nativeEvent: { layout: { height: 400, width: 300, x: 0, y: 0 } } });
		});
		await act(async () => {
			fireGestureHandler(getByGestureTestId("stack-card-pan"), [
				{ translationX: 0, translationY: 0 },
				{ translationX: 200, translationY: 0 },
				{ translationX: 200, translationY: 0, velocityX: 0, velocityY: 0 },
			]);
		});
		await runAnimations();
		expect(onSwipe).toHaveBeenCalledWith("right", 0);
	});

	test("a short drag springs back without throwing", async () => {
		const onSwipe = jest.fn();
		await renderWithProviders(<Deck onSwipe={onSwipe} />);
		await act(async () => {
			fireGestureHandler(getByGestureTestId("stack-card-pan"), [
				{ translationX: 0, translationY: 0 },
				{ translationX: 10, translationY: 0 },
				{ translationX: 10, translationY: 0, velocityX: 0, velocityY: 0 },
			]);
		});
		await runAnimations();
		expect(onSwipe).not.toHaveBeenCalled();
		expect(screen.getByTestId("counter")).toHaveTextContent("0/3");
	});

	test("Stamp is hidden from assistive technology", async () => {
		await renderWithProviders(<Deck />);
		expect(screen.queryByText("Yes")).not.toBeOnTheScreen();
		expect(screen.getByText("Yes", HIDDEN)).toBeOnTheScreen();
	});

	test("parts outside a StackCard throw their documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<StackCard.Card />)).rejects.toThrow(
				"StackCard.Card must be rendered inside a <StackCard>."
			);
			await expect(renderWithProviders(<StackCard.Action action="left" icon={() => null} />)).rejects.toThrow(
				"StackCard.Action must be rendered inside a <StackCard>."
			);
			await expect(renderWithProviders(<StackCard.Stamp>Yes</StackCard.Stamp>)).rejects.toThrow(
				"StackCard.Stamp must be rendered inside a <StackCard>."
			);
			await expect(renderWithProviders(<Counter />)).rejects.toThrow(
				"useStackCard must be called inside a <StackCard>."
			);
		} finally {
			spy.mockRestore();
		}
	});
});
