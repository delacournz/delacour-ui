import { type ReactElement, type ReactNode, useCallback, useState } from "react";
import {
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	View,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { type DerivedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";
import type { DemoEntry } from "@/demos/types";

/** How far a page dims and shrinks over one page of travel away from centre. */
const FOCUS_OPACITY = { centred: 1, gone: 0.3 } as const;
const FOCUS_SCALE = { centred: 1, gone: 0.96 } as const;

export type DemoPageProps = {
	entry: DemoEntry;
	index: number;
	/** Position in pages, continuous. */
	progress: DerivedValue<number>;
	/** The pager's viewport height. 0 until it has measured itself. */
	height: number;
	/** Reports whether this page's own scroll has moved off its top. */
	onInnerScrollChange: (id: string, isScrolled: boolean) => void;
};

/**
 * Dims and shrinks a stage as it leaves the centre of the pager.
 *
 * The one authored moment on this screen, and the thesis of the whole redesign
 * rendered in motion: one demo at a time, at full attention. A page arriving
 * resolves rather than merely arriving, and the demo you are leaving stops
 * competing with it.
 *
 * Applied to the stage rather than to the page box so the box stays exactly one
 * viewport tall — `pagingEnabled` measures that box, and a transform on it
 * would be the pager animating its own snap target.
 */
function FocusedStage({
	index,
	progress,
	children,
}: {
	index: number;
	progress: DerivedValue<number>;
	children: ReactNode;
}): ReactElement {
	const style = useAnimatedStyle(() => {
		const distance = Math.abs(progress.value - index);

		return {
			opacity: interpolate(distance, [0, 1], [FOCUS_OPACITY.centred, FOCUS_OPACITY.gone], "clamp"),
			transform: [{ scale: interpolate(distance, [0, 1], [FOCUS_SCALE.centred, FOCUS_SCALE.gone], "clamp") }],
		};
	});

	return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * Re-centres a stage in the band the keyboard leaves behind.
 *
 * Half the keyboard's height, because the demo is centred rather than flowed:
 * the visible band loses `K` from its bottom, so its midpoint rises by `K / 2`
 * and the stage follows it exactly. `height` is negative while the keyboard is
 * open, which is already the direction of travel.
 *
 * This is why the pager does not use `Screen.ScrollArea`'s `keyboardAware`
 * mode. That scrolls the focused field clear of the keyboard, landing the
 * offset somewhere mid-page — and a paging scroll view immediately snaps it
 * back to the nearest boundary, so the field ends up under the keyboard anyway.
 * A transform moves nothing the pager is measuring.
 *
 * Mounted only for a demo that declares `keyboardAware`, so the other pages in
 * a gallery carry no keyboard subscription at all.
 */
function KeyboardCentredStage({ children }: { children: ReactNode }): ReactElement {
	const keyboard = useReanimatedKeyboardAnimation();

	const style = useAnimatedStyle(() => ({ transform: [{ translateY: keyboard.height.value / 2 }] }));

	return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * One demo, alone, filling exactly one viewport.
 *
 * `overflow-hidden` is not tidiness: the stage is centred in a box of a fixed
 * height, so a demo taller than that box would bleed into the pages either side
 * of it for the frame between layout and the overflow switch below.
 *
 * **The overflow path almost never mounts, and that is the point.** The clear
 * band is around 640pt on a current phone and the tallest demo runs to about
 * 400, so the inner scroll is a small-device and large-accessibility-text path
 * rather than the common one. Measuring first and wrapping second keeps a
 * vertical scroll view out of a vertical pager everywhere it is not needed —
 * two nested scrollables on the same axis is the one gesture conflict this
 * screen can produce.
 *
 * Where it does mount, the page reports its offset up so the pager can stop
 * paging while the inner scroll is engaged. Without that the outer view claims
 * the drag and a tall demo can never be read past its first screenful.
 *
 * The natural height stays readable after the wrap because a scroll view does
 * not constrain its content's height — so the measurement that triggered the
 * switch keeps holding, and the page cannot oscillate between the two branches.
 *
 * The horizontal gutter is the scroll area's own — `screenVariants().scrollContent`
 * puts `px-screen-gutter` on the content container — so a page sets no padding
 * and a demo lines up against the same edge here as it does everywhere else in
 * the app.
 */
export function DemoPage({ entry, index, progress, height, onInnerScrollChange }: DemoPageProps): ReactElement {
	const { Demo, align, id, keyboardAware } = entry;
	const [contentHeight, setContentHeight] = useState(0);

	const onContentLayout = useCallback((event: LayoutChangeEvent) => {
		const measured = event.nativeEvent.layout.height;
		setContentHeight((current) => (Math.abs(current - measured) < 1 ? current : measured));
	}, []);

	const onScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			onInnerScrollChange(id, event.nativeEvent.contentOffset.y > 0.5);
		},
		[id, onInnerScrollChange]
	);

	const measured = (
		<View className={align === "center" ? "items-center" : "items-stretch"} onLayout={onContentLayout}>
			<Demo />
		</View>
	);
	const stage = (
		<FocusedStage index={index} progress={progress}>
			{keyboardAware ? <KeyboardCentredStage>{measured}</KeyboardCentredStage> : measured}
		</FocusedStage>
	);

	if (height > 0 && contentHeight > height) {
		return (
			<View className="overflow-hidden" style={{ height }}>
				<ScrollView
					bounces={false}
					nestedScrollEnabled
					onScroll={onScroll}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
				>
					{stage}
				</ScrollView>
			</View>
		);
	}

	return (
		<View className="justify-center overflow-hidden" style={{ height: height > 0 ? height : undefined }}>
			{stage}
		</View>
	);
}
