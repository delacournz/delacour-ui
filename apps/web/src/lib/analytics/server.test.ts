import { describe, expect, test } from "bun:test";
import { isbot } from "isbot";
import { agentFetch, SERVER_USER_AGENT, serverEventBody } from "./server";

describe("agentFetch", () => {
	test("names the llms files", () => {
		expect(agentFetch("/llms.txt")).toBe("llms");
		expect(agentFetch("/llms-full.txt")).toBe("llms");
	});

	test("names a docs page's markdown twin", () => {
		expect(agentFetch("/docs/native/components/button.md")).toBe("markdown");
	});

	test("names a skill file", () => {
		expect(agentFetch("/skills/delacour-ui/SKILL.md")).toBe("skill");
	});

	test("ignores everything a browser renders", () => {
		expect(agentFetch("/")).toBeNull();
		expect(agentFetch("/docs/native/components/button")).toBeNull();
		expect(agentFetch("/api/search")).toBeNull();
		expect(agentFetch("/favicon.svg")).toBeNull();
	});
});

describe("serverEventBody", () => {
	const umami = { kind: "on", host: "https://analytics.example.com", websiteId: "site-id" } as const;

	test("is the shape Umami's /api/send takes, carrying the caller's agent as data", () => {
		const request = new Request("https://ui.delacour.co.nz/llms.txt?x=1", {
			headers: { "user-agent": "ClaudeBot/1.0", "accept-language": "en-NZ,en;q=0.9" },
		});

		expect(serverEventBody(umami, request, "llms")).toEqual({
			type: "event",
			payload: {
				website: "site-id",
				hostname: "ui.delacour.co.nz",
				url: "/llms.txt",
				language: "en-NZ",
				name: "agent-fetch",
				data: { path: "/llms.txt", kind: "llms", agent: "ClaudeBot/1.0" },
			},
		});
	});

	test("truncates a long user agent and tolerates a missing one", () => {
		const long = new Request("https://ui.delacour.co.nz/llms.txt", { headers: { "user-agent": "x".repeat(500) } });
		const none = new Request("https://ui.delacour.co.nz/llms.txt");

		expect(String(serverEventBody(umami, long, "llms").payload.data.agent).length).toBe(200);
		expect(serverEventBody(umami, none, "llms").payload.data.agent).toBe("unknown");
		expect(serverEventBody(umami, none, "llms").payload.language).toBe("");
	});
});

describe("the user agent the server sends as", () => {
	/**
	 * Umami drops any request whose user agent `isbot` matches — which is every
	 * agent this event exists to count. The caller's agent rides in `data`
	 * instead, and the header is one Umami lets through.
	 */
	test("is not one Umami's bot check drops", () => {
		expect(isbot(SERVER_USER_AGENT)).toBe(false);
	});
});
