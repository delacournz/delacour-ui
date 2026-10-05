import { type ReactElement, useMemo, useState } from "react";
import type { NativeSyntheticEvent, TextLayoutEventData } from "react-native";
import { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useThemeColor } from "../../hooks/use-theme-color";
import { transparentOf } from "../../lib/color";
import { Text, TextClassProvider, type TextProps, useTextClass } from "../text";
import { resolveTextClass, TEXT_MAX_FONT_SIZE_MULTIPLIER } from "../text/text.variants";
import type { ScrollTextProps, ScrollTextSource } from "./scroll-text.types";
import {
	resolveEffectFrame,
	resolveScrollTextColorTokens,
	resolveScrollTextLayout,
	SCROLL_TEXT_DEFAULT_OVERLAP,
	SCROLL_TEXT_HIGHLIGHT_ALPHA,
	type ScrollTextEffect,
	type ScrollTextGroup,
	scrollTextVariants,
	splitLines,
	splitText,
	withAlpha,
} from "./scroll-text.variants";
import { useScrollTextProgress } from "./scroll-text-source";
import { ScrollTextUnit, type ScrollTextUnitColors } from "./scroll-text-unit";

export type { ScrollTextProps };

const DEFAULT_EFFECT: ScrollTextEffect = { kind: "colour" };
const DEFAULT_SOURCE: ScrollTextSource = { kind: "screen" };

/** A no-break space: a plain one collapses to nothing in a `Text` of its own on some platforms. */
const SPACE_PROBE = " ";

/** Props every unit, the measurer and the placeholder share — never the block's own accessibility. */
type ScrollTextLeafProps = Omit<TextProps, "children" | "style">;

const HIDDEN = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" } as const;

/** Two line lists are equal when every line reads the same — the guard that stops `onTextLayout` looping. */
function sameLines(a: readonly string[] | null, b: readonly string[]): boolean {
	return a !== null && a.length === b.length && a.every((line, index) => line === b[index]);
}

/**
 * The hidden `Text`s the block measures itself with.
 *
 * For `split="line"` it is the full string at the block's real width, reporting
 * its lines through `onTextLayout`; for the others it is one space glyph,
 * reporting its width as the row's `columnGap`. Both stay mounted and transparent,
 * so a width or font-scale change re-measures with no extra wiring.
 */
function ScrollTextMeasure({
	text,
	isLines,
	onLines,
	onSpace,
	...props
}: ScrollTextLeafProps & {
	text: string;
	isLines: boolean;
	onLines: (lines: readonly string[]) => void;
	onSpace: (width: number) => void;
}): ReactElement {
	const slots = scrollTextVariants();

	if (isLines) {
		const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>): void => {
			onLines(event.nativeEvent.lines.map((line) => line.text));
		};

		return (
			<Text className={slots.measure()} onTextLayout={handleTextLayout} {...HIDDEN} {...props}>
				{text}
			</Text>
		);
	}

	return (
		<Text
			className={slots.space()}
			onLayout={(event) => onSpace(event.nativeEvent.layout.width)}
			{...HIDDEN}
			{...props}
		>
			{SPACE_PROBE}
		</Text>
	);
}
ScrollTextMeasure.displayName = "DelacourUI.ScrollText.Measure";

function ScrollTextRoot({
	children,
	effect = DEFAULT_EFFECT,
	split = "word",
	overlap = SCROLL_TEXT_DEFAULT_OVERLAP,
	source = DEFAULT_SOURCE,
	window,
	accessibilityLabel,
	testID,
	align,
	className,
	color,
	size,
	transform,
	variant,
	weight,
	maxFontSizeMultiplier = TEXT_MAX_FONT_SIZE_MULTIPLIER,
	...props
}: ScrollTextProps): ReactElement {
	const inherited = useTextClass();
	const resolved = resolveTextClass({
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

	const isCalm = useCalmMotion();
	const target = useAnimatedRef<Animated.View>();
	const { progress, remeasure } = useScrollTextProgress({ source, window, target, isCalm });

	const [lines, setLines] = useState<readonly string[] | null>(null);
	const [spaceWidth, setSpaceWidth] = useState<number | null>(null);

	const isLines = split === "line";
	const units = useMemo(
		() => (isLines ? splitLines(lines ?? []) : splitText(children, split)),
		[children, split, isLines, lines]
	);
	const layout = useMemo(() => resolveScrollTextLayout(units, split), [units, split]);

	// Both ends of either colour pair are resolved here, once per theme, and handed
	// to every unit as plain strings — so a frame interpolates two constants rather
	// than looking a token up.
	const tokens = resolveScrollTextColorTokens(effect);
	const toColor = useThemeColor(tokens.to ?? "foreground");
	const fromColor = useThemeColor(tokens.from ?? "foreground");
	const bandTo = tokens.isDefaultHighlight ? withAlpha(toColor, SCROLL_TEXT_HIGHLIGHT_ALPHA) : toColor;
	const colors: ScrollTextUnitColors =
		effect.kind === "colour"
			? { textFrom: fromColor, textTo: toColor }
			: effect.kind === "highlight"
				? { bandFrom: tokens.from ? fromColor : transparentOf(bandTo), bandTo }
				: {};

	const isMeasured = isLines ? lines !== null : spaceWidth !== null;
	const slots = scrollTextVariants({ align });
	const leafProps: ScrollTextLeafProps = { maxFontSizeMultiplier, ...props };

	const handleLines = (next: readonly string[]): void => {
		setLines((current) => (sameLines(current, next) ? current : next));
	};

	const unit = (text: string, index: number, key: string, numberOfLines?: number): ReactElement => (
		<ScrollTextUnit
			{...leafProps}
			colors={colors}
			count={layout.count}
			effect={effect}
			index={index}
			isCalm={isCalm}
			key={key}
			numberOfLines={numberOfLines}
			overlap={overlap}
			progress={progress}
			text={text}
		/>
	);

	const renderGroup = (group: ScrollTextGroup, position: number): ReactElement => {
		switch (group.kind) {
			case "line":
				return unit(group.unit.text, group.unit.index, `line-${position}`, 1);
			case "break":
				return group.isBlank ? (
					<Text key={`break-${position}`} {...HIDDEN} {...leafProps}>
						{SPACE_PROBE}
					</Text>
				) : (
					<View className={slots.break()} key={`break-${position}`} />
				);
			case "word":
				return (
					<View className={slots.word()} key={`word-${position}`}>
						{group.units.map((part) => unit(part.text, part.index, `unit-${part.index}`))}
					</View>
				);
		}
	};

	// Until the measurer reports, the plain string stands in at the units' starting
	// look — the floor, or fully revealed under calm motion — so first paint is
	// never blank and never flashes the revealed text before dimming it.
	const resting = resolveEffectFrame(effect, isCalm ? 1 : 0, isCalm);
	const restingColor = effect.kind === "colour" ? (isCalm ? colors.textTo : colors.textFrom) : undefined;

	const body = isMeasured ? (
		<View
			className={isLines ? slots.column() : slots.row()}
			style={isLines ? undefined : { columnGap: spaceWidth ?? 0 }}
			{...HIDDEN}
		>
			{layout.groups.map(renderGroup)}
		</View>
	) : (
		<Text style={{ opacity: resting.opacity, color: restingColor }} {...HIDDEN} {...leafProps}>
			{children}
		</Text>
	);

	return (
		<TextClassProvider value={resolved}>
			<Animated.View
				accessibilityLabel={accessibilityLabel ?? children}
				accessibilityRole="text"
				accessible
				className={slots.root()}
				onLayout={remeasure}
				ref={target}
				testID={testID}
			>
				<ScrollTextMeasure
					isLines={isLines}
					onLines={handleLines}
					onSpace={setSpaceWidth}
					text={children}
					{...leafProps}
				/>
				{body}
			</Animated.View>
		</TextClassProvider>
	);
}

/**
 * Text that resolves unit by unit as the screen scrolls past it — a paragraph
 * going from dim to full colour word by word, a headline whose words rise into
 * place, a sentence highlighted as the reader reaches it.
 *
 * The scroll position is the clock: stop scrolling and it stops. Nothing animates
 * on its own, so there is no loop to still. The text is never hidden — every
 * effect keeps a legible floor, and calm motion pins it fully revealed.
 *
 * Takes `Text`'s axes (`size`, `weight`, `align`, `color`, `variant`, `className`),
 * so it speaks the type scale. `children` is a plain string; the block is one
 * accessibility element that reads the whole string once.
 *
 * @example
 * <Screen.ScrollArea>
 *   <ScrollText size="2xl">We build interfaces that move when you do.</ScrollText>
 * </Screen.ScrollArea>
 *
 * @example
 * <ScrollText effect={{ kind: "rise", distance: 12 }} source={{ kind: "offset", scrollY }}>
 *   Every word arrives on time.
 * </ScrollText>
 *
 * @example
 * <ScrollText source={{ kind: "progress", progress }}>Scrubbed by hand.</ScrollText>
 */
export const ScrollText = Object.assign(ScrollTextRoot, {
	displayName: "DelacourUI.ScrollText",
});
