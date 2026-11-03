import { Fragment, type ReactElement, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Text as NativeText, type TextLayoutEvent, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { TEXT_MAX_FONT_SIZE_MULTIPLIER } from "../text/text.variants";
import type { TextAnimationBase } from "./text-animation.types";
import {
	capitalizeWords,
	hashText,
	isCapitalizedClass,
	resolveRowJustify,
	resolveStaggerDelays,
	resolveTotalDuration,
	splitGraphemes,
	splitText,
	TEXT_ANIMATION_DURATION_MS,
	TEXT_ANIMATION_STAGGER,
	type TextAnimationEffect,
	type TextAnimationOrder,
	type TextAnimationUnit as TextAnimationUnitKind,
	textAnimationVariants,
} from "./text-animation.variants";
import { useTextAnimationClock } from "./text-animation-clock";
import { TextAnimationCounting } from "./text-animation-counting";
import { TextAnimationRolling } from "./text-animation-rolling";
import { TextAnimationRotating } from "./text-animation-rotating";
import { TextAnimationTyping } from "./text-animation-typing";
import { TextAnimationUnit, useTextAnimationClass } from "./text-animation-unit";

export type TextAnimationRevealProps = TextAnimationBase & {
	children: string;
	/** What enters as one piece. Default `word`. */
	split?: TextAnimationUnitKind;
	/** How each piece arrives. Default `{ kind: "fade" }`. */
	effect?: TextAnimationEffect;
	/** Delay between consecutive units, ms. Default 40 for `character`, 90 for `word` and `line`. */
	stagger?: number;
	/** Which unit enters first. Default `forward`. */
	order?: TextAnimationOrder;
	/** One unit's entrance, ms. Default 420. */
	durationMs?: number;
	/** Before the first unit, ms. Default 0. */
	delayMs?: number;
	/** `false` holds the text hidden; flipping it to `true` plays from the start. Default `true`. */
	isActive?: boolean;
	/** Called on the JS thread once the last unit lands — once per play, never for a superseded one. */
	onFinished?: () => void;
};

const DEFAULT_EFFECT: TextAnimationEffect = { kind: "fade" };

const slots = textAnimationVariants();

/** A rendered piece of a reveal: an animated unit, the whitespace between them, or a hard break. */
type RevealPiece =
	| { kind: "unit"; key: string; text: string; index: number }
	| { kind: "word"; key: string; graphemes: readonly { text: string; index: number }[] }
	| { kind: "space"; key: string; text: string }
	| { kind: "break"; key: string }
	| { kind: "blank"; key: string };

/**
 * The pieces a word or character split renders, with each animated unit's
 * index in entry order. Whitespace stays static — it is where the row wraps.
 * A wrapping row has no line feed of its own, so a newline that ends a line
 * becomes a full-width break, and one that ends an empty line becomes a blank
 * line one text line tall, so `A\n\nB` keeps its gap and a leading newline
 * keeps its line.
 */
function buildPieces(text: string, split: "word" | "character"): { pieces: RevealPiece[]; count: number } {
	const pieces: RevealPiece[] = [];
	let count = 0;
	let isLineEmpty = true;
	splitText(text, "word").forEach((unit, i) => {
		const key = `${i}`;
		if (unit.isSpace) {
			const lines = unit.text.split("\n");
			lines.forEach((run, j) => {
				if (j > 0) {
					pieces.push({ kind: isLineEmpty ? "blank" : "break", key: `${key}-b${j}` });
					isLineEmpty = true;
				}
				if (run !== "") {
					pieces.push({ kind: "space", key: `${key}-s${j}`, text: run });
					isLineEmpty = false;
				}
			});
			return;
		}
		isLineEmpty = false;
		if (split === "word") {
			pieces.push({ kind: "unit", key, text: unit.text, index: count });
			count += 1;
			return;
		}
		const graphemes = splitGraphemes(unit.text).map((grapheme) => {
			const entry = { text: grapheme, index: count };
			count += 1;
			return entry;
		});
		pieces.push({ kind: "word", key, graphemes });
	});
	return { pieces, count };
}

type UnitShared = {
	className: string;
	elapsed: SharedValue<number>;
	delayMs: number;
	durationMs: number;
	effect: TextAnimationEffect;
	isAtRest: boolean;
	delays: readonly number[];
	allowFontScaling?: boolean;
	maxFontSizeMultiplier?: number;
};

function renderUnit(shared: UnitShared, key: string, text: string, index: number, numberOfLines?: number): ReactNode {
	return (
		<TextAnimationUnit
			allowFontScaling={shared.allowFontScaling}
			className={shared.className}
			drive={{
				kind: "reveal",
				elapsed: shared.elapsed,
				delayMs: shared.delayMs,
				staggerMs: shared.delays[index] ?? 0,
				durationMs: shared.durationMs,
				effect: shared.effect,
			}}
			isAtRest={shared.isAtRest}
			key={key}
			maxFontSizeMultiplier={shared.maxFontSizeMultiplier}
			numberOfLines={numberOfLines}
		>
			{text}
		</TextAnimationUnit>
	);
}

function TextAnimationReveal({
	children,
	split = "word",
	effect = DEFAULT_EFFECT,
	stagger,
	order = "forward",
	durationMs = TEXT_ANIMATION_DURATION_MS,
	delayMs = 0,
	isActive = true,
	onFinished,
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
}: TextAnimationRevealProps): ReactElement {
	const isCalm = useCalmMotion();
	const resolvedClass = useTextAnimationClass({ variant, size, weight, color, align, transform, className });
	// One `Text` per grapheme would capitalize every letter, so a character
	// split capitalizes the string itself and turns the style off.
	const isCapitalized = split === "character" && isCapitalizedClass(resolvedClass);
	const textClass = isCapitalized ? cn(resolvedClass, "normal-case") : resolvedClass;
	const text = isCapitalized ? capitalizeWords(children) : children;
	const step = stagger ?? TEXT_ANIMATION_STAGGER[split];
	// One cap for the units, the whitespace between them and the measuring copy,
	// so line breaks and spaces match the animated text at any system size.
	const fontCap = maxFontSizeMultiplier ?? TEXT_MAX_FONT_SIZE_MULTIPLIER;
	// Lines belong to the text they were measured from; a new text waits for its own.
	const [measured, setMeasured] = useState<{ text: string; lines: readonly string[] } | null>(null);
	const lines = measured?.text === children ? measured.lines : null;

	const { pieces, count: pieceCount } = useMemo(
		() => (split === "line" ? { pieces: [], count: 0 } : buildPieces(text, split)),
		[text, split]
	);
	const count = split === "line" ? (lines?.length ?? 0) : pieceCount;
	const delays = useMemo(
		() => resolveStaggerDelays(count, step, order, hashText(children)),
		[count, step, order, children]
	);
	const total = resolveTotalDuration(count, step, durationMs, delayMs, order);

	const runKey = `${children}|${split}|${order}|${step}|${durationMs}|${delayMs}|${JSON.stringify(effect)}|${isActive}`;

	// Every change of `runKey` is a new play, inactive ones included, so
	// `isActive` going false → true replays even though the key repeats. The
	// play id is updated during render, so no frame shows the last play at rest.
	const [play, setPlay] = useState({ runKey, id: 0 });
	const current = play.runKey === runKey ? play : { runKey, id: play.id + 1 };
	if (current !== play) setPlay(current);
	const playId = current.id;

	// One guard per play, shared by the clock and the calm path, so toggling calm
	// motion during or after a play never reports the same play twice.
	const reportedPlayRef = useRef<number | null>(null);
	const [finishedPlay, setFinishedPlay] = useState<number | null>(null);
	const finish = () => {
		if (reportedPlayRef.current === playId) return;
		reportedPlayRef.current = playId;
		setFinishedPlay(playId);
		onFinished?.();
	};

	// A `line` split has no units until the paragraph is measured, so its clock
	// waits for them rather than reaching a zero limit on an empty reveal.
	const isMeasured = split !== "line" || lines !== null;
	const elapsed = useTextAnimationClock({
		isRunning: isActive && !isCalm && isMeasured,
		runKey,
		limitMs: total,
		onLimit: finish,
	});

	// Calm motion skips the clock, so it reports the finish itself.
	// biome-ignore lint/correctness/useExhaustiveDependencies: finish is read, not a trigger
	useEffect(() => {
		if (isCalm && isActive) finish();
	}, [isCalm, isActive, playId]);

	const shared: UnitShared = {
		className: textClass,
		elapsed,
		delayMs,
		durationMs,
		effect,
		// After the finish a remeasure — new line breaks — shows its lines whole
		// instead of partly revealed on a clock that has stopped.
		isAtRest: isCalm || finishedPlay === playId,
		delays,
		allowFontScaling,
		maxFontSizeMultiplier: fontCap,
	};

	const onTextLayout = (event: TextLayoutEvent) => {
		const next = event.nativeEvent.lines.map((line) => line.text.replace(/\s+$/, ""));
		setMeasured((previous) =>
			previous !== null &&
			previous.text === children &&
			previous.lines.length === next.length &&
			previous.lines.every((line, i) => line === next[i])
				? previous
				: { text: children, lines: next }
		);
	};

	// A `line` split cannot know its breaks until the platform has laid the
	// paragraph out, so a hidden copy reports them and the lines render over it.
	// Until they arrive the copy holds the space, in flow, so nothing jumps.
	const content =
		split === "line" ? (
			<View className={slots.lines()}>
				<NativeText
					allowFontScaling={allowFontScaling}
					className={cn(textClass, lines === null ? "opacity-0" : slots.measure())}
					maxFontSizeMultiplier={fontCap}
					onTextLayout={onTextLayout}
				>
					{children}
				</NativeText>
				{(lines ?? []).map((line, i) => renderUnit(shared, `${i}`, line, i, 1))}
			</View>
		) : (
			<View className={cn(slots.row(), resolveRowJustify(textClass))}>
				{pieces.map((piece) => {
					if (piece.kind === "break") return <View className="w-full" key={piece.key} />;
					if (piece.kind === "blank") {
						return (
							<NativeText
								allowFontScaling={allowFontScaling}
								className={cn(textClass, "w-full")}
								key={piece.key}
								maxFontSizeMultiplier={fontCap}
							>
								{"\u200b"}
							</NativeText>
						);
					}
					if (piece.kind === "space") {
						return (
							<NativeText
								allowFontScaling={allowFontScaling}
								className={textClass}
								key={piece.key}
								maxFontSizeMultiplier={fontCap}
							>
								{piece.text}
							</NativeText>
						);
					}
					if (piece.kind === "unit") return renderUnit(shared, piece.key, piece.text, piece.index);
					return (
						<View className={slots.word()} key={piece.key}>
							{piece.graphemes.map((grapheme) => (
								<Fragment key={grapheme.index}>
									{renderUnit(shared, `${grapheme.index}`, grapheme.text, grapheme.index)}
								</Fragment>
							))}
						</View>
					);
				})}
			</View>
		);

	return (
		<View
			accessibilityHint={accessibilityHint}
			accessibilityLabel={children}
			accessibilityRole="text"
			accessible
			nativeID={nativeID}
			testID={testID}
		>
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				{content}
			</View>
		</View>
	);
}

/**
 * Text that arrives — five ways, on one clock.
 *
 * The root reveals a string unit by unit — by word, character or line — with a
 * fade, slide or scale, staggered in any order. The parts type a phrase,
 * rotate a word in place, count a number and roll an odometer.
 *
 * Every part ends on the real final text: under reduce motion or
 * `isMotionCalm` it shows that text on the first frame, an interrupted run
 * lands on the new text, and a screen reader hears the final string once —
 * never a half-typed word or an in-flight digit.
 *
 * Every piece of text takes the `Text` axes and joins the `Text` cascade.
 *
 * @example
 * <TextAnimation effect={{ kind: "slide", from: "down" }} size="2xl" weight="bold">
 *   Ship it before lunch
 * </TextAnimation>
 *
 * @example
 * <TextAnimation.Typing>{["Design systems", "Native apps"]}</TextAnimation.Typing>
 *
 * @example
 * <TextAnimation.Counting format={{ prefix: "$", decimals: 2 }} value={1284.5} />
 */
export const TextAnimation = Object.assign(TextAnimationReveal, {
	/** Types a phrase, or cycles several, with a caret. */
	Typing: TextAnimationTyping,
	/** Swaps one phrase for the next in place. */
	Rotating: TextAnimationRotating,
	/** Tweens a formatted number. */
	Counting: TextAnimationCounting,
	/** Odometer digit wheels. */
	Rolling: TextAnimationRolling,
	displayName: "DelacourUI.TextAnimation",
});
