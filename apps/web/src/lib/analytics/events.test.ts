import { describe, expect, test } from "bun:test";
import { classifyLink, eventPayload } from "./events";

const PAGE = "https://ui.delacour.co.nz/docs/native/components/button";

describe("classifyLink", () => {
	test("calls a link to another host outbound, with its full URL", () => {
		expect(classifyLink("https://github.com/delacournz/delacour-ui", PAGE)).toEqual({
			name: "outbound",
			url: "https://github.com/delacournz/delacour-ui",
		});
	});

	test("calls a same-origin link to a file a download, by path", () => {
		expect(classifyLink("/llms.txt", PAGE)).toEqual({ name: "download", file: "/llms.txt" });
		expect(classifyLink("/docs/native/components/button.md", PAGE)).toEqual({
			name: "download",
			file: "/docs/native/components/button.md",
		});
		expect(classifyLink("https://ui.delacour.co.nz/skills/delacour-ui/SKILL.md?x=1", PAGE)).toEqual({
			name: "download",
			file: "/skills/delacour-ui/SKILL.md",
		});
	});

	test("ignores ordinary navigation, fragments and non-http schemes", () => {
		expect(classifyLink("/docs/native/components/switch", PAGE)).toBeNull();
		expect(classifyLink("#api-reference", PAGE)).toBeNull();
		expect(classifyLink("mailto:chris@delacour.co.nz", PAGE)).toBeNull();
		expect(classifyLink("dlc-ui-playground://components/button", PAGE)).toBeNull();
	});

	test("ignores an href that is not a URL at all", () => {
		expect(classifyLink("http://", PAGE)).toBeNull();
	});
});

describe("eventPayload", () => {
	test("splits an event into Umami's name and data", () => {
		expect(eventPayload({ name: "copy", what: "agent-prompt" })).toEqual({
			name: "copy",
			data: { what: "agent-prompt" },
		});
		expect(eventPayload({ name: "search", query: "bottom sheet", results: 3 })).toEqual({
			name: "search",
			data: { query: "bottom sheet", results: 3 },
		});
	});
});
