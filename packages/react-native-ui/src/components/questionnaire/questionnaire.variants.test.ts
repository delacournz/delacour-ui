import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { BUTTON_LABEL_SIZES, BUTTON_SIZES, BUTTON_VARIANTS } from "../button/button.variants";
import { CHECKBOX_COLORS, CHECKBOX_SIZES } from "../checkbox/checkbox.variants";
import { INPUT_SIZES, INPUT_VARIANTS } from "../input/input.variants";
import { PROGRESS_COLORS, PROGRESS_SIZES } from "../progress/progress.variants";
import { RADIO_SIZES, RADIO_VARIANTS } from "../radio/radio.variants";
import { RATING_SIZES } from "../rating/rating.variants";
import { STEPS_SIZES, STEPS_VARIANTS } from "../steps/steps.variants";
import { TEXT_SIZES, TEXT_VARIANTS } from "../text/text.variants";
import { TOGGLE_BUTTON_VARIANTS } from "../toggle-button/toggle-button.variants";
import {
	QUESTIONNAIRE_DEFAULT_SIZE,
	QUESTIONNAIRE_DEFAULT_VARIANT,
	QUESTIONNAIRE_PROGRESS_VARIANTS,
	QUESTIONNAIRE_SIZES,
	QUESTIONNAIRE_SLIDE_DISTANCE,
	QUESTIONNAIRE_TRANSITION_MS,
	QUESTIONNAIRE_VARIANTS,
	questionnaireVariants,
	resolveQuestionnaireAxes,
	resolveQuestionnaireFooterButtons,
	resolveQuestionnaireTestId,
} from "./questionnaire.variants";

const SLOTS = [
	"root",
	"header",
	"title",
	"progress",
	"count",
	"body",
	"question",
	"heading",
	"description",
	"choices",
	"other",
	"scale",
	"scaleLabels",
	"footer",
	"spacer",
	"action",
] as const;

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** Every class string the tv can emit, across both axes and both frames. */
function allClasses(): string[] {
	const out: string[] = [];
	for (const size of QUESTIONNAIRE_SIZES) {
		for (const isFramed of [true, false]) {
			const slots = questionnaireVariants({ isFramed, size });
			for (const slot of SLOTS) out.push(cls(slots[slot]()));
		}
	}
	return out;
}

/** The colour tokens a class string names — `bg-card` yields `card`. */
function colorTokens(value: string): string[] {
	return [...value.matchAll(/\b(?:bg|text|border|divide)-([a-z]+(?:-[a-z]+)*)\b/g)]
		.map((match) => match[1] ?? "")
		.filter((token) => !/^(?:xs|sm|md|lg|xl|\d?xl|center|left|right|input-\w+|button-\w+)$/.test(token));
}

describe("the theme reader", () => {
	test("finds both variants of the theme", () => {
		expect(declarationCount("primary")).toBe(2);
	});
});

describe("the axes", () => {
	test("size is the label half of Button's scale, and every control's", () => {
		expect([...QUESTIONNAIRE_SIZES]).toEqual([...BUTTON_LABEL_SIZES]);
		for (const sizes of [INPUT_SIZES, RADIO_SIZES, CHECKBOX_SIZES, RATING_SIZES, STEPS_SIZES, PROGRESS_SIZES]) {
			expect([...sizes]).toEqual([...QUESTIONNAIRE_SIZES]);
		}
	});

	test("variant is primary or secondary, the pair Input, Radio and Steps own", () => {
		expect([...QUESTIONNAIRE_VARIANTS]).toEqual(["primary", "secondary"]);
		expect([...QUESTIONNAIRE_VARIANTS]).toEqual([...INPUT_VARIANTS]);
		expect([...QUESTIONNAIRE_VARIANTS]).toEqual([...RADIO_VARIANTS]);
		expect([...QUESTIONNAIRE_VARIANTS]).toEqual([...STEPS_VARIANTS]);
	});

	test("defaults sit on the axes", () => {
		expect(QUESTIONNAIRE_SIZES).toContain(QUESTIONNAIRE_DEFAULT_SIZE);
		expect(QUESTIONNAIRE_VARIANTS).toContain(QUESTIONNAIRE_DEFAULT_VARIANT);
	});

	test("progress comes as a bar, steps or a count", () => {
		expect([...QUESTIONNAIRE_PROGRESS_VARIANTS]).toEqual(["bar", "steps", "count"]);
	});
});

describe("resolveQuestionnaireAxes", () => {
	test("forwards the size to every control unchanged", () => {
		for (const size of QUESTIONNAIRE_SIZES) {
			const axes = resolveQuestionnaireAxes({ size, variant: "primary" });
			expect(axes.buttonSize).toBe(size);
			expect(axes.inputSize).toBe(size);
			expect(axes.radioSize).toBe(size);
			expect(axes.checkboxSize).toBe(size);
			expect(axes.ratingSize).toBe(size);
			expect(axes.stepsSize).toBe(size);
			expect(axes.progressSize).toBe(size);
		}
	});

	test("scale buttons are the square of the same step", () => {
		expect(resolveQuestionnaireAxes({ size: "sm", variant: "primary" }).scaleButtonSize).toBe("icon-sm");
		expect(resolveQuestionnaireAxes({ size: "md", variant: "primary" }).scaleButtonSize).toBe("icon-md");
		expect(resolveQuestionnaireAxes({ size: "lg", variant: "primary" }).scaleButtonSize).toBe("icon-lg");
	});

	test("every forwarded value is one its control accepts", () => {
		for (const size of QUESTIONNAIRE_SIZES) {
			for (const variant of QUESTIONNAIRE_VARIANTS) {
				const axes = resolveQuestionnaireAxes({ size, variant });
				expect(BUTTON_VARIANTS).toContain(axes.nextVariant);
				expect(BUTTON_VARIANTS).toContain(axes.backVariant);
				expect(BUTTON_VARIANTS).toContain(axes.skipVariant);
				expect(BUTTON_SIZES).toContain(axes.scaleButtonSize);
				expect(INPUT_VARIANTS).toContain(axes.inputVariant);
				expect(RADIO_VARIANTS).toContain(axes.radioVariant);
				expect(CHECKBOX_COLORS).toContain(axes.checkboxColor);
				expect(TOGGLE_BUTTON_VARIANTS).toContain(axes.toggleVariant);
				expect(STEPS_VARIANTS).toContain(axes.stepsVariant);
				expect(PROGRESS_COLORS).toContain(axes.progressColor);
				expect(TEXT_VARIANTS).toContain(axes.titleVariant);
				expect(TEXT_SIZES).toContain(axes.headingSize);
			}
		}
	});

	test("primary fills and secondary outlines", () => {
		const primary = resolveQuestionnaireAxes({ size: "md", variant: "primary" });
		const secondary = resolveQuestionnaireAxes({ size: "md", variant: "secondary" });
		expect(primary.nextVariant).toBe("primary");
		expect(secondary.nextVariant).toBe("secondary");
		expect(primary.inputVariant).toBe("primary");
		expect(secondary.inputVariant).toBe("secondary");
		expect(primary.toggleVariant).toBe("default");
		expect(secondary.toggleVariant).toBe("outline");
	});

	test("the heading and title step up with size", () => {
		const steps = QUESTIONNAIRE_SIZES.map((size) =>
			TEXT_SIZES.indexOf(resolveQuestionnaireAxes({ size, variant: "primary" }).headingSize)
		);
		expect(steps[0]).toBeLessThan(steps[1] ?? 0);
		expect(steps[1]).toBeLessThan(steps[2] ?? 0);
		expect(resolveQuestionnaireAxes({ size: "lg", variant: "primary" }).titleVariant).toBe("title");
	});
});

describe("resolveQuestionnaireFooterButtons", () => {
	const base = { canBack: true, canSkip: true, isLast: false, isSubmitted: false };

	test("Back hides on the first question, Skip on a required one", () => {
		expect(resolveQuestionnaireFooterButtons({ ...base, canBack: false }).back).toBe(false);
		expect(resolveQuestionnaireFooterButtons({ ...base, canSkip: false }).skip).toBe(false);
	});

	test("Next and Submit swap on the last question", () => {
		expect(resolveQuestionnaireFooterButtons(base)).toEqual({ back: true, next: true, skip: true, submit: false });
		expect(resolveQuestionnaireFooterButtons({ ...base, isLast: true })).toEqual({
			back: true,
			next: false,
			skip: true,
			submit: true,
		});
	});

	test("nothing shows once submitted", () => {
		expect(resolveQuestionnaireFooterButtons({ ...base, isSubmitted: true })).toEqual({
			back: false,
			next: false,
			skip: false,
			submit: false,
		});
	});
});

describe("questionnaireVariants", () => {
	test("framed parts carry their own padding; unframed ones carry none", () => {
		for (const size of QUESTIONNAIRE_SIZES) {
			const framed = questionnaireVariants({ isFramed: true, size });
			const bare = questionnaireVariants({ isFramed: false, size });
			for (const slot of ["header", "body", "footer"] as const) {
				expect(cls(framed[slot]())).toMatch(/\bpx-\d/);
				expect(cls(bare[slot]())).not.toMatch(/\bp[xy]?-\d/);
			}
		}
	});

	test("an unframed root spaces its parts with a gap; a framed one lets the parts pad", () => {
		expect(cls(questionnaireVariants({ isFramed: false }).root())).toMatch(/\bgap-\d/);
		expect(cls(questionnaireVariants({ isFramed: true }).root())).not.toMatch(/\bgap-\d/);
	});

	test("gaps grow with size", () => {
		const gap = (size: (typeof QUESTIONNAIRE_SIZES)[number]) =>
			Number(cls(questionnaireVariants({ size }).question()).match(/\bgap-(\d+(?:\.\d+)?)\b/)?.[1]);
		expect(gap("sm")).toBeLessThan(gap("md"));
		expect(gap("md")).toBeLessThan(gap("lg"));
	});

	test("every colour token is declared in both themes", () => {
		const tokens = new Set(allClasses().flatMap(colorTokens));
		for (const token of tokens) expect([token, declarationCount(token)]).toEqual([token, 2]);
	});

	test("no raw palette colour and no dark: prefix", () => {
		for (const value of allClasses()) {
			expect(value).not.toMatch(/\bdark:/);
			expect(value).not.toMatch(
				/\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/
			);
		}
	});
});

describe("the dimmed action", () => {
	test("fades without disabling", () => {
		expect(cls(questionnaireVariants({ isDimmed: true }).action())).toBe("opacity-50");
		expect(cls(questionnaireVariants({ isDimmed: false }).action())).toBe("");
	});
});

describe("the transition", () => {
	test("slides 24pt over 220ms", () => {
		expect(QUESTIONNAIRE_SLIDE_DISTANCE).toBe(24);
		expect(QUESTIONNAIRE_TRANSITION_MS).toEqual({ calm: 100, full: 220 });
	});
});

describe("resolveQuestionnaireTestId", () => {
	test("joins the root's testID with the parts that name the element", () => {
		expect(resolveQuestionnaireTestId("survey", "role", "design")).toBe("survey-role-design");
		expect(resolveQuestionnaireTestId("survey", "next")).toBe("survey-next");
	});

	test("is undefined without a root testID, so nothing is tagged by accident", () => {
		expect(resolveQuestionnaireTestId(undefined, "role", "design")).toBeUndefined();
	});
});
