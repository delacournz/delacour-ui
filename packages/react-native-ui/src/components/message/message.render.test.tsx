import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text as RNText } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Message, useMessage } from "./index";
import type { MessageStatus } from "./message.types";
import { MessageBubble } from "./message-bubble";

const LABEL = "Aria, 9:41 AM, Are we still on for tonight?";
const SENT_AT = new Date(2026, 0, 5, 9, 41);

function Conversation({
	direction = "incoming",
	position = "single",
	status,
	onPress,
	onLongPress,
	onRetry,
	isCompound,
	accessibilityLabel,
	isSelected,
}: {
	direction?: "incoming" | "outgoing";
	position?: "single" | "first" | "middle" | "last";
	status?: MessageStatus;
	onPress?: () => void;
	onLongPress?: () => void;
	onRetry?: () => void;
	isCompound?: boolean;
	accessibilityLabel?: string;
	isSelected?: boolean;
}) {
	return (
		<Message
			accessibilityLabel={accessibilityLabel}
			direction={direction}
			isCompound={isCompound}
			isSelected={isSelected}
			onLongPress={onLongPress}
			onPress={onPress}
			onRetry={onRetry}
			position={position}
			status={status}
		>
			<Message.Avatar>
				<RNText>AV</RNText>
			</Message.Avatar>
			<Message.Header>
				<Message.Author>Aria</Message.Author>
				<Message.Timestamp date={SENT_AT} format={() => "9:41 AM"} />
			</Message.Header>
			<Message.Bubble>
				<Message.Text>Are we still on for tonight?</Message.Text>
			</Message.Bubble>
			<Message.Status />
		</Message>
	);
}

async function silenceConsoleError<T>(run: () => Promise<T>): Promise<T> {
	const original = console.error;
	console.error = () => undefined;
	try {
		return await run();
	} finally {
		console.error = original;
	}
}

let announce: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;

beforeEach(() => {
	announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
	announce.mockClear();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Message", () => {
	test("is one text element whose label is composed from its parts", async () => {
		await renderWithProviders(<Conversation />);
		const message = screen.getByRole("text", { name: LABEL });
		expect(message).toBeOnTheScreen();
		expect(message).toHaveAccessibilityValue({});
	});

	test("an outgoing message reads as You and carries its receipt", async () => {
		await renderWithProviders(<Conversation direction="outgoing" status={{ type: "read" }} />);
		expect(screen.getByLabelText("You, 9:41 AM, Are we still on for tonight?, Read")).toBeOnTheScreen();
	});

	test("accessibilityLabel replaces the composed label", async () => {
		await renderWithProviders(<Conversation accessibilityLabel="Custom" />);
		expect(screen.getByLabelText("Custom")).toBeOnTheScreen();
		expect(screen.queryByLabelText(/Aria/)).not.toBeOnTheScreen();
	});

	test("the label follows its parts when their words change", async () => {
		const view = await renderWithProviders(
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Text>First</Message.Text>
				</Message.Bubble>
			</Message>
		);
		expect(screen.getByLabelText("First")).toBeOnTheScreen();
		await view.rerender(
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Text>Second</Message.Text>
				</Message.Bubble>
			</Message>
		);
		expect(screen.getByLabelText("Second")).toBeOnTheScreen();
	});

	test("isSelected is announced as selected", async () => {
		await renderWithProviders(<Conversation isSelected />);
		expect(screen.getByLabelText(LABEL)).toBeSelected();
	});

	test("is a button only with onPress", async () => {
		const view = await renderWithProviders(<Conversation />);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		await view.rerender(<Conversation onPress={jest.fn()} />);
		expect(screen.getByRole("button", { name: /Are we still on for tonight/ })).toBeOnTheScreen();
	});

	test("activate calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Conversation onPress={onPress} />);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("longpress and more both call onLongPress", async () => {
		const onLongPress = jest.fn();
		await renderWithProviders(<Conversation onLongPress={onLongPress} />);
		const message = screen.getByLabelText(LABEL);
		await fireEvent(message, "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
		await fireEvent(message, "accessibilityAction", { nativeEvent: { actionName: "more" } });
		expect(onLongPress).toHaveBeenCalledTimes(2);
	});

	test("offers only the actions it has handlers for", async () => {
		const view = await renderWithProviders(<Conversation />);
		expect(screen.getByLabelText(LABEL).props.accessibilityActions).toBeUndefined();

		await view.rerender(<Conversation onLongPress={jest.fn()} onPress={jest.fn()} />);
		const names = screen.getByRole("button").props.accessibilityActions.map((action: { name: string }) => action.name);
		expect(names).toEqual(["activate", "longpress", "more"]);
	});

	test("an action without a handler does nothing", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Conversation onPress={onPress} />);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "retry" } });
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
		expect(onPress).not.toHaveBeenCalled();
	});

	test("retry is an action only on a failed outgoing message, and calls onRetry", async () => {
		const onRetry = jest.fn();
		const view = await renderWithProviders(
			<Conversation direction="outgoing" onRetry={onRetry} status={{ type: "sent" }} />
		);
		expect(screen.getByLabelText(/Are we still/).props.accessibilityActions).toBeUndefined();

		await view.rerender(<Conversation direction="outgoing" onRetry={onRetry} status={{ type: "failed" }} />);
		const message = screen.getByLabelText(/Are we still/);
		expect(message.props.accessibilityActions).toEqual([{ name: "retry", label: "Retry" }]);
		await fireEvent(message, "accessibilityAction", { nativeEvent: { actionName: "retry" } });
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	test("isCompound leaves the parts as separate elements", async () => {
		await renderWithProviders(<Conversation isCompound onPress={jest.fn()} />);
		expect(screen.queryByLabelText(LABEL)).not.toBeOnTheScreen();
		expect(screen.getByText("Aria")).toBeOnTheScreen();
		expect(screen.getByText("Are we still on for tonight?")).toBeOnTheScreen();
	});

	test("in a compound message the bubble is its own button", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Conversation isCompound onPress={onPress} />);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("the avatar shows only beside the last bubble of an incoming run", async () => {
		const view = await renderWithProviders(<Conversation position="first" />);
		expect(screen.queryByText("AV")).not.toBeOnTheScreen();
		await view.rerender(<Conversation position="middle" />);
		expect(screen.queryByText("AV")).not.toBeOnTheScreen();
		await view.rerender(<Conversation position="last" />);
		expect(screen.getByText("AV", { includeHiddenElements: true })).toBeOnTheScreen();
		await view.rerender(<Conversation position="single" />);
		expect(screen.getByText("AV", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("an outgoing message has no avatar gutter", async () => {
		await renderWithProviders(<Conversation direction="outgoing" position="last" />);
		expect(screen.queryByText("AV", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("the gutter is hidden from assistive technology", async () => {
		await renderWithProviders(<Conversation position="last" />);
		expect(screen.queryByText("AV")).not.toBeOnTheScreen();
		expect(screen.getByText("AV", { includeHiddenElements: true })).toBeOnTheScreen();
	});
});

describe("Message.Status", () => {
	test.each([
		[{ type: "sending" }, "Sending"],
		[{ type: "sent" }, "Sent"],
		[{ type: "delivered" }, "Delivered"],
		[{ type: "read" }, "Read"],
		[{ type: "failed" }, "Failed to send"],
		[{ type: "failed", reason: "No signal" }, "Failed: No signal"],
	] satisfies [MessageStatus, string][])("draws %j as %s", async (status, words) => {
		await renderWithProviders(<Conversation direction="outgoing" status={status} />);
		expect(screen.getByText(words)).toBeOnTheScreen();
	});

	test("draws nothing mid-run or on an incoming message", async () => {
		const view = await renderWithProviders(
			<Conversation direction="outgoing" position="first" status={{ type: "sent" }} />
		);
		expect(screen.queryByText("Sent")).not.toBeOnTheScreen();
		await view.rerender(<Conversation direction="incoming" position="last" status={{ type: "sent" }} />);
		expect(screen.queryByText("Sent")).not.toBeOnTheScreen();
	});

	test("label replaces the receipt's words, drawn and spoken", async () => {
		await renderWithProviders(
			<Message direction="outgoing" status={{ type: "read" }}>
				<Message.Bubble>
					<Message.Text>Hi</Message.Text>
				</Message.Bubble>
				<Message.Status label="Seen 9:42" />
			</Message>
		);
		expect(screen.getByText("Seen 9:42")).toBeOnTheScreen();
		expect(screen.getByLabelText("You, Hi, Seen 9:42")).toBeOnTheScreen();
	});

	test("Retry shows on a failed message with onRetry and calls it", async () => {
		const onRetry = jest.fn();
		await renderWithProviders(
			<Conversation direction="outgoing" onRetry={onRetry} status={{ type: "failed" }} isCompound />
		);
		await fireEvent(screen.getByRole("button", { name: "Retry" }), "accessibilityTap");
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	test("no Retry control without onRetry or when not failed", async () => {
		const view = await renderWithProviders(
			<Conversation direction="outgoing" isCompound status={{ type: "failed" }} />
		);
		expect(screen.queryByText("Retry")).not.toBeOnTheScreen();
		await view.rerender(<Conversation direction="outgoing" isCompound onRetry={jest.fn()} status={{ type: "sent" }} />);
		expect(screen.queryByText("Retry")).not.toBeOnTheScreen();
	});

	test("a message that mounts already failed is not announced", async () => {
		await renderWithProviders(<Conversation direction="outgoing" status={{ type: "failed" }} />);
		expect(announce).not.toHaveBeenCalled();
	});

	test("announces a turn into failed once, and stays quiet otherwise", async () => {
		const view = await renderWithProviders(<Conversation direction="outgoing" status={{ type: "sending" }} />);
		await view.rerender(<Conversation direction="outgoing" status={{ type: "sent" }} />);
		expect(announce).not.toHaveBeenCalled();

		await view.rerender(<Conversation direction="outgoing" status={{ type: "failed" }} />);
		expect(announce).toHaveBeenCalledTimes(1);
		expect(announce).toHaveBeenCalledWith("Failed to send");
	});
});

describe("Message.Typing", () => {
	test("is read as the author typing, in a polite live region", async () => {
		await renderWithProviders(
			<Message direction="incoming">
				<Message.Header>
					<Message.Author>Aria</Message.Author>
				</Message.Header>
				<Message.Typing />
			</Message>
		);
		expect(screen.getByLabelText("Aria is typing")).toBeOnTheScreen();
	});

	test("without an author it is read as Typing", async () => {
		await renderWithProviders(
			<Message direction="incoming">
				<Message.Typing />
			</Message>
		);
		expect(screen.getByLabelText("Typing")).toBeOnTheScreen();
	});
});

describe("Message parts", () => {
	test("Message.Timestamp formats with the given format function", async () => {
		const format = jest.fn((date: Date) => `at ${date.getHours()}`);
		await renderWithProviders(
			<Message direction="incoming">
				<Message.Header>
					<Message.Timestamp date={SENT_AT} format={format} />
				</Message.Header>
			</Message>
		);
		expect(screen.getByText("at 9")).toBeOnTheScreen();
		expect(format).toHaveBeenCalledWith(SENT_AT);
	});

	test("Message.Reactions renders every chip", async () => {
		await renderWithProviders(
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Text>Hi</Message.Text>
				</Message.Bubble>
				<Message.Reactions>
					<RNText>one</RNText>
					<RNText>two</RNText>
				</Message.Reactions>
			</Message>
		);
		expect(screen.getByText("one", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("two", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("Message.Actions renders its controls", async () => {
		await renderWithProviders(
			<Message direction="incoming" isCompound>
				<Message.Bubble>
					<Message.Text>Hi</Message.Text>
				</Message.Bubble>
				<Message.Actions>
					<RNText>Reply</RNText>
				</Message.Actions>
			</Message>
		);
		expect(screen.getByText("Reply")).toBeOnTheScreen();
	});

	test("Message.Attachments renders its children", async () => {
		await renderWithProviders(
			<Message direction="incoming">
				<Message.Bubble isMedia>
					<Message.Attachments>
						<RNText>photo.png</RNText>
					</Message.Attachments>
				</Message.Bubble>
			</Message>
		);
		expect(screen.getByText("photo.png", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("useMessage reads the enclosing message", async () => {
		function Probe() {
			const message = useMessage();
			return <RNText>{`${message.direction}:${message.position}`}</RNText>;
		}
		await renderWithProviders(
			<Message direction="outgoing" position="first">
				<Probe />
			</Message>
		);
		expect(screen.getByText("outgoing:first", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("useMessage outside a Message throws", async () => {
		function Probe() {
			useMessage();
			return null;
		}
		await silenceConsoleError(async () => {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useMessage must be called inside a <Message>.");
		});
	});

	test.each([
		["Message.Bubble", () => <MessageBubble />],
		["Message.Author", () => <Message.Author>Aria</Message.Author>],
		["Message.Text", () => <Message.Text>Hi</Message.Text>],
		["Message.Timestamp", () => <Message.Timestamp date={SENT_AT} />],
		["Message.Status", () => <Message.Status />],
		["Message.Reactions", () => <Message.Reactions>{null}</Message.Reactions>],
		["Message.Actions", () => <Message.Actions />],
		["Message.Typing", () => <Message.Typing />],
		["Message.Avatar", () => <Message.Avatar />],
	])("%s outside a Message throws its documented error", async (name, part) => {
		await silenceConsoleError(async () => {
			await expect(renderWithProviders(part())).rejects.toThrow(`${name} must be rendered inside a <Message>.`);
		});
	});
});
