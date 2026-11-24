import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { MessageScroller } from "./message-scroller";
import type { MessageScrollerContextValue } from "./message-scroller.context";
import type { MessageScrollerController } from "./message-scroller.types";
import { useMessageScrollerState } from "./use-message-scroller-state";

type Chat = { id: string; author: string; text: string; sentAt: Date };

const BASE = new Date(2026, 9, 5, 9, 0).getTime();

function chat(id: number, author = "aria"): Chat {
	return { id: `m${id}`, author, text: `Message ${id}`, sentAt: new Date(BASE + id * 60_000) };
}

const MESSAGES: Chat[] = [chat(0), chat(1), chat(2, "me")];

type RootProps = Partial<Parameters<typeof MessageScroller<Chat>>[0]>;

function Scroller(props: RootProps): ReactElement {
	return (
		<MessageScroller
			getDate={(message: Chat) => message.sentAt}
			getKey={(message: Chat) => message.id}
			getSenderId={(message: Chat) => message.author}
			messages={MESSAGES}
			renderMessage={({ message }) => <Text>{message.text}</Text>}
			viewerId="me"
			{...props}
		/>
	);
}

/**
 * LegendList draws no row until its scroll view has been measured, and Jest measures nothing, so a
 * list under test is given a viewport by hand.
 */
async function mount(ui: ReactElement) {
	const view = await renderWithProviders(ui);
	const list = screen.queryByLabelText("Conversation");
	if (list) {
		await fireEvent(list, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 600 } } });
	}
	return view;
}

describe("MessageScroller", () => {
	test("renders a labelled list of the app's own messages", async () => {
		await mount(<Scroller />);
		expect(screen.getByLabelText("Conversation")).toBeOnTheScreen();
		expect(screen.getByText("Message 0")).toBeOnTheScreen();
		expect(screen.getByText("Message 2")).toBeOnTheScreen();
	});

	test("renderMessage gets each message's place in its sender's run", async () => {
		const positions: Record<string, string> = {};
		await mount(
			<Scroller
				renderMessage={({ message, position }) => {
					positions[message.id] = position;
					return <Text>{message.text}</Text>;
				}}
			/>
		);
		expect(positions).toMatchObject({ m0: "first", m1: "last", m2: "single" });
	});

	test("a message appended after mount is new; the first ones are not", async () => {
		const seen: Record<string, boolean> = {};
		const renderMessage = ({ message, isNew }: { message: Chat; isNew: boolean }): ReactElement => {
			seen[message.id] = isNew;
			return <Text>{message.text}</Text>;
		};
		const view = await mount(<Scroller renderMessage={renderMessage} />);
		expect(seen.m0).toBe(false);
		await view.rerender(<Scroller messages={[...MESSAGES, chat(3)]} renderMessage={renderMessage} />);
		expect(seen.m3).toBe(true);
		expect(seen.m0).toBe(false);
	});

	test("draws a date separator as a header", async () => {
		await mount(<Scroller formatDate={() => "Monday"} />);
		expect(screen.getByRole("header", { name: "Monday" })).toBeOnTheScreen();
	});

	test("separateDates={false} draws no separator", async () => {
		await mount(<Scroller formatDate={() => "Monday"} separateDates={false} />);
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
	});

	test("the unread divider is a header above the first unread message", async () => {
		await mount(<Scroller firstUnreadKey="m1" separateDates={false} />);
		expect(screen.getByRole("header", { name: "2 new messages" })).toBeOnTheScreen();
	});

	test("shows ListEmptyComponent with no messages", async () => {
		await mount(<Scroller ListEmptyComponent={<Text>Say hello</Text>} messages={[]} />);
		expect(screen.getByText("Say hello")).toBeOnTheScreen();
	});

	test("shows the loading row only while an older page loads", async () => {
		const view = await mount(<Scroller hasOlder isLoadingOlder={false} />);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
		await view.rerender(<Scroller hasOlder isLoadingOlder />);
		expect(screen.getByRole("progressbar", { name: "Loading older messages" })).toBeOnTheScreen();
		await view.rerender(<Scroller hasOlder={false} isLoadingOlder />);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
	});

	test("onScrollerReady hands over a controller", async () => {
		const onScrollerReady = jest.fn();
		await mount(<Scroller onScrollerReady={onScrollerReady} />);
		expect(onScrollerReady).toHaveBeenCalledTimes(1);
		const controller = onScrollerReady.mock.calls[0]?.[0] as MessageScrollerController;
		expect(controller.isAtEnd()).toBe(true);
	});

	test("onAtEndChange reports the starting position", async () => {
		const onAtEndChange = jest.fn();
		await mount(<Scroller onAtEndChange={onAtEndChange} />);
		expect(onAtEndChange).toHaveBeenCalledWith(true);
	});
});

describe("MessageScroller.JumpButton", () => {
	test("is out of the accessibility tree while the reader is at the end", async () => {
		await mount(<Scroller />);
		expect(screen.queryByRole("button", { name: "Jump to latest" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Jump to latest", includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("accepts a custom label", async () => {
		await renderWithProviders(
			<Scroller>
				<MessageScroller.List />
				<MessageScroller.JumpButton label="Back to now" />
			</Scroller>
		);
		expect(screen.getByRole("button", { name: "Back to now", includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("custom onPress replaces the scroll", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Scroller>
				<MessageScroller.JumpButton onPress={onPress} />
			</Scroller>
		);
		await fireEvent(
			screen.getByRole("button", { name: "Jump to latest", includeHiddenElements: true }),
			"accessibilityTap"
		);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("outside a scroller it throws its documented error", async () => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<MessageScroller.JumpButton />)).rejects.toThrow(
				"MessageScroller.JumpButton must be rendered inside a <MessageScroller> or <MessageScroller.Provider>."
			);
		} finally {
			console.error = original;
		}
	});
});

describe("MessageScroller.List", () => {
	test("outside a scroller it throws its documented error", async () => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<MessageScroller.List />)).rejects.toThrow(
				"MessageScroller.List must be rendered inside a"
			);
		} finally {
			console.error = original;
		}
	});
});

describe("MessageScroller parts", () => {
	test("DateSeparator is a labelled header", async () => {
		await renderWithProviders(<MessageScroller.DateSeparator label="Today" />);
		expect(screen.getByRole("header", { name: "Today" })).toBeOnTheScreen();
	});

	test("UnreadDivider defaults its text from the count and takes a label", async () => {
		const view = await renderWithProviders(<MessageScroller.UnreadDivider count={1} />);
		expect(screen.getByRole("header", { name: "1 new message" })).toBeOnTheScreen();
		await view.rerender(<MessageScroller.UnreadDivider count={4} label="Unread" />);
		expect(screen.getByRole("header", { name: "Unread" })).toBeOnTheScreen();
	});

	test("LoadingOlder is a progress indicator with a replaceable label", async () => {
		const view = await renderWithProviders(<MessageScroller.LoadingOlder />);
		expect(screen.getByRole("progressbar", { name: "Loading older messages" })).toBeOnTheScreen();
		await view.rerender(<MessageScroller.LoadingOlder label="Fetching" />);
		expect(screen.getByRole("progressbar", { name: "Fetching" })).toBeOnTheScreen();
	});
});

describe("MessageScroller.Provider with useMessageScrollerState", () => {
	let captured: MessageScrollerContextValue | undefined;

	function Harness({ keys }: { keys: readonly string[] }): ReactElement {
		const scroller = useMessageScrollerState({ keys, isOwn: (key) => key === "own" });
		captured = scroller;
		return (
			<MessageScroller.Provider value={scroller}>
				<MessageScroller.JumpButton />
			</MessageScroller.Provider>
		);
	}

	async function scrollTo(offset: number): Promise<void> {
		await act(async () => {
			const scroller = captured;
			if (!scroller) return;
			scroller.sharedValues.scrollOffset.value = offset;
		});
	}

	/**
	 * The scroller's own reaction writes `isJumpVisible`, and Reanimated's Jest runtime does not chain
	 * a reaction off a write another reaction made, so the button never hears it. Writing the value
	 * from the test is what the reaction does on a device.
	 */
	async function setJumpVisible(visible: boolean): Promise<void> {
		await waitFor(async () => {
			await act(async () => {
				const scroller = captured;
				if (scroller) scroller.isJumpVisible.value = !visible;
			});
			await act(async () => {
				const scroller = captured;
				if (scroller) scroller.isJumpVisible.value = visible;
			});
			const shown = screen.queryByRole("button", { name: /^Jump to latest/ }) !== null;
			expect(shown).toBe(visible);
		});
	}

	async function measure(): Promise<void> {
		await act(async () => {
			const scroller = captured;
			if (!scroller) return;
			scroller.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 400 } } } as never);
			scroller.onContentSizeChange(300, 2000);
			scroller.sharedValues.scrollOffset.value = 1600;
		});
	}

	test("counts arrivals while the reader is away, and clears the count on return", async () => {
		const view = await renderWithProviders(<Harness keys={["a", "b"]} />);
		await measure();
		expect(captured?.state.isAtEnd).toBe(true);

		await scrollTo(0);
		expect(captured?.state.isAtEnd).toBe(false);
		await view.rerender(<Harness keys={["a", "b", "c"]} />);
		expect(captured?.state.unreadCount).toBe(1);
		await setJumpVisible(true);
		expect(await screen.findByRole("button", { name: "Jump to latest, 1 unread" })).toBeOnTheScreen();

		await scrollTo(1600);
		expect(captured?.state.isAtEnd).toBe(true);
		expect(captured?.state.unreadCount).toBe(0);
		await setJumpVisible(false);
		expect(screen.queryByRole("button", { name: /^Jump to latest/ })).not.toBeOnTheScreen();
	});

	test("the viewer's own message is never unread", async () => {
		const view = await renderWithProviders(<Harness keys={["a", "b"]} />);
		await measure();
		await scrollTo(0);
		await view.rerender(<Harness keys={["a", "b", "own"]} />);
		expect(captured?.state.unreadCount).toBe(0);
	});

	test("the shown button scrolls to the end through the controller", async () => {
		await renderWithProviders(<Harness keys={["a", "b"]} />);
		await measure();
		await scrollTo(0);
		await setJumpVisible(true);
		const scrollToEnd = jest.fn(async () => undefined);
		const scroller = captured;
		if (scroller) scroller.listRef.current = { scrollToEnd } as never;
		await fireEvent(await screen.findByRole("button", { name: "Jump to latest" }), "accessibilityTap");
		expect(scrollToEnd).toHaveBeenCalledTimes(1);
	});
});
