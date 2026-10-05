import { Fragment, type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import { type NativeSyntheticEvent, Text as NativeText, type TextLayoutEventData, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { useTextAnimationClock } from "./text-animation-clock";
import { TextAnimationCounting } from "./text-animation-counting";
import { TextAnimationRolling } from "./text-animation-rolling";
import { TextAnimationRotating } from "./text-animation-rotating";
import { TextAnimationTyping } from "./text-animation-typing";
import { TextAnimationUnit, useTextAnimationClass } from "./text-animation-unit";
import type { TextAnimationBase } from "./text-animation.types";
import {
	hashText,
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
	| { kind: "break"; key: string };

/**
 * The pieces a word or character split renders, with each animated unit's
 * index in entry order. Whitespace stays static — it is where the row wraps —
 * and a newline becomes a full-width break, since a wrapping row has no line
 * feed of its own.
 */
function buildPieces(text: string, split: "word" | "character"): { pieces: RevealPiece[]; count: number } {
	const pieces: RevealPiece[] = [];
	let count = 0;
	splitText(text, "word").forEach((unit, i) => {
		const key = `${i}`;
		if (unit.isSpace) {
			const lines = unit.text.split("\n");
			lines.forEach((run, j) => {
				if (j > 0) pieces.push({ kind: "break", key: `${key}-b${j}` });
				if (run !== "") pieces.push({ kind: "space", key: `${key}-s${j}`, text: run });
			});
			return;
		}
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
	const textClass = useTextAnimationClass({ variant, size, weight, color, align, transform, className });
	const step = stagger ?? TEXT_ANIMATION_STAGGER[split];
	const [lines, setLines] = useState<readonly string[] | null>(null);

	const { pieces, count: pieceCount } = useMemo(
		() => (split === "line" ? { pieces: [], count: 0 } : buildPieces(children, split)),
		[children, split]
	);
	const count = split === "line" ? (lines?.length ?? 0) : pieceCount;
	const delays = useMemo(() => resolveStaggerDelays(count, step, order, hashText(children)), [count, step, order, children]);
	const total = resolveTotalDuration(count, step, durationMs, delayMs, order);

	const runKey = `${children}|${split}|${order}|${step}|${durationMs}|${delayMs}|${JSON.stringify(effect)}|${isActive}`;
	const elapsed = useTextAnimationClock({
		isRunning: isActive && !isCalm,
		runKey,
		limitMs: total,
		onLimit: onFinished,
	});

	// Calm motion skips the clock, so it reports the finish itself — once per text.
	// biome-ignore lint/correctness/useExhaustiveDependencies: onFinished is read, not a trigger
	useEffect(() => {
		if (isCalm && isActive) onFinished?.();
	}, [isCalm, isActive, runKey]);

	const shared: UnitShared = {
		className: textClass,
		elapsed,
		delayMs,
		durationMs,
		effect,
		isAtRest: isCalm,
		delays,
		allowFontScaling,
		maxFontSizeMultiplier,
	};

	const onTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
		const next = event.nativeEvent.lines.map((line) => line.text.replace(/\s+$/, ""));
		setLines((previous) =>
			previous !== null && previous.length === next.length && previous.every((line, i) => line === next[i])
				? previous
				: next
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
					maxFontSizeMultiplier={maxFontSizeMultiplier}
					onTextLayout={onTextLayout}
				>
					{children}
				</NativeText>
				{(lines ?? []).map((line, i) => renderUnit(shared, `${i}`, line, i, 1))}
			</View>
		) : (
			<View className={cn(slots.row(), resolveRowJustify(align))}>
				{pieces.map((piece) => {
					if (piece.kind === "break") return <View className="w-full" key={piece.key} />;
					if (piece.kind === "space") {
						return (
							<NativeText className={textClass} key={piece.key}>
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
