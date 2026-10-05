import { describe, expect, test } from "bun:test";
import {
	resolveAgentA11yLabel,
	resolveAgentStatusLine,
	resolveAvailabilityLabel,
	resolveConversationA11yLabel,
	resolveConversationDot,
	resolveNextTopic,
	resolveReplyA11yHint,
	resolveStatusA11yLabel,
	resolveTicketStatus,
	resolveTopicA11yLabel,
	resolveTypingOpacities,
	SUPPORT_AVAILABILITIES,
	SUPPORT_TICKET_STATUSES,
} from "./support.utils";

describe("resolveAvailabilityLabel", () => {
	test("caller wording wins", () => {
		expect(resolveAvailabilityLabel("online", "Typically replies in under an hour")).toBe(
			"Typically replies in under an hour"
		);
	});

	test("falls back to the availability's own label", () => {
		expect(resolveAvailabilityLabel("online")).toBe("We're online");
		expect(resolveAvailabilityLabel("away")).toBe("We're away");
		expect(resolveAvailabilityLabel("offline")).toBe("We're offline");
	});

	test("an empty or blank string is absent", () => {
		expect(resolveAvailabilityLabel("online", "")).toBe("We're online");
		expect(resolveAvailabilityLabel("away", "   ")).toBe("We're away");
	});
});

describe("resolveStatusA11yLabel", () => {
	test("leads with the availability, then the caller's wording", () => {
		expect(resolveStatusA11yLabel("away", "Back tomorrow")).toBe("Away. Back tomorrow");
		expect(resolveStatusA11yLabel("online", "Typically replies in under an hour")).toBe(
			"Online. Typically replies in under an hour"
		);
	});

	test("says the availability alone without wording", () => {
		expect(resolveStatusA11yLabel("online")).toBe("Online");
		expect(resolveStatusA11yLabel("offline", "")).toBe("Offline");
	});
});

describe("resolveTicketStatus", () => {
	test("maps every status to a label, a badge colour and whether the reader owes a reply", () => {
		expect(resolveTicketStatus("open")).toEqual({ label: "Open", color: "info", needsReader: false });
		expect(resolveTicketStatus("pending")).toEqual({ label: "Waiting on you", color: "warning", needsReader: true });
		expect(resolveTicketStatus("solved")).toEqual({ label: "Solved", color: "success", needsReader: false });
		expect(resolveTicketStatus("closed")).toEqual({ label: "Closed", color: "default", needsReader: false });
	});

	test("gives every status a distinct colour", () => {
		const colors = SUPPORT_TICKET_STATUSES.map((status) => resolveTicketStatus(status).color);
		expect(new Set(colors).size).toBe(SUPPORT_TICKET_STATUSES.length);
	});
});

describe("resolveConversationDot", () => {
	test("unread wins over updated", () => {
		expect(resolveConversationDot({ unread: true })).toBe("unread");
		expect(resolveConversationDot({ updated: true })).toBe("updated");
		expect(resolveConversationDot({ unread: true, updated: true })).toBe("unread");
		expect(resolveConversationDot({})).toBe("none");
		expect(resolveConversationDot({ unread: false, updated: false })).toBe("none");
	});
});

describe("resolveConversationA11yLabel", () => {
	test("says everything the row draws", () => {
		expect(
			resolveConversationA11yLabel({
				title: "Refund for order #4821",
				status: "solved",
				dot: "unread",
				timestamp: "2h",
				preview: "We've issued the refund.",
			})
		).toBe("Refund for order #4821, solved, unread reply, 2h. We've issued the refund.");
	});

	test("names an updated thread", () => {
		expect(resolveConversationA11yLabel({ title: "Login loop", status: "open", dot: "updated" })).toBe(
			"Login loop, open, updated"
		);
	});

	test("reads the reference after the title", () => {
		expect(
			resolveConversationA11yLabel({ title: "Login loop", reference: "#4821", status: "pending", dot: "none" })
		).toBe("Login loop, #4821, waiting on you");
	});

	test("omits absent segments without dangling punctuation", () => {
		expect(resolveConversationA11yLabel({ title: "Login loop", status: "closed", dot: "none" })).toBe(
			"Login loop, closed"
		);
		expect(
			resolveConversationA11yLabel({ title: "Login loop", status: "closed", dot: "none", preview: "Thanks!" })
		).toBe("Login loop, closed. Thanks!");
		expect(
			resolveConversationA11yLabel({ title: "Login loop", status: "closed", dot: "none", timestamp: "", preview: "" })
		).toBe("Login loop, closed");
	});

	test("does not double a full stop the preview already ends with", () => {
		expect(
			resolveConversationA11yLabel({ title: "A", status: "open", dot: "none", preview: "Done." }).endsWith("Done.")
		).toBe(true);
	});
});

describe("resolveAgentStatusLine", () => {
	test("typing replaces the status line, by first name, and is live", () => {
		expect(
			resolveAgentStatusLine({ name: "Khalid Abdi", role: "Support", availability: "online", typing: true })
		).toEqual({ text: "Khalid is typing", live: true });
	});

	test("otherwise role and availability", () => {
		expect(resolveAgentStatusLine({ name: "Khalid Abdi", role: "Support", availability: "away" })).toEqual({
			text: "Support · Away",
			live: false,
		});
	});

	test("availability alone without a role", () => {
		expect(resolveAgentStatusLine({ name: "Khalid Abdi", availability: "offline" })).toEqual({
			text: "Offline",
			live: false,
		});
		expect(resolveAgentStatusLine({ name: "Khalid", role: "", availability: "online" })).toEqual({
			text: "Online",
			live: false,
		});
	});

	test("a blank name still reads", () => {
		expect(resolveAgentStatusLine({ name: "  ", availability: "online", typing: true }).text).toBe("Someone is typing");
	});
});

describe("resolveAgentA11yLabel", () => {
	test("full name, role and availability", () => {
		expect(resolveAgentA11yLabel({ name: "Khalid Abdi", role: "Support", availability: "online" })).toBe(
			"Khalid Abdi, Support, online"
		);
		expect(resolveAgentA11yLabel({ name: "Khalid Abdi", availability: "away" })).toBe("Khalid Abdi, away");
	});

	test("typing is said by full name", () => {
		expect(resolveAgentA11yLabel({ name: "Khalid Abdi", role: "Support", availability: "online", typing: true })).toBe(
			"Khalid Abdi is typing"
		);
	});
});

describe("resolveTopicA11yLabel", () => {
	test("label then description", () => {
		expect(resolveTopicA11yLabel("Billing", "Invoices, refunds and plans")).toBe(
			"Billing. Invoices, refunds and plans"
		);
		expect(resolveTopicA11yLabel("Billing")).toBe("Billing");
		expect(resolveTopicA11yLabel("Billing", "")).toBe("Billing");
	});
});

describe("resolveNextTopic", () => {
	const options = { disabledValues: ["legal"] } as const;

	test("selects the pressed topic", () => {
		expect(resolveNextTopic(null, "billing", options)).toBe("billing");
		expect(resolveNextTopic("account", "billing", options)).toBe("billing");
	});

	test("a disabled topic leaves the selection alone", () => {
		expect(resolveNextTopic("account", "legal", options)).toBe("account");
		expect(resolveNextTopic(null, "legal", options)).toBeNull();
	});

	test("pressing the selected topic keeps it — a request needs a queue", () => {
		expect(resolveNextTopic("billing", "billing", options)).toBe("billing");
	});
});

describe("resolveReplyA11yHint", () => {
	test("only an escalating reply has a hint", () => {
		expect(resolveReplyA11yHint(true)).toBe("Talk to a person");
		expect(resolveReplyA11yHint(false)).toBeUndefined();
	});
});

describe("resolveTypingOpacities", () => {
	test("calm holds three stepped dots still", () => {
		expect(resolveTypingOpacities(true)).toEqual([1, 0.6, 0.3]);
	});

	test("moving starts every dot lit for the loop to take over", () => {
		expect(resolveTypingOpacities(false)).toEqual([1, 1, 1]);
	});
});

describe("the unions", () => {
	test("list every availability and status once", () => {
		expect(SUPPORT_AVAILABILITIES).toEqual(["online", "away", "offline"]);
		expect(SUPPORT_TICKET_STATUSES).toEqual(["open", "pending", "solved", "closed"]);
	});
});
