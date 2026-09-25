import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import type { HapticFeedback } from "../pressable";
import { type RatingContextValue, RatingProvider, type RatingRenderProps } from "./rating.context";
import {
	clampRating,
	normalizeRatingCount,
	normalizeRatingStep,
	type RatingColor,
	type RatingSize,
	ratingVariants,
	resolveRatingAxes,
} from "./rating.variants";
import { RatingOutput } from "./rating-output";
import { RatingStars } from "./rating-stars";

export type RatingProps = Omit<ViewProps, "children"> & {
	/** Controlled value. Any number is drawn; only `step` limits what a touch can set. */
	value?: number;
	/** Starting value while uncontrolled. */
	defaultValue?: number;
	/** How many stars. A fraction rounds down; anything that is not a count falls back to 5. */
	maxValue?: number;
	/** The increment a touch snaps to — `1` for whole stars, `0.5` for halves. Must divide one star. */
	step?: number;
	/** What a filled star means. */
	color?: RatingColor;
	size?: RatingSize;
	/** Blocks the gesture and fades the control. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Paints the stars destructive. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Shows the score without taking a touch, and without fading. */
	isReadOnly?: boolean;
	/** A tap on the value already held clears it back to zero. */
	allowClear?: boolean;
	/** Played on grab, on every star crossed and on a clear. `false` silences it. */
	haptic?: false | HapticFeedback;
	/** Fires on every change during a drag. */
	onChange?: (value: number) => void;
	/** Fires once, when the gesture ends. Where a network write belongs. */
	onChangeEnd?: (value: number) => void;
	children?: ReactNode;
};

function RatingRoot({
	value,
	defaultValue = 0,
	maxValue,
	step,
	color,
	size,
	isDisabled,
	isInvalid,
	isReadOnly,
	allowClear = false,
	haptic = "selection",
	onChange,
	onChangeEnd,
	className,
	children,
	...props
}: RatingProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveRatingAxes({ field, own: { color, isDisabled, isInvalid, isReadOnly, size } });
	const count = normalizeRatingCount(maxValue);
	const settledStep = normalizeRatingStep(step);

	const [current, setCurrent] = useControllableState<number>({ defaultValue, onChange, value });
	const settled = clampRating(current, count);

	const commitEnd = useCallback((next: number) => onChangeEnd?.(next), [onChangeEnd]);

	const renderProps = useMemo<RatingRenderProps>(
		() => ({
			count,
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isReadOnly: axes.isReadOnly,
			step: settledStep,
			value: settled,
		}),
		[axes.isDisabled, axes.isInvalid, axes.isReadOnly, count, settled, settledStep]
	);

	const context = useMemo<RatingContextValue>(
		() => ({
			...renderProps,
			allowClear,
			color: axes.color,
			commitEnd,
			haptic,
			renderProps,
			setValue: setCurrent,
			size: axes.size,
		}),
		[allowClear, axes.color, axes.size, commitEnd, haptic, renderProps, setCurrent]
	);

	return (
		<RatingProvider value={context}>
			<View className={ratingVariants({ isDisabled: axes.isDisabled, size: axes.size }).root({ className })} {...props}>
				{children}
			</View>
		</RatingProvider>
	);
}

/**
 * A row of stars that reads or sets a score.
 *
 * The anatomy is written out: a `Rating.Stars` row, with an optional
 * `Rating.Output` beside or below it. The root is a plain column, so a readout
 * on the same line is a `className="flex-row items-center"` away.
 *
 * **The whole row is the target.** Touching down takes the star under the
 * finger, and dragging along the row follows it — one rule, not a tap mode and a
 * drag mode. `step={0.5}` splits every star at its centre. `allowClear` lets a
 * tap on the value already held withdraw the rating.
 *
 * **Any value is drawn; only a touch is snapped.** A read-only average of 3.7
 * fills three stars and seven tenths of the fourth, while a finger on the same
 * control can land only on the stops `step` allows. A non-finite value draws as
 * zero rather than breaking the row.
 *
 * **State works either way from one hook**: pass `value` to control it, or
 * `defaultValue` and let it hold its own. `onChange` fires as a drag crosses
 * each star; `onChangeEnd` fires once when the gesture ends.
 *
 * `isInvalid` and `isDisabled` cascade in from an enclosing `Field`, and an
 * explicit prop still wins. `isReadOnly` is the rating's own: it takes no touch
 * and does not fade, because a score on a review card is content, not a control
 * that happens to be off.
 *
 * To assistive technology the row is one `adjustable` control whose swipe up and
 * down step the value — see `Rating.Stars`.
 *
 * @example
 * <Rating defaultValue={3}>
 *   <Rating.Stars accessibilityLabel="Your rating" />
 * </Rating>
 *
 * @example
 * <Rating allowClear onChange={setScore} step={0.5} value={score}>
 *   <Rating.Stars accessibilityLabel="Rate this recipe" />
 *   <Rating.Output />
 * </Rating>
 *
 * @example
 * <Rating className="flex-row items-center gap-2" isReadOnly size="sm" value={4.3}>
 *   <Rating.Stars accessibilityLabel="Average rating" />
 *   <Rating.Output>{({ value }) => `${value.toFixed(1)} · 128 reviews`}</Rating.Output>
 * </Rating>
 */
export const Rating = Object.assign(RatingRoot, {
	/** The row of stars — the drag surface, and the whole accessibility surface. */
	Stars: RatingStars,
	/** The value, formatted. Give it a function to label it yourself. */
	Output: RatingOutput,
	displayName: "DelacourUI.Rating",
});
