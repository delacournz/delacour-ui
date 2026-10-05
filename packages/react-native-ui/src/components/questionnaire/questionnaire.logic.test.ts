import { describe, expect, test } from "bun:test";
import {
	canBack,
	canSkip,
	createQuestionnaireState,
	defaultErrorMessage,
	findDanglingReferences,
	findForwardReferences,
	formatQuestionCount,
	formatScaleValue,
	getFirstInvalid,
	getNextId,
	getPrevId,
	getProgress,
	getScaleValues,
	getSubmission,
	getVisibleQuestions,
	isConditionMet,
	isEmptyAnswer,
	isLastVisible,
	normalizeAnswer,
	pruneAnswers,
	QUESTIONNAIRE_SCALE_MAX_STEPS,
	type QuestionnaireState,
	questionnaireReducer,
	syncAnswers,
	validateAnswer,
} from "./questionnaire.logic";
import type { Answer, Answers, Question, QuestionCondition, ValidationError } from "./questionnaire.types";

const single: Question = {
	id: "role",
	kind: "single",
	options: [
		{ label: "Designer", value: "design" },
		{ label: "Engineer", value: "eng" },
		{ isDisabled: true, label: "Retired", value: "retired" },
		{ isOther: true, label: "Other", value: "other" },
	],
	title: "Your role",
};

const multiple: Question = {
	id: "tools",
	kind: "multiple",
	maxSelected: 2,
	minSelected: 1,
	options: [
		{ label: "Figma", value: "figma" },
		{ label: "Sketch", value: "sketch" },
		{ label: "Xcode", value: "xcode" },
		{ isOther: true, label: "Other", value: "other" },
	],
	title: "Tools",
};

const text: Question = { id: "notes", kind: "text", maxLength: 10, minLength: 3, title: "Notes" };
const rating: Question = { id: "stars", kind: "rating", title: "Rate us" };
const halfRating: Question = { id: "half", kind: "rating", maxValue: 4, step: 0.5, title: "Half" };
const scale: Question = { id: "nps", kind: "scale", max: 10, min: 0, title: "Recommend?" };
const yesNo: Question = { id: "again", kind: "yesNo", title: "Again?" };

const required = <Q extends Question>(question: Q): Q => ({ ...question, isRequired: true });

/** A → B (only when A is yes) → C (only when B answered) → D. */
const branching: readonly Question[] = [
	{ id: "a", isRequired: true, kind: "yesNo", title: "A" },
	{ id: "b", kind: "text", showIf: { questionId: "a", type: "equals", value: "yes" }, title: "B" },
	{ id: "c", kind: "text", showIf: { questionId: "b", type: "answered" }, title: "C" },
	{ id: "d", kind: "rating", title: "D" },
];

const YES: Answer = { kind: "yesNo", value: "yes" };
const NO: Answer = { kind: "yesNo", value: "no" };
const SKIPPED: Answer = { kind: "skipped" };
const textAnswer = (value: string): Answer => ({ kind: "text", value });

function ids(questions: readonly Question[]): string[] {
	return questions.map((question) => question.id);
}

function run(state: QuestionnaireState, ...actions: Parameters<typeof questionnaireReducer>[1][]): QuestionnaireState {
	return actions.reduce(questionnaireReducer, state);
}

describe("isConditionMet", () => {
	const answers: Answers = {
		again: YES,
		nps: { kind: "scale", value: 7 },
		role: { kind: "single", value: "eng" },
		skipped: SKIPPED,
		stars: { kind: "rating", value: 4 },
		tools: { kind: "multiple", values: ["figma", "xcode"] },
	};

	test("answered is false for a missing answer and for a skipped one", () => {
		expect(isConditionMet({ questionId: "role", type: "answered" }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "nope", type: "answered" }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "skipped", type: "answered" }, answers)).toBe(false);
	});

	test("equals compares single, yesNo, scale and rating answers", () => {
		expect(isConditionMet({ questionId: "role", type: "equals", value: "eng" }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "role", type: "equals", value: "design" }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "again", type: "equals", value: "yes" }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "nps", type: "equals", value: 7 }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "stars", type: "equals", value: 4 }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "stars", type: "equals", value: "4" }, answers)).toBe(false);
	});

	test("equals never matches a multiple or a skipped answer", () => {
		expect(isConditionMet({ questionId: "tools", type: "equals", value: "figma" }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "skipped", type: "equals", value: "x" }, answers)).toBe(false);
	});

	test("includes reads a multiple answer", () => {
		expect(isConditionMet({ questionId: "tools", type: "includes", value: "xcode" }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "tools", type: "includes", value: "sketch" }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "role", type: "includes", value: "eng" }, answers)).toBe(false);
	});

	test("gte and lte include their boundary", () => {
		expect(isConditionMet({ questionId: "nps", type: "gte", value: 7 }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "nps", type: "gte", value: 8 }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "nps", type: "lte", value: 7 }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "nps", type: "lte", value: 6 }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "stars", type: "gte", value: 4 }, answers)).toBe(true);
		expect(isConditionMet({ questionId: "role", type: "gte", value: 0 }, answers)).toBe(false);
	});

	test("and, or and not nest", () => {
		const condition: QuestionCondition = {
			conditions: [
				{ questionId: "again", type: "equals", value: "yes" },
				{
					conditions: [
						{ questionId: "nps", type: "lte", value: 3 },
						{ condition: { questionId: "tools", type: "includes", value: "sketch" }, type: "not" },
					],
					type: "or",
				},
			],
			type: "and",
		};
		expect(isConditionMet(condition, answers)).toBe(true);
		expect(isConditionMet({ condition, type: "not" }, answers)).toBe(false);
	});

	test("an empty and holds, an empty or does not", () => {
		expect(isConditionMet({ conditions: [], type: "and" }, answers)).toBe(true);
		expect(isConditionMet({ conditions: [], type: "or" }, answers)).toBe(false);
	});

	test("a reference to an unknown id never holds", () => {
		expect(isConditionMet({ questionId: "ghost", type: "equals", value: "x" }, answers)).toBe(false);
		expect(isConditionMet({ questionId: "ghost", type: "gte", value: 0 }, answers)).toBe(false);
	});
});

describe("reference checks", () => {
	test("findDanglingReferences names conditions pointing at no question", () => {
		const questions: Question[] = [
			{ id: "a", kind: "yesNo", title: "A" },
			{
				id: "b",
				kind: "yesNo",
				showIf: {
					conditions: [
						{ questionId: "a", type: "answered" },
						{ condition: { questionId: "ghost", type: "answered" }, type: "not" },
					],
					type: "and",
				},
				title: "B",
			},
		];
		expect(findDanglingReferences(questions)).toEqual([{ questionId: "b", reference: "ghost" }]);
	});

	test("findForwardReferences names conditions on a question declared at or after", () => {
		const questions: Question[] = [
			{ id: "a", kind: "yesNo", showIf: { questionId: "b", type: "answered" }, title: "A" },
			{ id: "b", kind: "yesNo", showIf: { questionId: "b", type: "answered" }, title: "B" },
			{ id: "c", kind: "yesNo", showIf: { questionId: "a", type: "answered" }, title: "C" },
		];
		expect(findForwardReferences(questions)).toEqual([
			{ questionId: "a", reference: "b" },
			{ questionId: "b", reference: "b" },
		]);
	});

	test("well-formed branching reports nothing", () => {
		expect(findDanglingReferences(branching)).toEqual([]);
		expect(findForwardReferences(branching)).toEqual([]);
	});
});

describe("getVisibleQuestions", () => {
	test("drops disabled questions and unmet conditions, keeping order", () => {
		const questions: Question[] = [...branching, { id: "e", isDisabled: true, kind: "yesNo", title: "E" }];
		expect(ids(getVisibleQuestions(questions, {}))).toEqual(["a", "d"]);
	});

	test("chained conditions resolve in one pass", () => {
		expect(ids(getVisibleQuestions(branching, { a: YES }))).toEqual(["a", "b", "d"]);
		expect(ids(getVisibleQuestions(branching, { a: YES, b: textAnswer("hi") }))).toEqual(["a", "b", "c", "d"]);
	});

	test("an answer to a hidden question does not reveal what depends on it", () => {
		expect(ids(getVisibleQuestions(branching, { a: NO, b: textAnswer("stale") }))).toEqual(["a", "d"]);
	});

	test("a condition on a later question is treated as unmet", () => {
		const questions: Question[] = [
			{ id: "a", kind: "yesNo", showIf: { questionId: "b", type: "answered" }, title: "A" },
			{ id: "b", kind: "yesNo", title: "B" },
		];
		expect(ids(getVisibleQuestions(questions, { a: YES, b: YES }))).toEqual(["b"]);
	});
});

describe("pruneAnswers", () => {
	test("drops answers to hidden questions and leaves the rest", () => {
		const answers: Answers = { a: NO, b: textAnswer("x"), c: textAnswer("y"), d: { kind: "rating", value: 3 } };
		expect(pruneAnswers(branching, answers)).toEqual({ a: NO, d: { kind: "rating", value: 3 } });
	});

	test("keeps answers keyed by ids no question declares", () => {
		expect(pruneAnswers(branching, { a: YES, extra: YES })).toEqual({ a: YES, extra: YES });
	});

	test("returns the same object when nothing was dropped", () => {
		const answers: Answers = { a: YES };
		expect(pruneAnswers(branching, answers)).toBe(answers);
	});
});

describe("isEmptyAnswer and normalizeAnswer", () => {
	test("blank text and an empty multiple are empty", () => {
		expect(isEmptyAnswer(undefined)).toBe(true);
		expect(isEmptyAnswer(textAnswer(""))).toBe(true);
		expect(isEmptyAnswer({ kind: "multiple", values: [] })).toBe(true);
		expect(isEmptyAnswer({ kind: "rating", value: 0 })).toBe(true);
		expect(isEmptyAnswer(textAnswer(" "))).toBe(false);
		expect(isEmptyAnswer(SKIPPED)).toBe(false);
	});

	test("normalizeAnswer turns an empty answer into no answer", () => {
		expect(normalizeAnswer(textAnswer(""))).toBeUndefined();
		expect(normalizeAnswer(YES)).toBe(YES);
	});
});

describe("validateAnswer", () => {
	test("a required question with no answer, or a skipped one, is required", () => {
		expect(validateAnswer(required(single), undefined)).toEqual({ type: "required" });
		expect(validateAnswer(required(single), SKIPPED)).toEqual({ type: "required" });
	});

	test("an optional question with no answer, or a skipped one, is fine", () => {
		expect(validateAnswer(single, undefined)).toBeNull();
		expect(validateAnswer(single, SKIPPED)).toBeNull();
	});

	test("whitespace-only text is no answer", () => {
		expect(validateAnswer(required(text), textAnswer("   "))).toEqual({ type: "required" });
		expect(validateAnswer(text, textAnswer("   "))).toBeNull();
	});

	test("text length: min on the trimmed value, max on the raw one", () => {
		expect(validateAnswer(text, textAnswer(" ab "))).toEqual({ min: 3, type: "minLength" });
		expect(validateAnswer(text, textAnswer("abc"))).toBeNull();
		expect(validateAnswer(text, textAnswer("abcdefghij"))).toBeNull();
		expect(validateAnswer(text, textAnswer("abcdefghij "))).toEqual({ max: 10, type: "maxLength" });
	});

	test("multiple respects min and max selected", () => {
		expect(validateAnswer(multiple, { kind: "multiple", values: ["figma"] })).toBeNull();
		expect(validateAnswer(multiple, { kind: "multiple", values: ["figma", "sketch", "xcode"] })).toEqual({
			max: 2,
			type: "maxSelected",
		});
		const three: Question = { ...multiple, maxSelected: undefined, minSelected: 2 };
		expect(validateAnswer(three, { kind: "multiple", values: ["figma"] })).toEqual({ min: 2, type: "minSelected" });
	});

	test("an empty multiple is required only when the question is", () => {
		expect(validateAnswer(multiple, { kind: "multiple", values: [] })).toBeNull();
		expect(validateAnswer(required(multiple), { kind: "multiple", values: [] })).toEqual({ type: "required" });
	});

	test("an Other choice needs its text", () => {
		expect(validateAnswer(single, { kind: "single", value: "other" })).toEqual({ type: "otherRequired" });
		expect(validateAnswer(single, { kind: "single", other: "  ", value: "other" })).toEqual({
			type: "otherRequired",
		});
		expect(validateAnswer(single, { kind: "single", other: "PM", value: "other" })).toBeNull();
		expect(validateAnswer(multiple, { kind: "multiple", values: ["other"] })).toEqual({ type: "otherRequired" });
		expect(validateAnswer(multiple, { kind: "multiple", other: "Zed", values: ["other"] })).toBeNull();
	});

	test("an unknown or disabled option value is invalid", () => {
		expect(validateAnswer(single, { kind: "single", value: "chef" })).toEqual({ type: "required" });
		expect(validateAnswer(single, { kind: "single", value: "retired" })).toEqual({ type: "required" });
		expect(validateAnswer(multiple, { kind: "multiple", values: ["figma", "vim"] })).toEqual({ type: "required" });
	});

	test("rating: whole stars by default, halves when asked, within the count", () => {
		expect(validateAnswer(rating, { kind: "rating", value: 5 })).toBeNull();
		expect(validateAnswer(rating, { kind: "rating", value: 6 })).toEqual({ max: 5, min: 1, type: "outOfRange" });
		expect(validateAnswer(rating, { kind: "rating", value: 2.5 })).toEqual({ max: 5, min: 1, type: "outOfRange" });
		expect(validateAnswer(halfRating, { kind: "rating", value: 2.5 })).toBeNull();
		expect(validateAnswer(halfRating, { kind: "rating", value: 4.5 })).toEqual({
			max: 4,
			min: 0.5,
			type: "outOfRange",
		});
	});

	test("a zero rating is no answer", () => {
		expect(validateAnswer(rating, { kind: "rating", value: 0 })).toBeNull();
		expect(validateAnswer(required(rating), { kind: "rating", value: 0 })).toEqual({ type: "required" });
	});

	test("scale: integers within min and max", () => {
		expect(validateAnswer(scale, { kind: "scale", value: 0 })).toBeNull();
		expect(validateAnswer(scale, { kind: "scale", value: 10 })).toBeNull();
		expect(validateAnswer(scale, { kind: "scale", value: 11 })).toEqual({ max: 10, min: 0, type: "outOfRange" });
		expect(validateAnswer(scale, { kind: "scale", value: 4.5 })).toEqual({ max: 10, min: 0, type: "outOfRange" });
	});

	test("yesNo accepts yes and no", () => {
		expect(validateAnswer(required(yesNo), YES)).toBeNull();
		expect(validateAnswer(required(yesNo), NO)).toBeNull();
	});

	test("a kind mismatch is invalid and does not throw", () => {
		expect(validateAnswer(single, YES)).toEqual({ type: "required" });
		expect(validateAnswer(scale, { kind: "rating", value: 3 })).toEqual({ type: "required" });
	});
});

describe("getFirstInvalid", () => {
	test("finds the first visible invalid question", () => {
		const questions = [single, required(text), required(yesNo)];
		expect(getFirstInvalid(questions, {})?.question.id).toBe("notes");
		expect(getFirstInvalid(questions, { notes: textAnswer("hello") })?.question.id).toBe("again");
		expect(getFirstInvalid(questions, { again: NO, notes: textAnswer("hello") })).toBeNull();
	});

	test("ignores hidden required questions", () => {
		const questions: Question[] = [
			{ id: "a", kind: "yesNo", title: "A" },
			{
				id: "b",
				isRequired: true,
				kind: "text",
				showIf: { questionId: "a", type: "equals", value: "yes" },
				title: "B",
			},
		];
		expect(getFirstInvalid(questions, { a: NO })).toBeNull();
		expect(getFirstInvalid(questions, { a: YES })?.question.id).toBe("b");
	});
});

describe("navigation helpers", () => {
	test("getNextId and getPrevId walk the visible questions", () => {
		expect(getNextId(branching, {}, "a")).toBe("d");
		expect(getNextId(branching, { a: YES }, "a")).toBe("b");
		expect(getNextId(branching, {}, "d")).toBeNull();
		expect(getPrevId(branching, {}, "d")).toBe("a");
		expect(getPrevId(branching, {}, "a")).toBeNull();
	});

	test("from a hidden question they move to its visible neighbours by declaration order", () => {
		expect(getNextId(branching, {}, "b")).toBe("d");
		expect(getPrevId(branching, {}, "c")).toBe("a");
	});

	test("a single question is first and last", () => {
		const one = [yesNo];
		expect(getNextId(one, {}, "again")).toBeNull();
		expect(getPrevId(one, {}, "again")).toBeNull();
		expect(isLastVisible(one, {}, "again")).toBe(true);
	});

	test("isLastVisible follows branching", () => {
		const twoStep: Question[] = [
			{ id: "a", kind: "yesNo", title: "A" },
			{ id: "b", kind: "text", showIf: { questionId: "a", type: "equals", value: "yes" }, title: "B" },
		];
		expect(isLastVisible(twoStep, {}, "a")).toBe(true);
		expect(isLastVisible(twoStep, { a: YES }, "a")).toBe(false);
	});

	test("everything hidden leaves no neighbours", () => {
		const hidden: Question[] = [{ id: "a", isDisabled: true, kind: "yesNo", title: "A" }];
		expect(getNextId(hidden, {}, null)).toBeNull();
		expect(isLastVisible(hidden, {}, null)).toBe(false);
	});
});

describe("getProgress", () => {
	test("counts visible questions only", () => {
		expect(getProgress(branching, {}, "a")).toEqual({ index: 0, ratio: 0.5, total: 2 });
		expect(getProgress(branching, { a: YES }, "b")).toEqual({ index: 1, ratio: 2 / 3, total: 3 });
	});

	test("the ratio can move backwards as branching reveals questions, and stays in [0, 1]", () => {
		const before = getProgress(branching, { a: YES }, "b");
		const after = getProgress(branching, { a: YES, b: textAnswer("x") }, "b");
		expect(after.total).toBe(4);
		expect(after.ratio).toBeLessThan(before.ratio);
		for (const value of [before, after]) {
			expect(value.ratio).toBeGreaterThanOrEqual(0);
			expect(value.ratio).toBeLessThanOrEqual(1);
		}
	});

	test("no questions is all zeros", () => {
		expect(getProgress([], {}, null)).toEqual({ index: 0, ratio: 0, total: 0 });
	});
});

describe("defaultErrorMessage", () => {
	const cases: [ValidationError, string][] = [
		[{ type: "required" }, "Answer this question to continue."],
		[{ min: 1, type: "minSelected" }, "Choose at least 1 option."],
		[{ min: 2, type: "minSelected" }, "Choose at least 2 options."],
		[{ max: 1, type: "maxSelected" }, "Choose no more than 1 option."],
		[{ max: 3, type: "maxSelected" }, "Choose no more than 3 options."],
		[{ min: 1, type: "minLength" }, "Enter at least 1 character."],
		[{ min: 5, type: "minLength" }, "Enter at least 5 characters."],
		[{ max: 1, type: "maxLength" }, "Use no more than 1 character."],
		[{ max: 140, type: "maxLength" }, "Use no more than 140 characters."],
		[{ max: 10, min: 0, type: "outOfRange" }, "Choose a value from 0 to 10."],
		[{ type: "otherRequired" }, "Describe your other answer."],
	];

	for (const [error, message] of cases) {
		test(`${error.type} → ${message}`, () => {
			expect(defaultErrorMessage(error, single)).toBe(message);
		});
	}

	test("a required multiple asks for a choice", () => {
		expect(defaultErrorMessage({ type: "required" }, multiple)).toBe("Choose at least 1 option.");
	});
});

describe("createQuestionnaireState", () => {
	test("starts at the first visible question", () => {
		const state = createQuestionnaireState({ questions: branching });
		expect(state.currentId).toBe("a");
		expect(state.history).toEqual([]);
		expect(state.status).toBe("active");
		expect(state.errors).toEqual({});
	});

	test("a hidden starting id moves to the next visible question", () => {
		expect(createQuestionnaireState({ currentId: "b", questions: branching }).currentId).toBe("d");
	});

	test("no visible questions means no current question", () => {
		expect(createQuestionnaireState({ questions: [] }).currentId).toBeNull();
	});
});

describe("questionnaireReducer", () => {
	const start = () => createQuestionnaireState({ questions: branching });

	describe("answer", () => {
		test("stores the answer and clears that question's error", () => {
			const blocked = run(start(), { type: "next" });
			expect(blocked.errors.a).toEqual({ type: "required" });
			const answered = run(blocked, { answer: YES, id: "a", type: "answer" });
			expect(answered.answers.a).toEqual(YES);
			expect(answered.errors.a).toBeUndefined();
		});

		test("prunes answers of questions the change hides, and trims history", () => {
			const deep = run(
				start(),
				{ answer: YES, id: "a", type: "answer" },
				{ type: "next" },
				{ answer: textAnswer("b"), id: "b", type: "answer" },
				{ type: "next" },
				{ answer: textAnswer("c"), id: "c", type: "answer" },
				{ type: "next" },
				{ answer: { kind: "rating", value: 3 }, id: "d", type: "answer" }
			);
			expect(deep.history).toEqual(["a", "b", "c"]);
			const flipped = run(deep, { answer: NO, id: "a", type: "answer" });
			expect(flipped.answers).toEqual({ a: NO, d: { kind: "rating", value: 3 } });
			expect(flipped.history).toEqual(["a"]);
			expect(flipped.currentId).toBe("d");
		});

		test("leaves unrelated answers alone", () => {
			const state = run(start(), { answer: { kind: "rating", value: 4 }, id: "d", type: "answer" });
			const next = run(state, { answer: NO, id: "a", type: "answer" });
			expect(next.answers.d).toEqual({ kind: "rating", value: 4 });
		});

		test("clearing a previously given answer shows the required error", () => {
			const state = run(
				start(),
				{ answer: YES, id: "a", type: "answer" },
				{ answer: undefined, id: "a", type: "answer" }
			);
			expect(state.answers.a).toBeUndefined();
			expect(state.errors.a).toEqual({ type: "required" });
		});

		test("a first invalid keystroke shows nothing; an existing error updates", () => {
			const questions = [required(text)];
			const typed = run(createQuestionnaireState({ questions }), {
				answer: textAnswer("a"),
				id: "notes",
				type: "answer",
			});
			expect(typed.errors.notes).toBeUndefined();
			const blocked = run(typed, { type: "next" }, { type: "submit" });
			expect(blocked.errors.notes).toEqual({ min: 3, type: "minLength" });
			const longer = run(blocked, { answer: textAnswer("abcdefghijkl"), id: "notes", type: "answer" });
			expect(longer.errors.notes).toEqual({ max: 10, type: "maxLength" });
		});

		test("an empty answer is stored as no answer", () => {
			const state = run(createQuestionnaireState({ questions: [text] }), {
				answer: textAnswer(""),
				id: "notes",
				type: "answer",
			});
			expect("notes" in state.answers).toBe(false);
		});
	});

	describe("next", () => {
		test("blocks on an invalid answer, sets the error and counts the block", () => {
			const state = run(start(), { type: "next" }, { type: "next" });
			expect(state.currentId).toBe("a");
			expect(state.errors.a).toEqual({ type: "required" });
			expect(state.blockedCount).toBe(2);
		});

		test("moves to the next visible question and records history", () => {
			const state = run(start(), { answer: NO, id: "a", type: "answer" }, { type: "next" });
			expect(state.currentId).toBe("d");
			expect(state.history).toEqual(["a"]);
			expect(state.direction).toBe("forward");
		});

		test("is a no-op on the last visible question", () => {
			const last = run(start(), { answer: NO, id: "a", type: "answer" }, { type: "next" });
			expect(run(last, { type: "next" })).toBe(last);
		});
	});

	describe("skip", () => {
		test("does nothing on a required question", () => {
			const state = start();
			expect(run(state, { type: "skip" })).toBe(state);
		});

		test("records a deliberate omission and advances", () => {
			const questions = [text, yesNo];
			const state = run(createQuestionnaireState({ questions }), { type: "skip" });
			expect(state.answers.notes).toEqual(SKIPPED);
			expect(state.currentId).toBe("again");
			expect(state.history).toEqual(["notes"]);
		});

		test("replaces an existing answer and clears its error", () => {
			const questions = [text, yesNo];
			const state = run(
				createQuestionnaireState({ questions }),
				{ answer: textAnswer("a"), id: "notes", type: "answer" },
				{ type: "next" },
				{ type: "skip" }
			);
			expect(state.answers.notes).toEqual(SKIPPED);
			expect(state.errors.notes).toBeUndefined();
		});

		test("on the last question it records the skip and stays", () => {
			const state = run(createQuestionnaireState({ questions: [text] }), { type: "skip" });
			expect(state.answers.notes).toEqual(SKIPPED);
			expect(state.currentId).toBe("notes");
		});
	});

	describe("back", () => {
		test("is a no-op at the start", () => {
			const state = start();
			expect(run(state, { type: "back" })).toBe(state);
		});

		test("returns across a branch to the question actually visited", () => {
			const state = run(start(), { answer: NO, id: "a", type: "answer" }, { type: "next" });
			expect(state.currentId).toBe("d");
			const back = run(state, { type: "back" });
			expect(back.currentId).toBe("a");
			expect(back.history).toEqual([]);
			expect(back.direction).toBe("backward");
		});

		test("never validates", () => {
			const questions = [yesNo, required(text)];
			const state = run(createQuestionnaireState({ questions }), { type: "next" }, { type: "back" });
			expect(state.currentId).toBe("again");
			expect(state.blockedCount).toBe(0);
		});

		test("with no history falls back to the previous visible question", () => {
			const state = createQuestionnaireState({ currentId: "d", questions: branching });
			expect(run(state, { type: "back" }).currentId).toBe("a");
		});
	});

	describe("goTo", () => {
		const visited = () =>
			run(
				start(),
				{ answer: YES, id: "a", type: "answer" },
				{ type: "next" },
				{ answer: textAnswer("b"), id: "b", type: "answer" },
				{ type: "next" }
			);

		test("jumps back to a visited question and trims history", () => {
			const state = run(visited(), { id: "a", type: "goTo" });
			expect(state.currentId).toBe("a");
			expect(state.history).toEqual([]);
			expect(state.direction).toBe("backward");
		});

		test("allows the next question only when the current one is valid", () => {
			const atC = visited();
			expect(run(atC, { id: "d", type: "goTo" }).currentId).toBe("d");
			const requiredC = createQuestionnaireState({
				questions: [{ id: "x", isRequired: true, kind: "text", title: "X" }, yesNo],
			});
			expect(run(requiredC, { id: "again", type: "goTo" }).currentId).toBe("x");
		});

		test("ignores a jump past the next question while linear", () => {
			const state = run(start(), { answer: YES, id: "a", type: "answer" });
			expect(run(state, { id: "d", type: "goTo" })).toBe(state);
		});

		test("a jump to the next question while the current one is invalid changes nothing", () => {
			const state = start();
			expect(run(state, { id: "d", type: "goTo" })).toBe(state);
		});

		test("ignores hidden or unknown ids", () => {
			const state = start();
			expect(run(state, { id: "b", type: "goTo" })).toBe(state);
			expect(run(state, { id: "zzz", type: "goTo" })).toBe(state);
		});

		test("jumps anywhere visible when not linear", () => {
			const state = run(createQuestionnaireState({ isLinear: false, questions: branching }), {
				id: "d",
				type: "goTo",
			});
			expect(state.currentId).toBe("d");
			expect(state.history).toEqual(["a"]);
		});
	});

	describe("submit", () => {
		test("moves to the first invalid question and sets its error", () => {
			const questions = [required(yesNo), text, required(scale)];
			const state = run(
				createQuestionnaireState({ questions }),
				{ answer: YES, id: "again", type: "answer" },
				{ type: "next" },
				{ type: "next" },
				{ id: "again", type: "goTo" },
				{ answer: undefined, id: "again", type: "answer" },
				{ type: "submit" }
			);
			expect(state.currentId).toBe("again");
			expect(state.errors.again).toEqual({ type: "required" });
			expect(state.status).toBe("active");
		});

		test("sets submitted when every visible required question is answered", () => {
			const state = run(start(), { answer: NO, id: "a", type: "answer" }, { type: "next" }, { type: "submit" });
			expect(state.status).toBe("submitted");
		});

		test("the submission holds visible answers only, with skips kept", () => {
			const state = run(
				createQuestionnaireState({
					answers: { a: NO, b: textAnswer("stale") },
					questions: branching,
				}),
				{ type: "next" },
				{ type: "skip" }
			);
			expect(getSubmission(state)).toEqual({ a: NO, d: SKIPPED });
		});
	});

	test("reset returns to the initial state", () => {
		const initial = createQuestionnaireState({ answers: { a: YES }, questions: branching });
		const moved = run(initial, { type: "next" }, { answer: textAnswer("x"), id: "b", type: "answer" });
		expect(run(moved, { type: "reset" })).toEqual(initial);
	});

	describe("syncAnswers", () => {
		test("re-derives visibility and moves off a question that became hidden", () => {
			const atB = run(start(), { answer: YES, id: "a", type: "answer" }, { type: "next" });
			expect(atB.currentId).toBe("b");
			const synced = syncAnswers(atB, { a: NO });
			expect(synced.currentId).toBe("d");
			expect(synced.answers).toEqual({ a: NO });
		});

		test("is reachable as an action", () => {
			const state = run(start(), { answers: { a: YES }, type: "syncAnswers" });
			expect(state.answers).toEqual({ a: YES });
		});
	});

	test("syncCurrent moves without validating", () => {
		const state = run(start(), { answer: YES, id: "a", type: "answer" }, { id: "d", type: "syncCurrent" });
		expect(state.currentId).toBe("d");
		expect(state.history).toEqual(["a"]);
	});

	test("syncQuestions re-derives against new questions", () => {
		const state = run(start(), { questions: [yesNo], type: "syncQuestions" });
		expect(state.currentId).toBe("again");
	});
});

describe("canBack and canSkip", () => {
	test("reflect history and requiredness", () => {
		const first = createQuestionnaireState({ questions: [text, required(yesNo)] });
		expect(canBack(first)).toBe(false);
		expect(canSkip(first)).toBe(true);
		const second = questionnaireReducer(first, { type: "skip" });
		expect(canBack(second)).toBe(true);
		expect(canSkip(second)).toBe(false);
	});
});

describe("wording helpers", () => {
	test("formatQuestionCount is one-based", () => {
		expect(formatQuestionCount({ index: 1, ratio: 0.4, total: 5 })).toBe("Question 2 of 5");
		expect(formatQuestionCount({ index: 0, ratio: 0, total: 0 })).toBe("");
	});

	test("formatScaleValue reads a value against the top of the scale", () => {
		expect(formatScaleValue(7, 10)).toBe("7 out of 10");
	});

	test("getScaleValues lists every integer from min to max", () => {
		expect(getScaleValues(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(getScaleValues(1, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(getScaleValues(1.5, 3.2)).toEqual([2, 3]);
	});

	test("getScaleValues refuses an inverted or absurd range", () => {
		expect(getScaleValues(5, 1)).toEqual([]);
		expect(getScaleValues(0, 1000)).toHaveLength(QUESTIONNAIRE_SCALE_MAX_STEPS);
	});
});
