import type {
	Answer,
	Answers,
	Question,
	QuestionCondition,
	QuestionnaireDirection,
	QuestionnaireOption,
	QuestionnaireProgress,
	QuestionnaireStatus,
	ValidationError,
} from "./questionnaire.types";

/**
 * The questionnaire's whole flow, as pure functions.
 *
 * No React and no React Native: everything that decides what is shown, what is
 * valid and where Next goes lives here so `bun test` reaches all of it — and so
 * a server can import `getVisibleQuestions` and `validateAnswer` to re-check a
 * submission against the same rules the device applied.
 */

/** A rating with no `maxValue` has this many stars. */
export const QUESTIONNAIRE_RATING_MAX = 5;

// ─── Conditions ──────────────────────────────────────────────────────────────

/**
 * Whether a condition holds against a set of answers.
 *
 * A missing or skipped answer satisfies nothing but `not`. Each comparison is
 * typed: `equals` reads single, yesNo, text, rating and scale answers;
 * `includes` reads multiple; `gte`/`lte` read rating and scale. A comparison
 * against the wrong kind is simply false.
 */
export function isConditionMet(condition: QuestionCondition, answers: Answers): boolean {
	switch (condition.type) {
		case "and":
			return condition.conditions.every((inner) => isConditionMet(inner, answers));
		case "or":
			return condition.conditions.some((inner) => isConditionMet(inner, answers));
		case "not":
			return !isConditionMet(condition.condition, answers);
		case "answered": {
			const answer = answers[condition.questionId];
			return answer !== undefined && answer.kind !== "skipped";
		}
		case "equals": {
			const answer = answers[condition.questionId];
			if (!answer) return false;
			switch (answer.kind) {
				case "single":
				case "yesNo":
				case "text":
				case "rating":
				case "scale":
					return answer.value === condition.value;
				default:
					return false;
			}
		}
		case "includes": {
			const answer = answers[condition.questionId];
			return answer?.kind === "multiple" && answer.values.includes(condition.value);
		}
		case "gte":
		case "lte": {
			const answer = answers[condition.questionId];
			if (answer?.kind !== "rating" && answer?.kind !== "scale") return false;
			return condition.type === "gte" ? answer.value >= condition.value : answer.value <= condition.value;
		}
	}
}

/** Every question id a condition reads, in the order it reads them. */
function referencesOf(condition: QuestionCondition): string[] {
	switch (condition.type) {
		case "and":
		case "or":
			return condition.conditions.flatMap(referencesOf);
		case "not":
			return referencesOf(condition.condition);
		default:
			return [condition.questionId];
	}
}

/** A question whose `showIf` names another question id. */
export type QuestionReference = { questionId: string; reference: string };

/** Conditions naming a question id that does not exist. Such a condition never holds. */
export function findDanglingReferences(questions: readonly Question[]): QuestionReference[] {
	const known = new Set(questions.map((question) => question.id));
	return questions.flatMap((question) =>
		question.showIf
			? referencesOf(question.showIf)
					.filter((reference) => !known.has(reference))
					.map((reference) => ({ questionId: question.id, reference }))
			: []
	);
}

/**
 * Conditions naming the question itself or one declared after it.
 *
 * Visibility is settled in declaration order in one pass, so a later answer
 * has not been considered yet when an earlier question is decided — the
 * condition is treated as unmet rather than resolved with a fixpoint loop that
 * could oscillate.
 */
export function findForwardReferences(questions: readonly Question[]): QuestionReference[] {
	const position = new Map(questions.map((question, index) => [question.id, index]));
	return questions.flatMap((question, index) =>
		question.showIf
			? referencesOf(question.showIf)
					.filter((reference) => {
						const at = position.get(reference);
						return at !== undefined && at >= index;
					})
					.map((reference) => ({ questionId: question.id, reference }))
			: []
	);
}

// ─── Visibility ──────────────────────────────────────────────────────────────

/**
 * The questions in the flow right now, in declaration order.
 *
 * A question is dropped when it is `isDisabled` or its `showIf` does not hold.
 * Conditions are evaluated against the answers of the *visible questions
 * before it* only, so an answer left on a hidden question cannot reveal what
 * depends on it, and a chain (C on B on A) settles in a single pass.
 */
export function getVisibleQuestions(questions: readonly Question[], answers: Answers): Question[] {
	const seen: Record<string, Answer> = {};
	const visible: Question[] = [];
	for (const question of questions) {
		if (question.isDisabled) continue;
		if (question.showIf && !isConditionMet(question.showIf, seen)) continue;
		visible.push(question);
		const answer = answers[question.id];
		if (answer) seen[question.id] = answer;
	}
	return visible;
}

function visibleIds(questions: readonly Question[], answers: Answers): Set<string> {
	return new Set(getVisibleQuestions(questions, answers).map((question) => question.id));
}

/**
 * Drops the answers to questions that are declared but hidden.
 *
 * Ids no question declares are left alone — they may belong to questions that
 * have not loaded yet. Returns the same object when nothing was dropped, so a
 * caller can compare by reference.
 */
export function pruneAnswers(questions: readonly Question[], answers: Answers): Answers {
	const visible = visibleIds(questions, answers);
	const declared = new Set(questions.map((question) => question.id));
	let changed = false;
	const next: Record<string, Answer> = {};
	for (const [id, answer] of Object.entries(answers)) {
		if (declared.has(id) && !visible.has(id)) {
			changed = true;
			continue;
		}
		next[id] = answer;
	}
	return changed ? next : answers;
}

// ─── Answers ─────────────────────────────────────────────────────────────────

/**
 * Whether an answer says nothing: missing, empty text, no choices, or a zero
 * rating. A `skipped` answer is not empty — it is a deliberate statement.
 */
export function isEmptyAnswer(answer: Answer | undefined): boolean {
	if (!answer) return true;
	switch (answer.kind) {
		case "text":
			return answer.value === "";
		case "multiple":
			return answer.values.length === 0 && !answer.other;
		case "rating":
			return answer.value === 0;
		default:
			return false;
	}
}

/** An empty answer becomes no answer, so "cleared" and "never answered" are one state. */
export function normalizeAnswer(answer: Answer | undefined): Answer | undefined {
	return isEmptyAnswer(answer) ? undefined : answer;
}

function findOption(options: readonly QuestionnaireOption[], value: string): QuestionnaireOption | undefined {
	return options.find((option) => option.value === value);
}

function isChoosable(option: QuestionnaireOption | undefined): option is QuestionnaireOption {
	return option !== undefined && !option.isDisabled;
}

const REQUIRED: ValidationError = { type: "required" };
const OTHER_REQUIRED: ValidationError = { type: "otherRequired" };

/** Whether `value` is a whole multiple of `step` — with a tolerance for float noise. */
function isOnStep(value: number, step: number): boolean {
	const ratio = value / step;
	return Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

/**
 * Why an answer cannot be accepted, or `null` when it can.
 *
 * Missing, skipped, empty and whitespace-only answers fail only a required
 * question. A value that cannot belong to the question — an option it does not
 * offer, an answer of another kind — reads as `required`: there is no usable
 * answer, and it never throws. Text length counts the trimmed value against
 * `minLength` (padding is not content) and the raw value against `maxLength`
 * (it is what gets stored).
 */
export function validateAnswer(question: Question, answer: Answer | undefined): ValidationError | null {
	if (!answer || answer.kind === "skipped" || isEmptyAnswer(answer)) {
		return question.isRequired ? REQUIRED : null;
	}
	return validateGiven(question, answer);
}

type SingleQuestion = Extract<Question, { kind: "single" }>;
type MultipleQuestion = Extract<Question, { kind: "multiple" }>;
type TextQuestion = Extract<Question, { kind: "text" }>;
type RatingQuestion = Extract<Question, { kind: "rating" }>;
type ScaleQuestion = Extract<Question, { kind: "scale" }>;

/** Validates an answer that says something, by the question's kind. A kind mismatch is no answer. */
function validateGiven(question: Question, answer: Answer): ValidationError | null {
	if (question.kind === "single" && answer.kind === "single") return validateSingle(question, answer);
	if (question.kind === "multiple" && answer.kind === "multiple") return validateMultiple(question, answer);
	if (question.kind === "text" && answer.kind === "text") return validateText(question, answer.value);
	if (question.kind === "rating" && answer.kind === "rating") return validateRating(question, answer.value);
	if (question.kind === "scale" && answer.kind === "scale") return validateScale(question, answer.value);
	if (question.kind === "yesNo" && answer.kind === "yesNo") {
		return answer.value === "yes" || answer.value === "no" ? null : REQUIRED;
	}
	return REQUIRED;
}

function validateSingle(question: SingleQuestion, answer: { value: string; other?: string }): ValidationError | null {
	const option = findOption(question.options, answer.value);
	if (!isChoosable(option)) return REQUIRED;
	if (option.isOther && !answer.other?.trim()) return OTHER_REQUIRED;
	return null;
}

function validateMultiple(
	question: MultipleQuestion,
	answer: { values: readonly string[]; other?: string }
): ValidationError | null {
	const options = answer.values.map((value) => findOption(question.options, value));
	if (!options.every(isChoosable)) return REQUIRED;
	const count = answer.values.length;
	if (question.minSelected !== undefined && count < question.minSelected) {
		return { min: question.minSelected, type: "minSelected" };
	}
	if (question.maxSelected !== undefined && count > question.maxSelected) {
		return { max: question.maxSelected, type: "maxSelected" };
	}
	if (options.some((option) => option?.isOther) && !answer.other?.trim()) return OTHER_REQUIRED;
	return null;
}

function validateText(question: TextQuestion, value: string): ValidationError | null {
	const trimmed = value.trim();
	if (trimmed === "") return question.isRequired ? REQUIRED : null;
	if (question.minLength !== undefined && trimmed.length < question.minLength) {
		return { min: question.minLength, type: "minLength" };
	}
	if (question.maxLength !== undefined && value.length > question.maxLength) {
		return { max: question.maxLength, type: "maxLength" };
	}
	return null;
}

function validateRating(question: RatingQuestion, value: number): ValidationError | null {
	const max = question.maxValue ?? QUESTIONNAIRE_RATING_MAX;
	const step = question.step ?? 1;
	const isValid = value >= step && value <= max && isOnStep(value, step);
	return isValid ? null : { max, min: step, type: "outOfRange" };
}

function validateScale(question: ScaleQuestion, value: number): ValidationError | null {
	const isValid = Number.isInteger(value) && value >= question.min && value <= question.max;
	return isValid ? null : { max: question.max, min: question.min, type: "outOfRange" };
}

/** The first visible question whose answer fails, with why — or `null` when the form can be submitted. */
export function getFirstInvalid(
	questions: readonly Question[],
	answers: Answers
): { question: Question; error: ValidationError } | null {
	for (const question of getVisibleQuestions(questions, answers)) {
		const error = validateAnswer(question, answers[question.id]);
		if (error) return { error, question };
	}
	return null;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

/**
 * The visible question after `currentId`, by declaration order.
 *
 * Works from a hidden or unknown id too: a hidden id is placed by its
 * declaration position, and `null` or an unknown id means "before the start".
 */
export function getNextId(questions: readonly Question[], answers: Answers, currentId: string | null): string | null {
	const visible = visibleIds(questions, answers);
	const start = currentId === null ? -1 : questions.findIndex((question) => question.id === currentId);
	for (let index = start + 1; index < questions.length; index++) {
		const question = questions[index];
		if (question && visible.has(question.id)) return question.id;
	}
	return null;
}

/** The visible question before `currentId`, by declaration order. `null` at the start. */
export function getPrevId(questions: readonly Question[], answers: Answers, currentId: string | null): string | null {
	if (currentId === null) return null;
	const visible = visibleIds(questions, answers);
	const start = questions.findIndex((question) => question.id === currentId);
	for (let index = start - 1; index >= 0; index--) {
		const question = questions[index];
		if (question && visible.has(question.id)) return question.id;
	}
	return null;
}

/** Whether `currentId` is visible and nothing visible follows it — where Next gives way to Submit. */
export function isLastVisible(questions: readonly Question[], answers: Answers, currentId: string | null): boolean {
	if (currentId === null || !visibleIds(questions, answers).has(currentId)) return false;
	return getNextId(questions, answers, currentId) === null;
}

/**
 * Where the flow is, over visible questions only.
 *
 * `total` moves as branching reveals and hides questions, so `ratio` can step
 * backwards after an answer — it is clamped to `[0, 1]` either way.
 */
export function getProgress(
	questions: readonly Question[],
	answers: Answers,
	currentId: string | null
): QuestionnaireProgress {
	const visible = getVisibleQuestions(questions, answers);
	const total = visible.length;
	if (total === 0) return { index: 0, ratio: 0, total: 0 };
	const index = Math.max(
		0,
		visible.findIndex((question) => question.id === currentId)
	);
	return { index, ratio: Math.min(1, Math.max(0, (index + 1) / total)), total };
}

// ─── Messages ────────────────────────────────────────────────────────────────

function plural(count: number, word: string): string {
	return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * The English wording for a validation error.
 *
 * `getErrorMessage` on the root replaces it — that is the i18n hook — and
 * receives the question too, so a message can name what was asked.
 */
export function defaultErrorMessage(error: ValidationError, question: Question): string {
	switch (error.type) {
		case "required":
			return question.kind === "multiple" ? "Choose at least 1 option." : "Answer this question to continue.";
		case "minSelected":
			return `Choose at least ${plural(error.min, "option")}.`;
		case "maxSelected":
			return `Choose no more than ${plural(error.max, "option")}.`;
		case "minLength":
			return `Enter at least ${plural(error.min, "character")}.`;
		case "maxLength":
			return `Use no more than ${plural(error.max, "character")}.`;
		case "outOfRange":
			return `Choose a value from ${error.min} to ${error.max}.`;
		case "otherRequired":
			return "Describe your other answer.";
	}
}

// ─── State ───────────────────────────────────────────────────────────────────

export type QuestionnaireState = {
	questions: readonly Question[];
	answers: Answers;
	/** The question on screen. `null` only when nothing is visible. */
	currentId: string | null;
	/** Questions actually visited before the current one, oldest first — what Back pops. */
	history: readonly string[];
	/** Errors being shown, keyed by question id. Only set after a blocked Next or Submit, or a cleared answer. */
	errors: Readonly<Record<string, ValidationError>>;
	/** How many times Next or Submit was blocked. A change is the cue to announce and buzz. */
	blockedCount: number;
	/** Which way the flow last moved. */
	direction: QuestionnaireDirection;
	status: QuestionnaireStatus;
	/** `goTo` may reach only visited questions and the next one. */
	isLinear: boolean;
	/** What `reset` returns to. */
	initial: { answers: Answers; currentId: string | null };
};

export type QuestionnaireAction =
	/** Store an answer; `undefined` clears it. */
	| { type: "answer"; id: string; answer: Answer | undefined }
	| { type: "next" }
	| { type: "skip" }
	| { type: "back" }
	| { type: "goTo"; id: string }
	| { type: "submit" }
	/** A submission failed — a promise from `onSubmit` rejected. Back to active, where it was. */
	| { type: "reopen" }
	| { type: "reset" }
	/** A controlled `answers` prop changed. */
	| { type: "syncAnswers"; answers: Answers }
	/** A controlled `currentId` prop changed. */
	| { type: "syncCurrent"; id: string | null }
	/** The `questions` prop changed. */
	| { type: "syncQuestions"; questions: readonly Question[] };

const NO_ERRORS: Readonly<Record<string, ValidationError>> = {};
const NO_ANSWERS: Answers = {};

export type CreateQuestionnaireStateOptions = {
	questions: readonly Question[];
	answers?: Answers;
	currentId?: string | null;
	isLinear?: boolean;
};

/** The starting state: on `currentId` when visible, else the next visible question after it. */
export function createQuestionnaireState({
	questions,
	answers = NO_ANSWERS,
	currentId = null,
	isLinear = true,
}: CreateQuestionnaireStateOptions): QuestionnaireState {
	return settle({
		answers,
		blockedCount: 0,
		currentId,
		direction: "forward",
		errors: NO_ERRORS,
		history: [],
		initial: { answers, currentId },
		isLinear,
		questions,
		status: "active",
	});
}

/**
 * Brings derived fields back in line after answers or questions change.
 *
 * A current question that became hidden gives way to the nearest visible one
 * after it (or before it, at the end); history and errors lose their hidden
 * entries.
 */
function settle(state: QuestionnaireState): QuestionnaireState {
	const visible = visibleIds(state.questions, state.answers);
	let currentId = state.currentId;
	if (currentId === null || !visible.has(currentId)) {
		currentId =
			getNextId(state.questions, state.answers, currentId) ?? getPrevId(state.questions, state.answers, currentId);
		if (currentId === null) currentId = getNextId(state.questions, state.answers, null);
	}
	const history = state.history.filter((id) => visible.has(id) && id !== currentId);
	const errorEntries = Object.entries(state.errors);
	const keptErrors = errorEntries.filter(([id]) => visible.has(id));
	const errors = keptErrors.length === errorEntries.length ? state.errors : Object.fromEntries(keptErrors);
	const isSame = currentId === state.currentId && history.length === state.history.length && errors === state.errors;
	return isSame ? state : { ...state, currentId, errors, history };
}

function withoutError(
	errors: Readonly<Record<string, ValidationError>>,
	id: string
): Readonly<Record<string, ValidationError>> {
	if (!(id in errors)) return errors;
	const { [id]: _removed, ...rest } = errors;
	return rest;
}

function withAnswer(answers: Answers, id: string, answer: Answer | undefined): Answers {
	if (answer === undefined) {
		if (!(id in answers)) return answers;
		const { [id]: _removed, ...rest } = answers;
		return rest;
	}
	return { ...answers, [id]: answer };
}

function currentQuestion(state: QuestionnaireState): Question | undefined {
	return state.questions.find((question) => question.id === state.currentId);
}

/** Moves forward to `id`, recording the current question in history. */
function advanceTo(state: QuestionnaireState, id: string): QuestionnaireState {
	const history = state.currentId === null ? state.history : [...state.history, state.currentId];
	return { ...state, currentId: id, direction: "forward", history };
}

/** Moves to a question already in history, dropping it and everything after it. */
function returnTo(state: QuestionnaireState, id: string): QuestionnaireState {
	const at = state.history.lastIndexOf(id);
	return { ...state, currentId: id, direction: "backward", history: state.history.slice(0, Math.max(0, at)) };
}

function block(state: QuestionnaireState, id: string, error: ValidationError): QuestionnaireState {
	return { ...state, blockedCount: state.blockedCount + 1, errors: { ...state.errors, [id]: error } };
}

function reduceAnswer(state: QuestionnaireState, id: string, raw: Answer | undefined): QuestionnaireState {
	const answer = normalizeAnswer(raw);
	const previous = state.answers[id];
	const answers = pruneAnswers(state.questions, withAnswer(state.answers, id, answer));
	const question = state.questions.find((candidate) => candidate.id === id);
	const error = question ? validateAnswer(question, answer) : null;

	let errors = withoutError(state.errors, id);
	const wasCleared = answer === undefined && previous !== undefined && previous.kind !== "skipped";
	if (error && (id in state.errors || wasCleared)) errors = { ...errors, [id]: error };

	return settle({ ...state, answers, errors });
}

function reduceNext(state: QuestionnaireState): QuestionnaireState {
	const question = currentQuestion(state);
	if (!question) return state;
	const nextId = getNextId(state.questions, state.answers, question.id);
	if (nextId === null) return state;
	const error = validateAnswer(question, state.answers[question.id]);
	if (error) return block(state, question.id, error);
	return advanceTo({ ...state, errors: withoutError(state.errors, question.id) }, nextId);
}

function reduceSkip(state: QuestionnaireState): QuestionnaireState {
	const question = currentQuestion(state);
	if (!question || question.isRequired) return state;
	const answers = pruneAnswers(state.questions, withAnswer(state.answers, question.id, { kind: "skipped" }));
	const skipped = settle({ ...state, answers, errors: withoutError(state.errors, question.id) });
	const nextId = getNextId(skipped.questions, skipped.answers, question.id);
	return nextId === null ? skipped : advanceTo(skipped, nextId);
}

function reduceBack(state: QuestionnaireState): QuestionnaireState {
	const visited = state.history.at(-1);
	if (visited !== undefined) return returnTo(state, visited);
	const previous = getPrevId(state.questions, state.answers, state.currentId);
	return previous === null ? state : { ...state, currentId: previous, direction: "backward" };
}

function reduceGoTo(state: QuestionnaireState, id: string): QuestionnaireState {
	if (id === state.currentId) return state;
	if (!visibleIds(state.questions, state.answers).has(id)) return state;
	if (state.history.includes(id)) return returnTo(state, id);
	if (!state.isLinear) return advanceTo(state, id);
	const question = currentQuestion(state);
	if (!question || id !== getNextId(state.questions, state.answers, question.id)) return state;
	if (validateAnswer(question, state.answers[question.id])) return state;
	return advanceTo({ ...state, errors: withoutError(state.errors, question.id) }, id);
}

/** Moves to `id` without validating — into history when it was visited, forward otherwise. */
function moveTo(state: QuestionnaireState, id: string, direction: QuestionnaireDirection): QuestionnaireState {
	if (id === state.currentId) return state;
	if (state.history.includes(id)) return returnTo(state, id);
	return direction === "forward" ? advanceTo(state, id) : { ...state, currentId: id, direction };
}

function reduceSubmit(state: QuestionnaireState): QuestionnaireState {
	const invalid = getFirstInvalid(state.questions, state.answers);
	if (!invalid) return state.status === "submitted" ? state : { ...state, status: "submitted" };
	return block(moveTo(state, invalid.question.id, "backward"), invalid.question.id, invalid.error);
}

function reduceSyncCurrent(state: QuestionnaireState, id: string | null): QuestionnaireState {
	if (id === state.currentId) return state;
	if (id === null) return settle({ ...state, currentId: null, history: [] });
	if (!visibleIds(state.questions, state.answers).has(id)) return state;
	return moveTo(state, id, "forward");
}

/**
 * The questionnaire's state machine.
 *
 * Every action returns the same object when it changes nothing, so a caller can
 * tell a no-op from a move by reference.
 */
export function questionnaireReducer(state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState {
	switch (action.type) {
		case "answer":
			return reduceAnswer(state, action.id, action.answer);
		case "next":
			return reduceNext(state);
		case "skip":
			return reduceSkip(state);
		case "back":
			return reduceBack(state);
		case "goTo":
			return reduceGoTo(state, action.id);
		case "submit":
			return reduceSubmit(state);
		case "reopen":
			return state.status === "active" ? state : { ...state, status: "active" };
		case "reset":
			return createQuestionnaireState({
				answers: state.initial.answers,
				currentId: state.initial.currentId,
				isLinear: state.isLinear,
				questions: state.questions,
			});
		case "syncAnswers":
			return syncAnswers(state, action.answers);
		case "syncCurrent":
			return reduceSyncCurrent(state, action.id);
		case "syncQuestions":
			return action.questions === state.questions ? state : settle({ ...state, questions: action.questions });
	}
}

/**
 * Replaces the answers wholesale — a controlled `answers` prop arriving.
 *
 * The answers are taken as given, not pruned: they belong to the caller.
 * Visibility is re-derived from them, and a current question that became
 * hidden gives way to the nearest visible one.
 */
export function syncAnswers(state: QuestionnaireState, answers: Answers): QuestionnaireState {
	return answers === state.answers ? state : settle({ ...state, answers });
}

/**
 * What `onSubmit` receives: the answers to visible questions only, with skipped
 * ones kept as `skipped` and unanswered optional ones absent.
 */
export function getSubmission(state: QuestionnaireState): Answers {
	const submission: Record<string, Answer> = {};
	for (const question of getVisibleQuestions(state.questions, state.answers)) {
		const answer = state.answers[question.id];
		if (answer) submission[question.id] = answer;
	}
	return submission;
}

/** Whether Back has anywhere to go. */
export function canBack(state: QuestionnaireState): boolean {
	return state.history.length > 0 || getPrevId(state.questions, state.answers, state.currentId) !== null;
}

/** Whether the current question can be skipped — it exists and is optional. */
export function canSkip(state: QuestionnaireState): boolean {
	const question = currentQuestion(state);
	return question !== undefined && !question.isRequired;
}

// ─── Wording ─────────────────────────────────────────────────────────────────

/** "Question 2 of 5" — the count readout and the question's spoken prefix. Empty with no questions. */
export function formatQuestionCount(progress: QuestionnaireProgress): string {
	return progress.total === 0 ? "" : `Question ${progress.index + 1} of ${progress.total}`;
}

/** "7 out of 10" — what a screen reader says for one scale button. */
export function formatScaleValue(value: number, max: number): string {
	return `${value} out of ${max}`;
}

/**
 * The most buttons a scale draws. Past this a scale is a slider, and a typo
 * like `max: 1000` would otherwise mount a thousand buttons.
 */
export const QUESTIONNAIRE_SCALE_MAX_STEPS = 21;

/** Every integer from `min` to `max` inclusive — a scale's buttons. Empty for an inverted range. */
export function getScaleValues(min: number, max: number): number[] {
	const start = Math.ceil(min);
	const end = Math.floor(max);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
	const count = Math.min(end - start + 1, QUESTIONNAIRE_SCALE_MAX_STEPS);
	return Array.from({ length: count }, (_, index) => start + index);
}

// ─── Answer adapters ─────────────────────────────────────────────────────────

type ChoiceQuestion = Extract<Question, { kind: "single" | "multiple" }>;

function otherValueOf(question: Question): string | undefined {
	if (question.kind !== "single" && question.kind !== "multiple") return undefined;
	return question.options.find((option) => option.isOther)?.value;
}

/** Whether the answer has the question's free-text "Other" option chosen. */
export function isOtherSelected(question: Question, answer: Answer | undefined): boolean {
	const other = otherValueOf(question);
	if (other === undefined || !answer) return false;
	if (answer.kind === "single") return answer.value === other;
	if (answer.kind === "multiple") return answer.values.includes(other);
	return false;
}

/** A `single` answer for `value`, carrying the previous "Other" text only while Other stays chosen. */
export function chooseSingle(question: ChoiceQuestion, previous: Answer | undefined, value: string): Answer {
	const answer: Answer = { kind: "single", value };
	const other = previous && (previous.kind === "single" || previous.kind === "multiple") ? previous.other : undefined;
	return other !== undefined && isOtherSelected(question, answer) ? { ...answer, other } : answer;
}

/** A `multiple` answer for `values` — `undefined` when none are chosen, so clearing every box clears the answer. */
export function chooseMultiple(
	question: ChoiceQuestion,
	previous: Answer | undefined,
	values: readonly string[]
): Answer | undefined {
	if (values.length === 0) return undefined;
	const answer: Answer = { kind: "multiple", values };
	const other = previous && (previous.kind === "single" || previous.kind === "multiple") ? previous.other : undefined;
	return other !== undefined && isOtherSelected(question, answer) ? { ...answer, other } : answer;
}

/** The answer with its "Other" text replaced. An empty string removes it; a non-choice answer is returned as is. */
export function setOtherText(answer: Answer | undefined, text: string): Answer | undefined {
	if (!answer || (answer.kind !== "single" && answer.kind !== "multiple")) return answer;
	const { other: _previous, ...rest } = answer;
	return text === "" ? rest : { ...rest, other: text };
}

/** The selection a choice control draws: a list of strings for single, multiple, yes/no and scale answers. */
export function getSelectedValues(answer: Answer | undefined): string[] {
	if (!answer) return [];
	switch (answer.kind) {
		case "single":
		case "yesNo":
			return [answer.value];
		case "multiple":
			return [...answer.values];
		case "scale":
			return [String(answer.value)];
		default:
			return [];
	}
}
