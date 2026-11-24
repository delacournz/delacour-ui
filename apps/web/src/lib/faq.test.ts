import { describe, expect, test } from "bun:test";
import { FAQ, faqJsonLd } from "./faq";
import { homeHead } from "./seo";

describe("FAQ", () => {
	test("answers the queries the landing page is meant to rank for", () => {
		const questions = FAQ.map((entry) => entry.question).join(" ");

		expect(questions).toMatch(/shadcn/i);
		expect(questions).toMatch(/Expo/);
		expect(questions).toMatch(/NativeWind/);
		expect(questions).toMatch(/agent/i);
	});

	test("every answer is plain text a search result can quote", () => {
		for (const entry of FAQ) {
			expect(entry.question.endsWith("?")).toBe(true);
			expect(entry.answer).not.toMatch(/[<>`*_[\]]/);
			expect(entry.answer.length).toBeLessThanOrEqual(400);
		}
	});

	test("the FAQPage marks up exactly the questions the page shows", () => {
		const page = faqJsonLd();
		const entities = page.mainEntity as { name: string; acceptedAnswer: { text: string } }[];

		expect(page["@type"]).toBe("FAQPage");
		expect(entities.map((entity) => entity.name)).toEqual(FAQ.map((entry) => entry.question));
		expect(entities.map((entity) => entity.acceptedAnswer.text)).toEqual(FAQ.map((entry) => entry.answer));
	});

	test("the landing page carries it", () => {
		const types = homeHead().meta.flatMap((tag) =>
			"script:ld+json" in tag && tag["script:ld+json"] ? [tag["script:ld+json"]["@type"]] : []
		);

		expect(types).toContain("FAQPage");
	});
});
