import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Support } from "./support";

const ACTIVATE = { nativeEvent: { actionName: "activate" } };

const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});

beforeEach(() => {
	announce.mockClear();
});

describe("Support.Status and availability", () => {
	test("the root's availability is spoken first, then the caller's wording", async () => {
		await renderWithProviders(
			<Support availability="online">
				<Support.Status replyTime="Typically replies in under an hour" />
			</Support>
		);
		expect(screen.getByLabelText("Online. Typically replies in under an hour")).toBeOnTheScreen();
	});

	test("defaults to offline with no availability, and a part's own availability overrides the root", async () => {
		await renderWithProviders(
			<Support>
				<Support.Status />
				<Support.Status availability="online" replyTime="Here now" />
			</Support>
		);
		expect(screen.getByLabelText("Offline")).toBeOnTheScreen();
		expect(screen.getByLabelText("Online. Here now")).toBeOnTheScreen();
	});

	test("Agent works with no Support root, defaulting to offline", async () => {
		await renderWithProviders(<Support.Agent name="Omar Haddad" title="Support" />);
		expect(screen.getByLabelText("Omar Haddad, Support, offline")).toBeOnTheScreen();
	});
});

describe("Support.Channel", () => {
	test("calls onPress on activation and announces a button", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Channels title="Get in touch">
				<Support.Channel accessibilityLabel="Chat" icon={<Text>i</Text>} label="Chat" onPress={onPress} />
			</Support.Channels>
		);
		expect(screen.getByRole("header", { name: "Get in touch" })).toBeOnTheScreen();
		const row = screen.getByRole("button", { name: "Chat" });
		await fireEvent(row, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a shut channel stays on screen, announced disabled, and ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Channels>
				<Support.Channel
					accessibilityLabel="Call us"
					icon={<Text>i</Text>}
					isDisabled
					label="Call us"
					onPress={onPress}
				/>
			</Support.Channels>
		);
		const row = screen.getByLabelText("Call us");
		expect(row).toBeDisabled();
		await fireEvent(row, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});
});

describe("Support.Conversation", () => {
	test("reads the row as one sentence, dot and status included", async () => {
		await renderWithProviders(
			<Support.Conversations title="Your requests">
				<Support.Conversation
					preview="We've issued the refund."
					reference="#4821"
					status="solved"
					timestamp="2h"
					title="Refund for order"
					unread
				/>
			</Support.Conversations>
		);
		expect(
			screen.getByLabelText("Refund for order, #4821, solved, unread reply, 2h. We've issued the refund.")
		).toBeOnTheScreen();
	});

	test("unread wins over updated, and pending is labelled as waiting on the reader", async () => {
		await renderWithProviders(
			<Support.Conversations>
				<Support.Conversation status="pending" title="Both" unread updated />
				<Support.Conversation status="open" title="Moved" updated />
			</Support.Conversations>
		);
		expect(screen.getByLabelText(/^Both, waiting on you, unread/i)).toBeOnTheScreen();
		expect(screen.getByLabelText(/^Moved, open, updated/i)).toBeOnTheScreen();
	});

	test("onPress fires on activation and not when disabled", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Conversations>
				<Support.Conversation onPress={onPress} status="open" title="Open one" />
				<Support.Conversation isDisabled onPress={onPress} status="closed" title="Closed one" />
			</Support.Conversations>
		);
		await fireEvent(screen.getByLabelText(/^Open one/), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
		const disabled = screen.getByLabelText(/^Closed one/);
		expect(disabled).toBeDisabled();
		await fireEvent(disabled, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});

describe("Support.Article and Support.Ticket", () => {
	test("an article is a button when it has onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Articles title="Help centre">
				<Support.Article collection="Billing" onPress={onPress} title="Change your plan" />
			</Support.Articles>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(screen.getByText("Billing")).toBeOnTheScreen();
	});

	test("a ticket shows its status badge and opens details on press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Ticket onPress={onPress} reference="#4821" status="pending" title="Refund for order" />
		);
		expect(screen.getByText("Waiting on you")).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a ticket with no onPress is not interactive", async () => {
		await renderWithProviders(<Support.Ticket status="solved" title="Refund" />);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});
});

describe("Support.Topics", () => {
	function Group({
		onValueChange,
		...props
	}: {
		onValueChange?: (value: string) => void;
		value?: string | null;
		defaultValue?: string | null;
	}) {
		return (
			<Support.Topics onValueChange={onValueChange} title="What is it about?" {...props}>
				<Support.Topic description="Invoices, refunds and plans" label="Billing" value="billing" />
				<Support.Topic label="Account" value="account" />
				<Support.Topic isDisabled label="Legal" value="legal" />
			</Support.Topics>
		);
	}

	test("is a labelled radiogroup of radios named with their description", async () => {
		await renderWithProviders(<Group />);
		expect(screen.getByLabelText("What is it about?").props.accessibilityRole).toBe("radiogroup");
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		const billing = screen.getByRole("radio", { name: "Billing. Invoices, refunds and plans" });
		expect(billing).not.toBeChecked();
	});

	test("uncontrolled: defaultValue seeds it and a press moves the selection and reports it", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Group defaultValue="billing" onValueChange={onValueChange} />);
		expect(screen.getByRole("radio", { name: /^Billing/ })).toBeChecked();

		await fireEvent(screen.getByRole("radio", { name: "Account" }), "accessibilityTap");
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("account");
		expect(screen.getByRole("radio", { name: "Account" })).toBeChecked();
		expect(screen.getByRole("radio", { name: /^Billing/ })).not.toBeChecked();
	});

	test("pressing the selected topic keeps it and reports nothing", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Group defaultValue="account" onValueChange={onValueChange} />);
		await fireEvent(screen.getByRole("radio", { name: "Account" }), "accessibilityAction", ACTIVATE);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole("radio", { name: "Account" })).toBeChecked();
	});

	test("controlled: reports the pick and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Group onValueChange={onValueChange} value="billing" />);
		await fireEvent(screen.getByRole("radio", { name: "Account" }), "accessibilityTap");
		expect(onValueChange).toHaveBeenCalledWith("account");
		expect(screen.getByRole("radio", { name: "Account" })).not.toBeChecked();

		await view.rerender(<Group onValueChange={onValueChange} value="account" />);
		expect(screen.getByRole("radio", { name: "Account" })).toBeChecked();
		expect(screen.getByRole("radio", { name: /^Billing/ })).not.toBeChecked();
	});

	test("a disabled topic is announced disabled and cannot be picked", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Group onValueChange={onValueChange} />);
		const legal = screen.getByRole("radio", { name: "Legal" });
		expect(legal).toBeDisabled();
		await fireEvent(legal, "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
		expect(legal).not.toBeChecked();
	});

	test("a Topic outside Support.Topics throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(renderWithProviders(<Support.Topic label="Billing" value="billing" />)).rejects.toThrow(
			"useSupportTopics must be called inside a <Support.Topics>."
		);
		spy.mockRestore();
	});
});

describe("Support.Agent", () => {
	test("is one labelled element, and typing replaces the status line and announces once", async () => {
		const view = await renderWithProviders(
			<Support availability="online">
				<Support.Agent name="Omar Haddad" title="Support" typingTestID="dots" />
			</Support>
		);
		expect(screen.getByLabelText("Omar Haddad, Support, online")).toBeOnTheScreen();
		expect(screen.queryByTestId("dots", { hidden: true })).not.toBeOnTheScreen();
		expect(announce).not.toHaveBeenCalled();

		await view.rerender(
			<Support availability="online">
				<Support.Agent name="Omar Haddad" title="Support" typing typingTestID="dots" />
			</Support>
		);
		expect(screen.getByLabelText("Omar Haddad is typing")).toBeOnTheScreen();
		expect(screen.getByText("Omar is typing")).toBeOnTheScreen();
		expect(screen.getByTestId("dots", { hidden: true })).toBeOnTheScreen();
		expect(announce).toHaveBeenCalledTimes(1);
		expect(announce).toHaveBeenCalledWith("Omar Haddad is typing");
	});
});

describe("Support.Handoff", () => {
	test("announces the change of hands on mount", async () => {
		await renderWithProviders(<Support.Handoff>You were passed to Omar.</Support.Handoff>);
		expect(screen.getByLabelText("You were passed to Omar.")).toBeOnTheScreen();
		expect(announce).toHaveBeenCalledWith("You were passed to Omar.");
	});

	test("announce={false} stays silent for a handoff that is history", async () => {
		await renderWithProviders(<Support.Handoff announce={false}>You were passed to Omar.</Support.Handoff>);
		expect(screen.getByText("You were passed to Omar.")).toBeOnTheScreen();
		expect(announce).not.toHaveBeenCalled();
	});
});

describe("Support.Replies and Support.Reply", () => {
	test("each reply is a button that calls its own onPress", async () => {
		const resolve = jest.fn();
		const escalate = jest.fn();
		await renderWithProviders(
			<Support.Replies>
				<Support.Reply label="That fixed it" onPress={resolve} />
				<Support.Reply escalates label="Talk to a person" onPress={escalate} />
			</Support.Replies>
		);
		await fireEvent(screen.getByRole("button", { name: "That fixed it" }), "accessibilityTap");
		expect(resolve).toHaveBeenCalledTimes(1);
		expect(escalate).not.toHaveBeenCalled();

		await fireEvent(screen.getByRole("button", { name: "Talk to a person" }), "accessibilityTap");
		expect(escalate).toHaveBeenCalledTimes(1);
	});

	test("only the escalating reply carries the hint", async () => {
		await renderWithProviders(
			<Support.Replies>
				<Support.Reply label="That fixed it" onPress={() => {}} />
				<Support.Reply escalates label="Talk to a person" onPress={() => {}} />
			</Support.Replies>
		);
		expect(screen.getByRole("button", { name: "Talk to a person" }).props.accessibilityHint).toBe("Talk to a person");
		expect(screen.getByRole("button", { name: "That fixed it" }).props.accessibilityHint).toBeUndefined();
	});

	test("a disabled reply ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Replies>
				<Support.Reply isDisabled label="Later" onPress={onPress} />
			</Support.Replies>
		);
		const reply = screen.getByRole("button", { name: "Later" });
		expect(reply).toBeDisabled();
		await fireEvent(reply, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});
});

describe("Support.Resolution and Support.Note", () => {
	test("is a labelled group that leaves the caller's control its own role", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Support.Resolution question="Did that help?">
				<Button onPress={onPress}>Yes</Button>
			</Support.Resolution>
		);
		expect(screen.getByText("Did that help?")).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Yes" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a note renders its text", async () => {
		await renderWithProviders(
			<Support availability="away">
				<Support.Note>Replies may take a day.</Support.Note>
			</Support>
		);
		expect(screen.getByText("Replies may take a day.")).toBeOnTheScreen();
	});
});
