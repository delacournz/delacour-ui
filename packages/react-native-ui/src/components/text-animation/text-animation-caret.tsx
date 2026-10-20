import type { ReactElement } from "react";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { cn } from "../../lib/cn";
import {
	resolveCaretOpacity,
	type TextAnimationCaretKind,
	type TypingSample,
	textAnimationVariants,
} from "./text-animation.variants";

export type TextAnimationCaretProps = {
	kind: Exclude<TextAnimationCaretKind, "none">;
	/** The caret's fill, from `resolveCaretClass`. */
	className: string;
	elapsed: SharedValue<number>;
	sample: SharedValue<TypingSample>;
	blinkMs: number;
	phraseIndex: number;
	/** The typed count at which this caret is the visible one. */
	visibleAt: number;
	/** Holds the caret solid — calm motion, or a timeline at rest. */
	isSteady: boolean;
	/** The glyph a `block` caret is as wide as. */
	measureText: string;
	textClassName: string;
};

const { caret } = textAnimationVariants();

/**
 * The typing caret, drawn inside one cell rather than measured into place.
 *
 * Every cell carries one and only the cell the typed count has reached shows
 * it, so no character is ever measured and a wrapped line carries its caret
 * with it. A `block` is sized by an invisible copy of the next glyph, which is
 * what makes it as wide as the face's own characters at any font scale.
 */
export function TextAnimationCaret({
	kind,
	className,
	elapsed,
	sample,
	blinkMs,
	phraseIndex,
	visibleAt,
	isSteady,
	measureText,
	textClassName,
}: TextAnimationCaretProps): ReactElement {
	const style = useAnimatedStyle(() => {
		const current = sample.value;
		if (current.phraseIndex !== phraseIndex || current.visibleCount !== visibleAt) return { opacity: 0 };
		if (isSteady) return { opacity: 1 };
		return { opacity: resolveCaretOpacity(elapsed.value, blinkMs, current.phase !== "holding") };
	});

	if (kind === "bar") {
		return <Animated.View className={cn(caret(), className)} pointerEvents="none" style={style} />;
	}

	return (
		<Animated.View className={cn(caret(), className)} pointerEvents="none" style={style}>
			<Animated.Text className={cn(textClassName, "opacity-0")}>{measureText}</Animated.Text>
		</Animated.View>
	);
}
TextAnimationCaret.displayName = "DelacourUI.TextAnimation.Caret";
