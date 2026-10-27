import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, Text as NativeText, View } from "react-native";
import { type SharedValue, useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import type { TextAnimationBase } from "./text-animation.types";
import {
	buildTypingTimeline,
	resolveCaretClass,
	resolveRowJustify,
	resolveTypingRest,
	sampleTypingTimeline,
	splitGraphemes,
	splitText,
	TEXT_ANIMATION_BLINK_MS,
	TEXT_ANIMATION_ERASE_SPEED,
	TEXT_ANIMATION_HOLD_MS,
	TEXT_ANIMATION_TYPING_SPEED,
	type TextAnimationCaret as TextAnimationCaretShape,
	type TypingSample,
	textAnimationVariants,
} from "./text-animation.variants";
import { TextAnimationCaret } from "./text-animation-caret";
import { useTextAnimationClock } from "./text-animation-clock";
import { TextAnimationUnit, useTextAnimationClass } from "./text-animation-unit";

export type TextAnimationTypingProps = TextAnimationBase & {
	/** One phrase types once and holds. Several cycle. */
	children: string | readonly string[];
	/** Default `{ kind: "bar" }`. */
	caret?: TextAnimationCaretShape;
	/** Characters per second. Default 22. */
	speed?: number;
	/** Erase speed, characters per second. `0` skips the erase: the next phrase replaces the last. Default 40. */
	eraseSpeed?: number;
	/** The pause on a finished phrase, ms. Default 1400. */
	holdMs?: number;
	/** Cycle back to the first phrase after the last. Default `true` when there are several. */
	loop?: boolean;
	/** `false` holds the field empty, caret showing; flipping it to `true` types from the start. Default `true`. */
	isActive?: boolean;
	/** Called on the JS thread each time a phrase finishes typing, with its index. */
	onPhraseTyped?: (index: number) => void;
};

/** Joins phrases into one dependency key. A control character no phrase carries. */
const PHRASE_SEPARATOR = "\u0000";

const DEFAULT_CARET: TextAnimationCaretShape = { kind: "bar" };

const slots = textAnimationVariants();

/** One typed cell: a grapheme with its index in the phrase. */
type TypingCell = { text: string; index: number };

/** A run of cells the row lays out: a word held on one line, whitespace it may wrap at, or a hard break. */
type TypingGroup =
	| { kind: "word"; key: string; cells: readonly TypingCell[] }
	| { kind: "space"; key: string; cells: readonly TypingCell[] }
	| { kind: "break"; key: string; cell: TypingCell };

/**
 * A phrase as the groups its cells render in. Every grapheme is a cell —
 * spaces too, since a space is typed — and a newline is a full-width break
 * that still owns its index, so the typed count lines up with the phrase.
 */
function buildGroups(phrase: string): readonly TypingGroup[] {
	const groups: TypingGroup[] = [];
	let index = 0;
	splitText(phrase, "word").forEach((unit, i) => {
		const cells: TypingCell[] = [];
		const flush = (suffix: string) => {
			if (cells.length === 0) return;
			groups.push({ kind: unit.isSpace ? "space" : "word", key: `${i}${suffix}`, cells: [...cells] });
			cells.length = 0;
		};
		splitGraphemes(unit.text).forEach((grapheme, j) => {
			if (grapheme === "\n" || grapheme === "\r\n") {
				flush(`-${j}`);
				groups.push({ kind: "break", key: `${i}-b${j}`, cell: { text: "", index } });
			} else {
				cells.push({ text: grapheme, index });
			}
			index += 1;
		});
		flush("");
	});
	return groups;
}

type CellShared = {
	textClass: string;
	caretClass: string;
	caretKind: TextAnimationCaretShape["kind"];
	blinkMs: number;
	elapsed: SharedValue<number>;
	sample: SharedValue<TypingSample>;
	phraseIndex: number;
	isAtRest: boolean;
	allowFontScaling?: boolean;
	maxFontSizeMultiplier?: number;
};

/** The caret drawn at the right edge of a cell once the typed count reaches `visibleAt`. */
function renderCaret(shared: CellShared, visibleAt: number, measureText: string): ReactNode {
	if (shared.caretKind === "none") return null;
	return (
		<TextAnimationCaret
			blinkMs={shared.blinkMs}
			className={shared.caretClass}
			elapsed={shared.elapsed}
			isSteady={shared.isAtRest}
			kind={shared.caretKind}
			measureText={measureText === "" || measureText === " " ? "M" : measureText}
			phraseIndex={shared.phraseIndex}
			sample={shared.sample}
			textClassName={shared.textClass}
			visibleAt={visibleAt}
		/>
	);
}

function renderCell(shared: CellShared, cell: TypingCell, next: string): ReactNode {
	return (
		<View className="relative" key={cell.index}>
			<TextAnimationUnit
				allowFontScaling={shared.allowFontScaling}
				className={shared.textClass}
				drive={{ kind: "typing", sample: shared.sample, phraseIndex: shared.phraseIndex, index: cell.index }}
				isAtRest={shared.isAtRest}
				maxFontSizeMultiplier={shared.maxFontSizeMultiplier}
			>
				{cell.text}
			</TextAnimationUnit>
			{renderCaret(shared, cell.index + 1, next)}
		</View>
	);
}

/**
 * Types a phrase, or cycles several, with a blinking caret.
 *
 * Every character of the current phrase is laid out from the first frame at
 * opacity 0 and shown as the typed count passes it, so a wrapped paragraph
 * never re-wraps while it types. The type → hold → erase timeline is built
 * once on the JS thread and sampled on the UI thread; only a phrase boundary
 * crosses back, to swap which string is rendered. The box holds the tallest
 * phrase's height, so a short phrase following a long one moves nothing.
 */
export function TextAnimationTyping({
	children,
	caret = DEFAULT_CARET,
	speed = TEXT_ANIMATION_TYPING_SPEED,
	eraseSpeed = TEXT_ANIMATION_ERASE_SPEED,
	holdMs = TEXT_ANIMATION_HOLD_MS,
	loop,
	isActive = true,
	onPhraseTyped,
	variant,
	size,
	weight,
	color,
	align,
	transform,
	className,
	allowFontScaling,
	maxFontSizeMultiplier,
	testID,
	nativeID,
	accessibilityHint,
}: TextAnimationTypingProps): ReactElement {
	const isCalm = useCalmMotion();
	const textClass = useTextAnimationClass({ variant, size, weight, color, align, transform, className });
	// The phrases' text is their identity, not the array: a fresh literal each
	// render must not restart the timeline.
	const phrasesKey = typeof children === "string" ? children : children.join(PHRASE_SEPARATOR);
	const phrases = useMemo<readonly string[]>(() => phrasesKey.split(PHRASE_SEPARATOR), [phrasesKey]);
	const isLooping = loop ?? phrases.length > 1;
	const timeline = useMemo(
		() => buildTypingTimeline(phrases, { speed, eraseSpeed, holdMs, loop: isLooping }),
		[phrases, speed, eraseSpeed, holdMs, isLooping]
	);
	const rest = resolveTypingRest(timeline);
	const runKey = `${phrasesKey}|${speed}|${eraseSpeed}|${holdMs}|${isLooping}|${isActive}`;

	const elapsed = useTextAnimationClock({
		isRunning: isActive && !isCalm,
		runKey,
		limitMs: Number.POSITIVE_INFINITY,
	});

	const sample = useDerivedValue<TypingSample>(() =>
		isCalm ? resolveTypingRest(timeline) : sampleTypingTimeline(timeline, elapsed.value)
	);

	const [phraseIndex, setPhraseIndex] = useState(isCalm ? rest.phraseIndex : 0);
	const runRef = useRef(runKey);
	runRef.current = runKey;
	const onPhraseTypedRef = useRef(onPhraseTyped);
	onPhraseTypedRef.current = onPhraseTyped;

	const handlePhrase = useCallback((index: number, run: string) => {
		if (run === runRef.current) setPhraseIndex(index);
	}, []);
	const handleTyped = useCallback((index: number, run: string) => {
		if (run === runRef.current) onPhraseTypedRef.current?.(index);
	}, []);

	useAnimatedReaction(
		() => sample.value,
		(current, previous) => {
			if (previous === null || current.phraseIndex !== previous.phraseIndex) {
				scheduleOnRN(handlePhrase, current.phraseIndex, runKey);
			}
			if (previous !== null && previous.phase === "typing" && current.phase !== "typing") {
				scheduleOnRN(handleTyped, previous.phraseIndex, runKey);
			}
		}
	);

	useEffect(() => {
		if (isCalm) setPhraseIndex(rest.phraseIndex);
	}, [isCalm, rest.phraseIndex]);

	const [heights, setHeights] = useState<readonly number[]>([]);
	const tallest = heights.reduce((max, height) => Math.max(max, height), 0);
	const onMeasure = (index: number) => (event: LayoutChangeEvent) => {
		const height = event.nativeEvent.layout.height;
		setHeights((previous) => {
			if (previous[index] === height) return previous;
			const next = [...previous];
			next[index] = height;
			return next;
		});
	};

	const current = phrases[Math.min(phraseIndex, phrases.length - 1)] ?? "";
	const groups = useMemo(() => buildGroups(current), [current]);
	const graphemes = useMemo(() => splitGraphemes(current), [current]);
	const blinkMs = caret.kind === "none" ? 0 : (caret.blinkMs ?? TEXT_ANIMATION_BLINK_MS);
	const shared: CellShared = {
		textClass,
		caretClass: resolveCaretClass(caret.kind, color),
		caretKind: caret.kind,
		blinkMs,
		elapsed,
		sample,
		phraseIndex,
		isAtRest: isCalm,
		allowFontScaling,
		maxFontSizeMultiplier,
	};
	const rowClass = cn(slots.row(), resolveRowJustify(align));

	// The row opens with an empty cell so a caret has somewhere to sit before
	// the first character lands. Behind it, one hidden copy of every phrase
	// reports its wrapped height, and the box keeps the tallest.
	return (
		<View
			accessibilityHint={accessibilityHint}
			accessibilityLabel={phrases[phrases.length - 1]}
			accessibilityRole="text"
			accessible
			nativeID={nativeID}
			testID={testID}
		>
			<View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={tallest > 0 ? { minHeight: tallest } : undefined}
			>
				{phrases.map((phrase, index) => (
					<View className={cn(rowClass, slots.measure())} key={`${index}-${phrase}`} onLayout={onMeasure(index)}>
						<NativeText allowFontScaling={allowFontScaling} className={textClass}>
							{phrase === "" ? "​" : phrase}
						</NativeText>
					</View>
				))}
				<View className={rowClass}>
					<View className="relative">
						<NativeText allowFontScaling={allowFontScaling} className={textClass}>
							{"​"}
						</NativeText>
						{renderCaret(shared, 0, graphemes[0] ?? "")}
					</View>
					{groups.map((group) => {
						if (group.kind === "break") {
							return (
								<View className="w-full" key={group.key}>
									{renderCell(shared, group.cell, graphemes[group.cell.index + 1] ?? "")}
								</View>
							);
						}
						const cells = group.cells.map((cell) => renderCell(shared, cell, graphemes[cell.index + 1] ?? ""));
						if (group.kind === "space") return cells;
						return (
							<View className={slots.word()} key={group.key}>
								{cells}
							</View>
						);
					})}
				</View>
			</View>
		</View>
	);
}
TextAnimationTyping.displayName = "DelacourUI.TextAnimation.Typing";
