import { describe, expect, test } from "bun:test";
import { COMPONENTS } from "./components";
import { componentsItemList, LLMS_PREAMBLE, ORGANIZATION } from "./structured-data";

describe("ORGANIZATION", () => {
	test("names a logo and the profiles a search engine can tie together", () => {
		expect(ORGANIZATION["@type"]).toBe("Organization");
		expect(ORGANIZATION.logo).toMatchObject({ "@type": "ImageObject", url: "https://ui.delacour.co.nz/icon-512.png" });
		expect(ORGANIZATION.sameAs).toContain("https://github.com/delacournz/delacour-ui");
		expect(ORGANIZATION.sameAs).toContain("https://www.npmjs.com/package/@delacour/react-native-ui");
	});
});

describe("componentsItemList", () => {
	test("lists every component, in order, linked to its docs page", () => {
		const list = componentsItemList();
		const items = list.itemListElement as { position: number; item: { name: string; url: string } }[];

		expect(list["@type"]).toBe("ItemList");
		expect(items).toHaveLength(COMPONENTS.length);
		expect(items[0]?.position).toBe(1);
		expect(items[0]?.item.url).toBe(`https://ui.delacour.co.nz/docs/native/components/${COMPONENTS[0]?.slug}`);
	});
});

describe("LLMS_PREAMBLE", () => {
	test("opens with the llms.txt H1 and blockquote summary", () => {
		expect(LLMS_PREAMBLE).toStartWith("# Delacour UI\n\n> ");
		expect(LLMS_PREAMBLE).toMatch(/shadcn\/ui for React Native/);
	});

	test("tells an agent the commands to use rather than writing components from memory", () => {
		expect(LLMS_PREAMBLE).toContain("npx delacour@latest add");
		expect(LLMS_PREAMBLE).toContain("npx delacour@latest mcp");
	});
});
