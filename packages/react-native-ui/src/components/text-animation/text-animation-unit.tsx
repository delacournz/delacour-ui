import type { ReactElement } from "react";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTextClass } from "../text/text.context";
import { resolveTextClass, TEXT_MAX_FONT_SIZE_MULTIPLIER } from "../text/text.variants";
import type { TextAnimationBase } from "./text-animation.types";
import {
	resolveEffectFrame,
	resolveUnitProgress,
	type TextAnimationEffect,
	type TypingSample,
} from "./text-animation.variants";

/**
 * The class every text a part draws carries: the `Text` cascade, resolved once
 * per part from its axes and whatever an enclosing `Text` published.
 */
export function useTextAnimationClass({
	variant,
	size,
	weight,
	color,
	align,
	transform,
	className,
}: Pick<TextAnimationBase, "variant" | "size" | "weight" | "color" | "align" | "transform" | "className">): string {
	const inherited = useTextClass();
	return resolveTextClass({
		align,
		className,
		color,
		inherited,
		isNested: inherited !== undefined,
		size,
		transform,
		variant,
		weight,
	});
}

/** How one unit is driven: entering on the reveal clock, or shown once the typed count reaches it. */
export type TextAnimationUnitDrive =
	| {
			kind: "reveal";
			elapsed: SharedValue<number>;
			delayMs: number;
			staggerMs: number;
			durationMs: number;
			effect: TextAnimationEffect;
	  }
	| {
			kind: "typing";
			sample: SharedValue<TypingSample>;
			/** The phrase these cells belong to — a frame sampled past a phrase boundary shows nothing. */
			phraseIndex: number;
			index: number;
	  };

export type TextAnimationUnitProps = {
	children: string;
	className: string;
	drive: TextAnimationUnitDrive;
	/** Draws the unit at rest, whatever the clock says — calm motion. */
	isAtRest: boolean;
	numberOfLines?: number;
	allowFontScaling?: boolean;
	maxFontSizeMultiplier?: number | null;
};

/**
 * One animated piece of text — a word, a grapheme, a line, or a typed cell.
 *
 * A cheap leaf on purpose: one `Animated.Text` and one animated style that
 * writes only `opacity` and `transform`. Its layout is final from the first
 * frame — it is laid out at opacity 0 — so the paragraph never reflows while
 * it enters or types.
 */
export function TextAnimationUnit({
	children,
	className,
	drive,
	isAtRest,
	numberOfLines,
	allowFontScaling,
	maxFontSizeMultiplier = TEXT_MAX_FONT_SIZE_MULTIPLIER,
}: TextAnimationUnitProps): ReactElement {
	const style = useAnimatedStyle(() => {
		if (drive.kind === "typing") {
			const sample = drive.sample.value;
			const shown = isAtRest || (sample.phraseIndex === drive.phraseIndex && drive.index < sample.visibleCount);
			return { opacity: shown ? 1 : 0 };
		}
		const t = isAtRest ? 1 : resolveUnitProgress(drive.elapsed.value, drive.delayMs, drive.staggerMs, drive.durationMs);
		const frame = resolveEffectFrame(drive.effect, t);
		return {
			opacity: frame.opacity,
			transform: [{ translateX: frame.translateX }, { translateY: frame.translateY }, { scale: frame.scale }],
		};
	});

	return (
		<Animated.Text
			allowFontScaling={allowFontScaling}
			className={className}
			maxFontSizeMultiplier={maxFontSizeMultiplier}
			numberOfLines={numberOfLines}
			style={style}
		>
			{children}
		</Animated.Text>
	);
}
TextAnimationUnit.displayName = "DelacourUI.TextAnimation.Unit";
